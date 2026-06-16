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
      expect(find.text('10 pts'), findsOneWidget);
    });

    testWidgets('PENDING — bouton Fait! visible, check absent', (tester) async {
      await tester.pumpWidget(wrap(TaskCard(item: pendingItem)));
      expect(find.text('Fait !'), findsOneWidget);
      expect(find.byIcon(Icons.check_circle), findsNothing);
    });

    testWidgets('COMPLETED — check visible, bouton Fait! absent', (tester) async {
      await tester.pumpWidget(wrap(TaskCard(item: completedItem)));
      expect(find.byIcon(Icons.check_circle), findsOneWidget);
      expect(find.text('Fait !'), findsNothing);
    });

    testWidgets('tap Fait! déclenche onComplete', (tester) async {
      var called = false;
      await tester.pumpWidget(
        wrap(TaskCard(item: pendingItem, onComplete: () => called = true)),
      );
      await tester.tap(find.text('Fait !'));
      expect(called, isTrue);
    });

    testWidgets('sans onComplete — bouton désactivé', (tester) async {
      await tester.pumpWidget(wrap(TaskCard(item: pendingItem)));
      final btn = tester.widget<FilledButton>(
        find.widgetWithText(FilledButton, 'Fait !'),
      );
      expect(btn.onPressed, isNull);
    });
  });
}
