import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/timeline_event.dart';
import '../../shared/l10n/l10n_extensions.dart';
import '../auth/auth_provider.dart';
import 'history_provider.dart';

class HistoryScreen extends ConsumerWidget {
  const HistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).value;
    if (user == null) return const SizedBox.shrink();

    final timelineAsync = ref.watch(memberTimelineProvider(user.id));
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: Text(context.l10n.historyTitle)),
      body: timelineAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Text(context.l10n.historyLoadError(e),
              style: const TextStyle(color: Colors.red)),
        ),
        data: (events) {
          if (events.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('📭', style: TextStyle(fontSize: 48)),
                  const SizedBox(height: 12),
                  Text(context.l10n.historyEmptyTitle,
                      style: theme.textTheme.titleMedium),
                  const SizedBox(height: 4),
                  Text(
                    context.l10n.historyEmptyDescription,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodySmall
                        ?.copyWith(color: Colors.grey.shade500),
                  ),
                ],
              ),
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: events.length,
            separatorBuilder: (_, _) => const Divider(height: 1),
            itemBuilder: (context, i) => _EventTile(event: events[i]),
          );
        },
      ),
    );
  }
}

class _EventTile extends StatelessWidget {
  final TimelineEvent event;
  const _EventTile({required this.event});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final date = DateTime.parse(event.date);
    final dateStr =
        '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';

    Color pointsColor = Colors.grey.shade400;
    if (event.points != null) {
      pointsColor = event.isPositivePoints ? Colors.green.shade600 : Colors.red.shade400;
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(event.icon ?? event.typeIcon,
              style: const TextStyle(fontSize: 24)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  event.typeLabel,
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: Colors.grey.shade500,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 2),
                Text(event.title,
                    style: theme.textTheme.bodyMedium
                        ?.copyWith(fontWeight: FontWeight.w600)),
                if (event.description != null) ...[
                  const SizedBox(height: 2),
                  Text(event.description!,
                      style: theme.textTheme.bodySmall
                          ?.copyWith(color: Colors.grey.shade500)),
                ],
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              if (event.points != null)
                Text(
                  '${event.isPositivePoints ? '+' : ''}${event.points} pts',
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: pointsColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              Text(
                dateStr,
                style: theme.textTheme.labelSmall
                    ?.copyWith(color: Colors.grey.shade400),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
