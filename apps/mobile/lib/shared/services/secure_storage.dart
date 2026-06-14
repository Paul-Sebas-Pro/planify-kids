import 'package:shared_preferences/shared_preferences.dart';

class SecureStorageService {
  static const _tokenKey = 'jwt_token';
  static const _userKey = 'current_user_json';

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

  Future<void> clear() async {
    await (await _prefs).clear();
  }
}
