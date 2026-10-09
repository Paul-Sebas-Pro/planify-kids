import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:powersync/powersync.dart';
import '../config/env.dart';
import '../shared/services/api_client.dart';
import '../shared/utils/utc_timestamp.dart';

class PlanifyConnector extends PowerSyncBackendConnector {
  final ApiClient _api;

  PlanifyConnector(this._api);

  /// Date de modification renvoyée par le serveur après chaque écriture
  /// acceptée. Plusieurs écritures hors ligne sur la même tâche (cocher puis
  /// décocher) portent toutes l'ancienne date locale, la sync n'ayant pas
  /// encore redescendu la nouvelle : sans ce relais, la 2e écriture serait
  /// prise à tort pour un conflit avec la 1re.
  final Map<String, String> _serverUpdatedAt = {};

  String? _expectedUpdatedAt(CrudEntry entry) {
    final known = _serverUpdatedAt[entry.id];
    if (known != null) return known;
    final raw = entry.previousValues?['updated_at'] as String?;
    // null : ligne synchronisée avant l'ajout de la colonne → le serveur se
    // contente de la vérification par statut.
    return raw == null ? null : parseUtcTimestamp(raw).toIso8601String();
  }

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
              final updatedAt = await _api.updateScheduleItemStatus(
                entry.id,
                status,
                expectedStatus: entry.previousValues?['status'] as String?,
                expectedUpdatedAt: _expectedUpdatedAt(entry),
              );
              if (updatedAt != null) _serverUpdatedAt[entry.id] = updatedAt;
            } on DioException catch (e) {
              if (!isPermanentRejection(e)) rethrow;
              _serverUpdatedAt.remove(entry.id);
              // Refus définitif : 404 (item supprimé côté serveur), 403 (tâche
              // réassignée à un autre enfant), 409 (conflit : statut modifié
              // côté serveur pendant que la tablette était hors ligne — la
              // décision la plus récente côté serveur gagne). Le rejouer
              // bloquerait toute la file indéfiniment ; on l'abandonne —
              // PowerSync réaligne la ligne locale sur l'état serveur une fois
              // la file vidée.
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
