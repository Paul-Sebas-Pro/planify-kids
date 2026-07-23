import 'package:powersync/powersync.dart';
import '../config/env.dart';
import '../shared/services/api_client.dart';

class PlanifyConnector extends PowerSyncBackendConnector {
  final ApiClient _api;

  PlanifyConnector(this._api);

  @override
  Future<PowerSyncCredentials?> fetchCredentials() async {
    if (Env.powerSyncUrl.isEmpty) return null;
    // Contrat PowerSync (connector.dart du SDK) : retourner null signifie
    // "utilisateur non connecté" (arrête les tentatives) — une erreur
    // réseau/temporaire doit être levée pour déclencher un retry, jamais
    // avalée en silence (sinon le token expiré reste en cache indéfiniment,
    // cf. PSYNC_S2103 observé en réel).
    final token = await _api.fetchPowerSyncToken();
    return PowerSyncCredentials(endpoint: Env.powerSyncUrl, token: token);
  }

  @override
  Future<void> uploadData(PowerSyncDatabase database) async {
    while (true) {
      final batch = await database.getCrudBatch();
      if (batch == null) return;

      for (final entry in batch.crud) {
        if (entry.table == 'schedule_items') {
          final status = entry.opData?['status'] as String?;
          if (status != null) {
            await _api.updateScheduleItemStatus(entry.id, status);
          }
        }
        // Aucune autre table n'a d'écriture locale en v1 (cf. plan) — si une
        // entrée apparaît ici pour une autre table, laisser l'exception
        // remonter plutôt que de completer un batch partiellement traité.
      }

      await batch.complete();
      if (!batch.haveMore) return;
    }
  }
}
