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
