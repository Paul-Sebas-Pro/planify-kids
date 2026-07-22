import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../database/database.dart';
import '../../models/schedule_item.dart';
import '../../shared/providers/providers.dart';
import '../auth/auth_provider.dart';

part 'tasks_provider.g.dart';

@riverpod
Stream<List<ScheduleItem>> todayTasks(Ref ref) async* {
  final user = ref.watch(authProvider).value;
  if (user == null) {
    yield [];
    return;
  }

  final db = ref.watch(powerSyncDatabaseProvider);
  await awaitInitialSync(db);

  final today = DateTime.now().toIso8601String().split('T').first;
  yield* db
      .watch(
        '''
        SELECT si.id, si.task_id, t.name as task_name, t.icon as task_icon,
               t.points as task_points, si.assigned_to_member_id, si.date,
               si.slot, si.status
        FROM schedule_items si
        LEFT JOIN tasks t ON t.id = si.task_id
        WHERE si.assigned_to_member_id = ? AND si.date LIKE ?
        ''',
        parameters: [user.id, '$today%'],
      )
      .map((rows) => rows.map(ScheduleItem.fromLocalRow).toList());
}

@riverpod
class TasksNotifier extends _$TasksNotifier {
  @override
  Future<List<ScheduleItem>> build() async {
    return ref.watch(todayTasksProvider.future);
  }

  Future<void> markCompleted(String itemId) async {
    final db = ref.read(powerSyncDatabaseProvider);
    await db.execute(
      'UPDATE schedule_items SET status = ? WHERE id = ?',
      ['COMPLETED', itemId],
    );
  }

  Future<void> markPending(String itemId) async {
    final db = ref.read(powerSyncDatabaseProvider);
    await db.execute(
      'UPDATE schedule_items SET status = ? WHERE id = ?',
      ['PENDING', itemId],
    );
  }
}
