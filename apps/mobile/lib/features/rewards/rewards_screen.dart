import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/reward.dart';
import '../../shared/l10n/l10n_extensions.dart';
import '../../shared/widgets/api_error_widget.dart';
import '../auth/auth_provider.dart';
import 'rewards_provider.dart';

class RewardsScreen extends ConsumerWidget {
  const RewardsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final rewardsAsync = ref.watch(rewardsProvider);
    final claimsAsync = ref.watch(myClaimsProvider);
    final user = ref.watch(authProvider).value;
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(context.l10n.rewardsTitle),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ref.invalidate(rewardsProvider);
              ref.invalidate(myClaimsProvider);
            },
          ),
        ],
      ),
      body: rewardsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => ApiErrorWidget(
          error: e,
          onRetry: () => ref.invalidate(rewardsProvider),
        ),
        data: (rewards) {
          if (rewards.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('🎁', style: TextStyle(fontSize: 64)),
                  const SizedBox(height: 8),
                  Text(context.l10n.rewardsEmpty),
                ],
              ),
            );
          }

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(
                context.l10n.rewardsAvailable,
                style: theme.textTheme.labelMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 8),
              ...rewards.map((r) => _RewardCard(
                    reward: r,
                    userPoints: user?.points ?? 0,
                    memberId: user?.id ?? '',
                    pendingClaimIds: claimsAsync.value
                            ?.where((c) => c.isPending)
                            .map((c) => c.reward.id)
                            .toSet() ??
                        {},
                    onClaim: () => ref
                        .read(myClaimsProvider.notifier)
                        .claim(r.id, user?.id ?? ''),
                  )),
              const SizedBox(height: 16),
              claimsAsync.when(
                loading: () => const SizedBox.shrink(),
                error: (_, _) => const SizedBox.shrink(),
                data: (claims) {
                  if (claims.isEmpty) return const SizedBox.shrink();
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        context.l10n.rewardsMyRequests,
                        style: theme.textTheme.labelMedium?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: 8),
                      ...claims.map((c) => _ClaimTile(claim: c)),
                    ],
                  );
                },
              ),
              const SizedBox(height: 80),
            ],
          );
        },
      ),
    );
  }
}

class _RewardCard extends StatelessWidget {
  final Reward reward;
  final int userPoints;
  final String memberId;
  final Set<String> pendingClaimIds;
  final VoidCallback onClaim;

  const _RewardCard({
    required this.reward,
    required this.userPoints,
    required this.memberId,
    required this.pendingClaimIds,
    required this.onClaim,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final canAfford = userPoints >= reward.pointsCost;
    final hasPending = pendingClaimIds.contains(reward.id);

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Text(reward.icon, style: const TextStyle(fontSize: 32)),
        title: Text(reward.name, style: theme.textTheme.titleSmall),
        subtitle: Text(
          '${reward.pointsCost} pts',
          style: theme.textTheme.bodySmall?.copyWith(
            color: canAfford
                ? theme.colorScheme.primary
                : theme.colorScheme.onSurfaceVariant,
            fontWeight: FontWeight.bold,
          ),
        ),
        trailing: hasPending
            ? Chip(
                label: Text(context.l10n.rewardsPending),
                backgroundColor: Colors.orange.withValues(alpha: 0.15),
                labelStyle: const TextStyle(color: Colors.orange, fontSize: 11),
              )
            : FilledButton(
                onPressed: canAfford ? onClaim : null,
                child: Text(context.l10n.rewardsClaim),
              ),
      ),
    );
  }
}

class _ClaimTile extends StatelessWidget {
  final RewardClaim claim;
  const _ClaimTile({required this.claim});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    final (statusColor, statusLabel) = switch (claim.status) {
      'APPROVED' => (Colors.green, context.l10n.rewardsApproved),
      'REJECTED' => (theme.colorScheme.error, context.l10n.rewardsRejected),
      _ => (Colors.orange, context.l10n.rewardsPending),
    };

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Text(claim.reward.icon, style: const TextStyle(fontSize: 28)),
        title: Text(claim.reward.name, style: theme.textTheme.bodyMedium),
        subtitle: Text('${claim.reward.pointsCost} pts',
            style: theme.textTheme.bodySmall),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: statusColor.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            statusLabel,
            style: theme.textTheme.labelSmall?.copyWith(color: statusColor),
          ),
        ),
      ),
    );
  }
}
