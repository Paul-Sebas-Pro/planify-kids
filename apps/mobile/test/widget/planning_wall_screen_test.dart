import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:mobile/features/planning_wall/planning_wall_provider.dart';
import 'package:mobile/features/planning_wall/planning_wall_screen.dart';
import 'package:mobile/models/family_member.dart';
import 'package:mobile/models/schedule_item.dart';

// Fixtures ---------------------------------------------------------------

final _alice = FamilyMember(
  id: 'alice-id',
  name: 'Alice',
  role: 'CHILD',
  familyId: 'fam-1',
  color: '#FF6584',
);

final _bob = FamilyMember(
  id: 'bob-id',
  name: 'Bob',
  role: 'CHILD',
  familyId: 'fam-1',
  color: '#42A5F5',
);

final _noonTask = ScheduleItem(
  id: 'item-1',
  taskId: 'task-1',
  taskName: 'Mettre la table',
  taskIcon: '🍽️',
  taskPoints: 5,
  assignedToMemberId: 'alice-id',
  date: DateTime(2026, 6, 16),
  status: 'PENDING',
  slot: 'NOON',
);

final _eveningTaskDone = ScheduleItem(
  id: 'item-2',
  taskId: 'task-2',
  taskName: 'Ranger sa chambre',
  taskIcon: '🛏️',
  taskPoints: 10,
  assignedToMemberId: 'bob-id',
  date: DateTime(2026, 6, 16),
  status: 'COMPLETED',
  slot: 'EVENING',
);

Widget _wrap({
  required AsyncValue<List<ScheduleItem>> items,
  List<FamilyMember> members = const [],
}) {
  return ProviderScope(
    overrides: [
      weekPlanningProvider.overrideWith((ref) {
        if (items case AsyncData(:final value)) return Stream.value(value);
        if (items case AsyncError(:final error, :final stackTrace)) {
          return Stream<List<ScheduleItem>>.error(error, stackTrace);
        }
        return const Stream<List<ScheduleItem>>.empty();
      }),
      planningWallMembersProvider.overrideWith((ref) => Stream.value(members)),
    ],
    child: const MaterialApp(home: PlanningWallScreen()),
  );
}

// Tests --------------------------------------------------------------------

void main() {
  setUpAll(() => initializeDateFormatting('fr_FR'));

  group('PlanningWallScreen', () {
    testWidgets('chargement — spinner visible', (tester) async {
      await tester.pumpWidget(_wrap(items: const AsyncLoading()));
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('planning vide — message affiché', (tester) async {
      await tester.pumpWidget(_wrap(items: const AsyncData([])));
      await tester.pump();
      expect(find.text('Aucun planning généré pour le moment.'), findsOneWidget);
    });

    testWidgets('erreur — message + bouton réessayer', (tester) async {
      await tester.pumpWidget(
        _wrap(items: AsyncError(Exception('boom'), StackTrace.current)),
      );
      await tester.pumpAndSettle();
      expect(find.text('Une erreur est survenue.'), findsOneWidget);
      expect(find.text('Réessayer'), findsOneWidget);
    });

    testWidgets('avec tâches — groupé par jour, Midi/Soir, membres visibles',
        (tester) async {
      await tester.pumpWidget(_wrap(
        items: AsyncData([_noonTask, _eveningTaskDone]),
        members: [_alice, _bob],
      ));
      await tester.pump();

      expect(find.text('Midi'), findsOneWidget);
      expect(find.text('Soir'), findsOneWidget);
      // Alice/Bob apparaissent 2x chacun : chip de filtre + ligne tâche du jour.
      expect(find.text('Alice'), findsNWidgets(2));
      expect(find.text('Bob'), findsNWidgets(2));
      expect(find.textContaining('Mettre la table'), findsOneWidget);
      expect(find.textContaining('Ranger sa chambre'), findsOneWidget);
      expect(find.text('+5'), findsOneWidget);
      expect(find.byIcon(Icons.check_circle), findsOneWidget);
    });
  });
}
