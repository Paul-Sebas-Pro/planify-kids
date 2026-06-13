import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../shared/providers/providers.dart';

part 'profile_provider.g.dart';

@riverpod
Future<Map<String, dynamic>> familyStats(Ref ref) async {
  final api = ref.watch(apiClientProvider);
  return api.getFamilyStats();
}
