import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:mobile/features/auth/auth_provider.dart';
import 'package:mobile/features/exchanges/exchanges_provider.dart';
import 'package:mobile/features/tasks/tasks_provider.dart';
import 'package:mobile/features/tasks/today_screen.dart';
import 'package:mobile/models/auth_user.dart';
import 'package:mobile/models/exchange.dart';
import 'package:mobile/models/family_member.dart';
import 'package:mobile/models/schedule_item.dart';
import 'package:mobile/shared/providers/my_points_provider.dart';
import 'package:mobile/shared/providers/providers.dart';
import 'package:mobile/shared/services/secure_storage.dart';

// Fakes -----------------------------------------------------------------------

class _FakeAuthNotifier extends AuthNotifier {
  final AuthUser? _user;
  _FakeAuthNotifier(this._user);

  @override
  Future<AuthUser?> build() async => _user;
}

class _FakeTasksNotifier extends TasksNotifier {
  final AsyncValue<List<ScheduleItem>> _value;
  _FakeTasksNotifier(this._value);

  @override
  Future<List<ScheduleItem>> build() async {
    if (_value case AsyncData(:final value)) return value;
    if (_value case AsyncError(:final error, :final stackTrace)) {
      Error.throwWithStackTrace(error, stackTrace);
    }
    // Loading: future that never completes, no timer pending.
    return Completer<List<ScheduleItem>>().future;
  }

  @override
  Future<void> markCompleted(String itemId) async {
    final items = state.value ?? [];
    state = AsyncData([
      for (final i in items)
        i.id == itemId ? i.copyWith(status: 'COMPLETED') : i,
    ]);
  }
}

class _FakeStorage extends SecureStorageService {
  bool hintSeen;
  _FakeStorage({this.hintSeen = true});

  @override
  Future<bool> getExchangeDragHintSeen() async => hintSeen;

  @override
  Future<void> saveExchangeDragHintSeen() async => hintSeen = true;
}

class _FakeExchangesNotifier extends ExchangesNotifier {
  final List<Exchange> initial;
  final proposals = <(String, String, String)>[];
  Object? failWith;
  _FakeExchangesNotifier(this.initial);

  @override
  Stream<List<Exchange>> build() => Stream.value(initial);

  @override
  Future<void> propose({
    required String scheduleItemId,
    required String fromMemberId,
    required String toMemberId,
  }) async {
    proposals.add((scheduleItemId, fromMemberId, toMemberId));
    final error = failWith;
    if (error != null) throw error;
  }
}

const _tom = FamilyMember(
  id: 'tom-id',
  name: 'Tom',
  role: 'CHILD',
  familyId: 'fam-1',
  color: '#4CAF50',
);

final _alice = AuthUser(
  id: 'alice-id',
  name: 'Alice',
  role: 'CHILD',
  familyId: 'fam-1',
  color: '#FF6584',
  points: 0,
);

final _task = ScheduleItem(
  id: 'item-1',
  taskId: 'task-1',
  taskName: 'Ranger sa chambre',
  taskIcon: '🛏️',
  taskPoints: 10,
  assignedToMemberId: 'alice-id',
  date: DateTime(2026, 6, 16),
  status: 'PENDING',
);

Widget _wrap({
  required AsyncValue<List<ScheduleItem>> tasks,
  AuthUser? user,
  Stream<int>? points,
  List<FamilyMember> members = const [],
  _FakeExchangesNotifier? exchanges,
  _FakeStorage? storage,
}) {
  return ProviderScope(
    overrides: [
      authProvider.overrideWith(() => _FakeAuthNotifier(user ?? _alice)),
      tasksProvider.overrideWith(() => _FakeTasksNotifier(tasks)),
      myPointsProvider.overrideWith((ref) => points ?? Stream.value(0)),
      familyMembersProvider.overrideWith((ref) => Stream.value(members)),
      exchangesProvider
          .overrideWith(() => exchanges ?? _FakeExchangesNotifier(const [])),
      secureStorageServiceProvider
          .overrideWithValue(storage ?? _FakeStorage()),
    ],
    child: const MaterialApp(home: TodayScreen()),
  );
}

// Tests -----------------------------------------------------------------------

void main() {
  setUpAll(() => initializeDateFormatting('fr_FR'));

  group('TodayScreen', () {
    testWidgets('loading — spinner visible', (tester) async {
      await tester.pumpWidget(
        _wrap(tasks: const AsyncLoading()),
      );
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('liste vide — message Aucune tâche', (tester) async {
      await tester.pumpWidget(_wrap(tasks: const AsyncData([])));
      await tester.pump();
      expect(find.text("Aucune tâche aujourd'hui !"), findsOneWidget);
    });

    testWidgets('avec tâches — TaskCard visible', (tester) async {
      await tester.pumpWidget(_wrap(tasks: AsyncData([_task])));
      await tester.pump();
      expect(find.text('Ranger sa chambre'), findsOneWidget);
      expect(find.text('Fait !'), findsOneWidget);
    });

    testWidgets('dernière tâche cochée — célébration plein écran',
        (tester) async {
      await tester.pumpWidget(_wrap(tasks: AsyncData([_task])));
      await tester.pump();
      await tester.tap(find.text('Fait !'));
      await tester.pump(const Duration(milliseconds: 800));
      await tester.pump(const Duration(milliseconds: 400));
      expect(find.text('Toutes tes tâches du jour sont faites !'),
          findsOneWidget);

      // Se ferme seule.
      await tester.pump(const Duration(seconds: 4));
      await tester.pump(const Duration(milliseconds: 400));
      expect(find.text('Toutes tes tâches du jour sont faites !'),
          findsNothing);
    });

    testWidgets('tâche cochée mais pas la dernière — pas de célébration',
        (tester) async {
      final other = ScheduleItem(
        id: 'item-2',
        taskId: 'task-2',
        taskName: 'Mettre la table',
        taskIcon: '🍽️',
        taskPoints: 5,
        assignedToMemberId: 'alice-id',
        date: DateTime(2026, 6, 16),
        status: 'PENDING',
      );
      await tester.pumpWidget(_wrap(tasks: AsyncData([_task, other])));
      await tester.pump();
      await tester.tap(find.text('Fait !').first);
      await tester.pump(const Duration(seconds: 2));
      expect(find.text('Toutes tes tâches du jour sont faites !'),
          findsNothing);
    });

    testWidgets('bandeau — points suivis en direct, pas ceux du login',
        (tester) async {
      final points = StreamController<int>();
      addTearDown(points.close);
      await tester.pumpWidget(
        _wrap(tasks: AsyncData([_task]), points: points.stream),
      );
      points.add(40);
      await tester.pump();
      expect(find.text('40 pts'), findsOneWidget);

      // Points crédités par le serveur, reçus par la sync.
      points.add(50);
      await tester.pump();
      expect(find.text('50 pts'), findsOneWidget);
    });

    Future<void> dragTaskToTom(WidgetTester tester) async {
      final gesture = await tester
          .startGesture(tester.getCenter(find.text('Ranger sa chambre')));
      await tester.pump(kLongPressTimeout + const Duration(milliseconds: 100));
      await gesture.moveBy(const Offset(0, 20));
      await tester.pump(const Duration(milliseconds: 300)); // bandeau monté
      expect(find.text('Échanger avec…'), findsOneWidget);
      await gesture.moveTo(tester.getCenter(find.text('T')));
      await tester.pump();
      await gesture.up();
      await tester.pumpAndSettle();
    }

    testWidgets('glisser une tâche sur un frère — confirmation puis proposition',
        (tester) async {
      final exchanges = _FakeExchangesNotifier(const []);
      await tester.pumpWidget(_wrap(
        tasks: AsyncData([_task]),
        members: [_tom],
        exchanges: exchanges,
      ));
      await tester.pump();

      await dragTaskToTom(tester);
      expect(find.text('Proposer à Tom d\'échanger « Ranger sa chambre » ?'),
          findsOneWidget);

      await tester.tap(find.widgetWithText(FilledButton, 'Proposer'));
      await tester.pumpAndSettle();

      expect(exchanges.proposals, [('item-1', 'alice-id', 'tom-id')]);
      expect(find.text('Proposition envoyée à Tom'), findsOneWidget);
      expect(find.text('↔ Échange en cours'), findsOneWidget);
    });

    testWidgets('glisser puis Annuler — aucune proposition', (tester) async {
      final exchanges = _FakeExchangesNotifier(const []);
      await tester.pumpWidget(_wrap(
        tasks: AsyncData([_task]),
        members: [_tom],
        exchanges: exchanges,
      ));
      await tester.pump();

      await dragTaskToTom(tester);
      await tester.tap(find.text('Annuler'));
      await tester.pumpAndSettle();

      expect(exchanges.proposals, isEmpty);
    });

    testWidgets('hors ligne — message « Il faut Internet »', (tester) async {
      final exchanges = _FakeExchangesNotifier(const [])
        ..failWith = DioException(
          requestOptions: RequestOptions(path: '/exchanges'),
          type: DioExceptionType.connectionError,
        );
      await tester.pumpWidget(_wrap(
        tasks: AsyncData([_task]),
        members: [_tom],
        exchanges: exchanges,
      ));
      await tester.pump();

      await dragTaskToTom(tester);
      await tester.tap(find.widgetWithText(FilledButton, 'Proposer'));
      await tester.pumpAndSettle();

      expect(find.text('Il faut Internet pour proposer un échange'),
          findsOneWidget);
      expect(find.text('↔ Échange en cours'), findsNothing);
    });

    testWidgets('échange déjà en cours — mention affichée, pas de glisser',
        (tester) async {
      final pendingExchange = Exchange(
        id: 'ex-1',
        scheduleItemId: 'item-1',
        fromMemberId: 'alice-id',
        toMemberId: 'tom-id',
        status: 'PENDING',
        createdAt: DateTime(2026, 6, 16),
      );
      await tester.pumpWidget(_wrap(
        tasks: AsyncData([_task]),
        members: [_tom],
        exchanges: _FakeExchangesNotifier([pendingExchange]),
      ));
      await tester.pump();

      expect(find.text('↔ Échange en cours'), findsOneWidget);
      expect(find.byType(LongPressDraggable<ScheduleItem>), findsNothing);
    });

    testWidgets('astuce affichée tant qu\'aucun échange n\'a été glissé',
        (tester) async {
      await tester.pumpWidget(_wrap(
        tasks: AsyncData([_task]),
        members: [_tom],
        storage: _FakeStorage(hintSeen: false),
      ));
      await tester.pump();
      await tester.pump();

      expect(find.textContaining('appuie longuement'), findsOneWidget);
    });

    testWidgets('enfant unique — pas de glisser ni d\'astuce', (tester) async {
      await tester.pumpWidget(_wrap(
        tasks: AsyncData([_task]),
        storage: _FakeStorage(hintSeen: false),
      ));
      await tester.pump();
      await tester.pump();

      expect(find.byType(LongPressDraggable<ScheduleItem>), findsNothing);
      expect(find.textContaining('appuie longuement'), findsNothing);
    });

    testWidgets('bouton logout présent dans AppBar', (tester) async {
      await tester.pumpWidget(_wrap(tasks: const AsyncData([])));
      await tester.pump();
      expect(find.byIcon(Icons.logout), findsOneWidget);
    });
  });
}
