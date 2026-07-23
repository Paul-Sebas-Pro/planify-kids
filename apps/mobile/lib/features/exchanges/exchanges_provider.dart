import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../database/database.dart';
import '../../models/exchange.dart';
import '../../models/family_member.dart';
import '../../shared/providers/providers.dart';

part 'exchanges_provider.g.dart';

const _exchangesQuery = '''
  SELECT e.id, e.schedule_item_id, e.from_member_id, e.to_member_id, e.status,
         e.created_at,
         si.date as si_date, si.assigned_to_member_id as si_assigned_to_member_id,
         t.name as si_task_name, t.icon as si_task_icon, t.points as si_task_points
  FROM exchanges e
  LEFT JOIN schedule_items si ON si.id = e.schedule_item_id
  LEFT JOIN tasks t ON t.id = si.task_id
  ORDER BY e.created_at DESC
''';

@riverpod
class ExchangesNotifier extends _$ExchangesNotifier {
  @override
  Stream<List<Exchange>> build() async* {
    final db = ref.watch(powerSyncDatabaseProvider);
    await awaitInitialSync(db);
    yield* db
        .watch(_exchangesQuery)
        .map((rows) => rows.map(Exchange.fromLocalRow).toList());
  }

  Future<void> respond(String exchangeId, String status) async {
    final api = ref.read(apiClientProvider);
    await api.respondExchange(exchangeId, status);
  }

  Future<void> propose({
    required String scheduleItemId,
    required String fromMemberId,
    required String toMemberId,
  }) async {
    final api = ref.read(apiClientProvider);
    await api.proposeExchange(
      scheduleItemId: scheduleItemId,
      fromMemberId: fromMemberId,
      toMemberId: toMemberId,
    );
  }
}

@riverpod
Stream<List<FamilyMember>> familyMembers(Ref ref) async* {
  final db = ref.watch(powerSyncDatabaseProvider);
  await awaitInitialSync(db);
  yield* db
      .watch(
        'SELECT id, name, role, points, color, avatar, family_id FROM family_members',
      )
      .map((rows) => rows.map(FamilyMember.fromLocalRow).toList());
}
