import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:mobile/features/auth/auth_provider.dart';
import 'package:mobile/features/tasks/tasks_provider.dart';
import 'package:mobile/features/tasks/today_screen.dart';
import 'package:mobile/models/auth_user.dart';
import 'package:mobile/models/schedule_item.dart';

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
}

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
}) {
  return ProviderScope(
    overrides: [
      authProvider.overrideWith(() => _FakeAuthNotifier(user ?? _alice)),
      tasksProvider.overrideWith(() => _FakeTasksNotifier(tasks)),
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

    testWidgets('bouton logout présent dans AppBar', (tester) async {
      await tester.pumpWidget(_wrap(tasks: const AsyncData([])));
      await tester.pump();
      expect(find.byIcon(Icons.logout), findsOneWidget);
    });
  });
}
