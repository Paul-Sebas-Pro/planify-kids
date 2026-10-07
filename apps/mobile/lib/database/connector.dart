import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
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
            try {
              await _api.updateScheduleItemStatus(entry.id, status);
            } on DioException catch (e) {
              if (!isPermanentRejection(e)) rethrow;
              // Refus définitif (ex. 404 : item supprimé côté serveur pendant
              // que la tablette était hors ligne). Le rejouer bloquerait toute
              // la file indéfiniment ; on l'abandonne — PowerSync réaligne la
              // ligne locale sur l'état serveur une fois la file vidée.
              debugPrint('uploadData: ${entry.id} rejeté '
                  '(${e.response?.statusCode}), écriture abandonnée');
            }
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

/// Erreur 4xx que rejouer ne corrigera jamais. 401 (session expirée, l'app
/// repasse par le login), 408 et 429 (temporaires) restent rejoués, comme
/// les erreurs réseau et 5xx.
bool isPermanentRejection(DioException e) {
  final code = e.response?.statusCode;
  if (code == null) return false;
  return code >= 400 && code < 500 && code != 401 && code != 408 && code != 429;
}
