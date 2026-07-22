import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../database/database.dart';
import '../../models/family_member.dart';
import '../../models/schedule_item.dart';
import '../../shared/providers/providers.dart';

part 'planning_wall_provider.g.dart';

// Semaine calendaire courante (lundi→dimanche) — le schema PowerSync local
// n'a pas de table `schedules`, donc pas de sélection possible du Schedule
// couvrant "aujourd'hui" comme le fait ApiClient.getWeekSchedule(). Ce
// filtrage par plage de dates est équivalent dans le cas normal (planning
// généré à la semaine calendaire).
({DateTime start, DateTime end}) _currentWeekRange() {
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  final monday = today.subtract(Duration(days: today.weekday - 1));
  final nextMonday = monday.add(const Duration(days: 7));
  return (start: monday, end: nextMonday);
}

@riverpod
Stream<List<ScheduleItem>> weekPlanning(Ref ref) async* {
  final db = ref.watch(powerSyncDatabaseProvider);
  await awaitInitialSync(db);

  final range = _currentWeekRange();
  yield* db
      .watch(
        '''
        SELECT si.id, si.task_id, t.name as task_name, t.icon as task_icon,
               t.points as task_points, si.assigned_to_member_id, si.date,
               si.slot, si.status
        FROM schedule_items si
        LEFT JOIN tasks t ON t.id = si.task_id
        WHERE si.date >= ? AND si.date < ?
        ''',
        parameters: [
          range.start.toIso8601String(),
          range.end.toIso8601String(),
        ],
      )
      .map((rows) => rows.map(ScheduleItem.fromLocalRow).toList());
}

@riverpod
Stream<List<FamilyMember>> planningWallMembers(Ref ref) async* {
  final db = ref.watch(powerSyncDatabaseProvider);
  await awaitInitialSync(db);

  yield* db
      .watch(
        'SELECT id, name, role, points, color, avatar, family_id FROM family_members',
      )
      .map((rows) => rows.map(FamilyMember.fromLocalRow).toList());
}
