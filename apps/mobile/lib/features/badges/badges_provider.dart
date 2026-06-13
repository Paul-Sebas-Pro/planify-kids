import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../models/badge.dart';
import '../../shared/providers/providers.dart';
import '../auth/auth_provider.dart';

part 'badges_provider.g.dart';

@riverpod
Future<List<MemberBadge>> memberBadges(Ref ref) async {
  final user = ref.watch(authProvider).value;
  if (user == null) return [];
  final api = ref.watch(apiClientProvider);
  return api.getMemberBadges(user.id);
}
