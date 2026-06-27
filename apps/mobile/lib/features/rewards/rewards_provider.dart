import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../models/reward.dart';
import '../../shared/providers/providers.dart';
import '../auth/auth_provider.dart';

part 'rewards_provider.g.dart';

@riverpod
Future<List<Reward>> rewards(Ref ref) async {
  final user = ref.watch(authProvider).value;
  if (user == null) return [];
  return ref.watch(apiClientProvider).getRewards();
}

@riverpod
class MyClaimsNotifier extends _$MyClaimsNotifier {
  @override
  Future<List<RewardClaim>> build() async {
    final user = ref.watch(authProvider).value;
    if (user == null) return [];
    return ref.watch(apiClientProvider).getMyRewardClaims();
  }

  Future<void> claim(String rewardId, String memberId) async {
    await ref.read(apiClientProvider).claimReward(rewardId, memberId);
    ref.invalidateSelf();
  }
}
