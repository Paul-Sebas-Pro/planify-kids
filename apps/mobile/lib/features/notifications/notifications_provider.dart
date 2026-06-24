import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../models/notification_item.dart';
import '../../shared/providers/providers.dart';
import '../auth/auth_provider.dart';

part 'notifications_provider.g.dart';

@riverpod
Future<List<NotificationItem>> notifications(Ref ref) async {
  final user = ref.watch(authProvider).value;
  if (user == null) return [];
  final api = ref.watch(apiClientProvider);
  return api.getNotifications();
}
