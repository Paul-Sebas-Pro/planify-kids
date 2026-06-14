import 'dart:convert';

import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../models/auth_user.dart';
import '../../shared/providers/providers.dart';

part 'auth_provider.g.dart';

@Riverpod(keepAlive: true)
class AuthNotifier extends _$AuthNotifier {
  @override
  Future<AuthUser?> build() async {
    final storage = ref.watch(secureStorageServiceProvider);
    final token = await storage.getToken();
    if (token == null) return null;

    final userJson = await storage.getUserJson();
    if (userJson == null) {
      await storage.clear();
      return null;
    }

    return AuthUser.fromStorageJson(
      jsonDecode(userJson) as Map<String, dynamic>,
    );
  }

  Future<void> login(String email, String password) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final api = ref.read(apiClientProvider);
      final result = await api.login(email, password);

      final storage = ref.read(secureStorageServiceProvider);
      await storage.saveToken(result.token);
      await storage.saveUserJson(jsonEncode(result.member.toJson()));

      return result.member;
    });
  }

  Future<void> logout() async {
    final storage = ref.read(secureStorageServiceProvider);
    await storage.clear();
    state = const AsyncData(null);
  }
}
