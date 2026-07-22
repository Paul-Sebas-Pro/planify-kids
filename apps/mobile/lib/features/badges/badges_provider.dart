import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../database/database.dart';
import '../../models/badge.dart';
import '../../shared/providers/providers.dart';
import '../auth/auth_provider.dart';

part 'badges_provider.g.dart';

@riverpod
Stream<List<MemberBadge>> memberBadges(Ref ref) async* {
  final user = ref.watch(authProvider).value;
  if (user == null) {
    yield [];
    return;
  }

  final db = ref.watch(powerSyncDatabaseProvider);
  await awaitInitialSync(db);

  yield* db
      .watch(
        '''
        SELECT mb.id, mb.earned_at, b.id as badge_id, b.name as badge_name,
               b.icon as badge_icon, b.description as badge_description,
               b.condition_type as badge_condition_type,
               b.condition_value as badge_condition_value
        FROM member_badges mb
        JOIN badges b ON b.id = mb.badge_id
        WHERE mb.member_id = ?
        ''',
        parameters: [user.id],
      )
      .map((rows) => rows.map(MemberBadge.fromLocalRow).toList());
}
