import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorageService {
  static const _tokenKey = 'jwt_token';
  static const _userKey = 'current_user_json';

  final FlutterSecureStorage _storage;

  SecureStorageService() : _storage = const FlutterSecureStorage();

  Future<String?> getToken() => _storage.read(key: _tokenKey);

  Future<void> saveToken(String token) =>
      _storage.write(key: _tokenKey, value: token);

  Future<String?> getUserJson() => _storage.read(key: _userKey);

  Future<void> saveUserJson(String json) =>
      _storage.write(key: _userKey, value: json);

  Future<void> clear() => _storage.deleteAll();
}
