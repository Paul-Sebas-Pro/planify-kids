import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../database/database.dart';
import '../../features/auth/auth_provider.dart';
import 'providers.dart';

part 'my_points_provider.g.dart';

/// Points du membre connecté, suivis en direct.
///
/// `AuthUser.points` n'est qu'une copie figée au login : les points crédités
/// (tâche faite) ou débités (récompense) par le serveur n'y apparaissent
/// jamais. La table locale `family_members` est, elle, tenue à jour par la
/// sync PowerSync. Repli sur la valeur du login tant que la ligne locale
/// n'existe pas (avant 1re sync, PowerSync non configuré).
@riverpod
Stream<int> myPoints(Ref ref) async* {
  final user = ref.watch(authProvider).value;
  if (user == null) {
    yield 0;
    return;
  }
  yield user.points;

  final db = ref.watch(powerSyncDatabaseProvider);
  await awaitInitialSync(db);
  yield* db
      .watch(
        'SELECT points FROM family_members WHERE id = ?',
        parameters: [user.id],
      )
      .map((rows) =>
          rows.isEmpty ? user.points : (rows.first['points'] as int? ?? 0));
}
