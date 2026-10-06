import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/tasks/task_card.dart';
import 'package:mobile/models/schedule_item.dart';

void main() {
  final pendingItem = ScheduleItem(
    id: 'item-1',
    taskId: 'task-1',
    taskName: 'Ranger sa chambre',
    taskIcon: '🛏️',
    taskPoints: 10,
    assignedToMemberId: 'member-1',
    date: DateTime(2026, 6, 16),
    status: 'PENDING',
  );

  final completedItem = pendingItem.copyWith(status: 'COMPLETED');

  Widget wrap(Widget child) =>
      MaterialApp(home: Scaffold(body: child));

  group('TaskCard', () {
    testWidgets('affiche nom et points', (tester) async {
      await tester.pumpWidget(wrap(TaskCard(item: pendingItem)));
      expect(find.text('Ranger sa chambre'), findsOneWidget);
      expect(find.text('+10 pts'), findsOneWidget);
    });

    testWidgets('PENDING — bouton Fait ! visible, chip Fait ✓ absent',
        (tester) async {
      await tester.pumpWidget(
        wrap(TaskCard(item: pendingItem, onComplete: () {})),
      );
      expect(find.text('Fait !'), findsOneWidget);
      expect(find.text('Fait ✓'), findsNothing);
    });

    testWidgets('COMPLETED — chip Fait ✓ visible, bouton Fait ! absent',
        (tester) async {
      await tester.pumpWidget(wrap(TaskCard(item: completedItem)));
      expect(find.text('Fait ✓'), findsOneWidget);
      expect(find.text('Fait !'), findsNothing);
    });

    testWidgets('COMPLETED avec onUndo — icône annuler visible',
        (tester) async {
      await tester.pumpWidget(
        wrap(TaskCard(item: completedItem, onUndo: () {})),
      );
      expect(find.byIcon(Icons.undo), findsOneWidget);
    });

    testWidgets('tap Fait ! déclenche onComplete et la gerbe +pts',
        (tester) async {
      var called = false;
      await tester.pumpWidget(
        wrap(TaskCard(item: pendingItem, onComplete: () => called = true)),
      );
      await tester.tap(find.text('Fait !'));
      await tester.pump(const Duration(milliseconds: 100));
      expect(called, isTrue);
      // "+10 pts" sur la carte + celui qui s'envole dans l'overlay.
      expect(find.text('+10 pts'), findsNWidgets(2));

      // L'overlay se retire seul à la fin de l'animation.
      await tester.pump(const Duration(seconds: 2));
      expect(find.text('+10 pts'), findsOneWidget);
    });

    testWidgets('réduire les animations — pas de gerbe', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: MediaQuery(
            data: const MediaQueryData(disableAnimations: true),
            child: Scaffold(
              body: TaskCard(item: pendingItem, onComplete: () {}),
            ),
          ),
        ),
      );
      await tester.tap(find.text('Fait !'));
      await tester.pump(const Duration(milliseconds: 100));
      expect(find.text('+10 pts'), findsOneWidget);
    });

    testWidgets('sans onComplete — aucun bouton', (tester) async {
      await tester.pumpWidget(wrap(TaskCard(item: pendingItem)));
      expect(find.byType(FilledButton), findsNothing);
    });
  });
}
