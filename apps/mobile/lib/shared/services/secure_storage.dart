import 'package:shared_preferences/shared_preferences.dart';

class SecureStorageService {
  static const _tokenKey = 'jwt_token';
  static const _userKey = 'current_user_json';
  static const _familyCodeKey = 'family_code';
  static const _localeKey = 'locale';
  static const _badgesCelebratedPrefix = 'badges_celebrated_until_';
  static const _exchangeDragHintSeenKey = 'exchange_drag_hint_seen';

  Future<SharedPreferences> get _prefs => SharedPreferences.getInstance();

  Future<String?> getToken() async {
    return (await _prefs).getString(_tokenKey);
  }

  Future<void> saveToken(String token) async {
    await (await _prefs).setString(_tokenKey, token);
  }

  Future<String?> getUserJson() async {
    return (await _prefs).getString(_userKey);
  }

  Future<void> saveUserJson(String json) async {
    await (await _prefs).setString(_userKey, json);
  }

  Future<String?> getFamilyCode() async {
    return (await _prefs).getString(_familyCodeKey);
  }

  Future<void> saveFamilyCode(String code) async {
    await (await _prefs).setString(_familyCodeKey, code);
  }

  Future<String?> getLocale() async {
    return (await _prefs).getString(_localeKey);
  }

  Future<void> saveLocale(String code) async {
    await (await _prefs).setString(_localeKey, code);
  }

  /// Date `earnedAt` du dernier badge fêté pour ce membre (null = jamais
  /// initialisé sur cet appareil). Survit au logout, comme le code famille.
  Future<DateTime?> getBadgesCelebratedUntil(String memberId) async {
    final raw =
        (await _prefs).getString('$_badgesCelebratedPrefix$memberId');
    return raw == null ? null : DateTime.tryParse(raw);
  }

  Future<void> saveBadgesCelebratedUntil(String memberId, DateTime at) async {
    await (await _prefs).setString(
      '$_badgesCelebratedPrefix$memberId',
      at.toUtc().toIso8601String(),
    );
  }

  /// Astuce « appui long pour échanger » déjà comprise : un échange a été
  /// proposé par glisser-déposer sur cet appareil.
  Future<bool> getExchangeDragHintSeen() async {
    return (await _prefs).getBool(_exchangeDragHintSeenKey) ?? false;
  }

  Future<void> saveExchangeDragHintSeen() async {
    await (await _prefs).setBool(_exchangeDragHintSeenKey, true);
  }

  /// Retire la session (token + utilisateur) en gardant le code famille
  /// mémorisé — utilisé au logout pour éviter de tout retaper à la
  /// reconnexion suivante.
  Future<void> clearSession() async {
    final prefs = await _prefs;
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
  }

  Future<void> clear() async {
    await (await _prefs).clear();
  }
}
