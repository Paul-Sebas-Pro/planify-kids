import 'package:path/path.dart';
import 'package:path_provider/path_provider.dart';
import 'package:powersync/powersync.dart';
import '../config/env.dart';
import 'connector.dart';
import 'schema.dart';

late PowerSyncDatabase appDatabase;

Future<PowerSyncDatabase> openAppDatabase(PlanifyConnector connector) async {
  final dir = await getApplicationDocumentsDirectory();
  final path = join(dir.path, 'planify.db');

  appDatabase = PowerSyncDatabase(schema: appSchema, path: path);
  await appDatabase.initialize();

  if (Env.powerSyncUrl.isNotEmpty) {
    await appDatabase.connect(connector: connector);
  }

  return appDatabase;
}

/// Attend la 1ère synchronisation complète avant de lire les tables locales
/// (évite un flash "aucune donnée" trompeur au premier lancement). Si
/// PowerSync n'est pas configuré (`POWERSYNC_URL` vide — pas encore
/// d'instance créée, ou tests), la DB locale ne se connectera jamais : ne
/// pas attendre indéfiniment, lire directement (tables vides tant que
/// PowerSync n'est pas actif).
Future<void> awaitInitialSync(PowerSyncDatabase db) async {
  if (Env.powerSyncUrl.isEmpty) return;
  if (db.currentStatus.hasSynced == true) return;
  await db.statusStream.firstWhere((s) => s.hasSynced == true);
}
