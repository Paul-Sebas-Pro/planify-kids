import 'package:shared_preferences/shared_preferences.dart';

class SecureStorageService {
  static const _tokenKey = 'jwt_token';
  static const _userKey = 'current_user_json';
  static const _familyCodeKey = 'family_code';

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
