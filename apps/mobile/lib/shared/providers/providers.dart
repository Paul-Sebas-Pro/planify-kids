import 'package:powersync/powersync.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../database/database.dart';
import '../services/api_client.dart';
import '../services/secure_storage.dart';

part 'providers.g.dart';

@Riverpod(keepAlive: true)
SecureStorageService secureStorageService(Ref ref) {
  return SecureStorageService();
}

@Riverpod(keepAlive: true)
ApiClient apiClient(Ref ref) {
  final storage = ref.watch(secureStorageServiceProvider);
  return ApiClient(storage);
}

@Riverpod(keepAlive: true)
PowerSyncDatabase powerSyncDatabase(Ref ref) {
  return appDatabase;
}
