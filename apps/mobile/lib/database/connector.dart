import 'package:powersync/powersync.dart';
import '../config/env.dart';
import '../shared/services/secure_storage.dart';

class PlanifyConnector extends PowerSyncBackendConnector {
  final SecureStorageService _storage;

  PlanifyConnector(this._storage);

  @override
  Future<PowerSyncCredentials?> fetchCredentials() async {
    if (Env.powerSyncUrl.isEmpty) return null;
    final token = await _storage.getToken();
    if (token == null) return null;
    return PowerSyncCredentials(endpoint: Env.powerSyncUrl, token: token);
  }

  @override
  Future<void> uploadData(PowerSyncDatabase database) async {
    // Mutations go directly via REST API — nothing to upload here.
  }
}
