import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../shared/providers/providers.dart';
import '../../shared/widgets/api_error_widget.dart';
import 'notifications_provider.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifAsync = ref.watch(notificationsProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          TextButton(
            onPressed: () async {
              await ref.read(apiClientProvider).markAllNotificationsRead();
              ref.invalidate(notificationsProvider);
            },
            child: const Text('Tout lire'),
          ),
        ],
      ),
      body: notifAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => ApiErrorWidget(
          error: e,
          onRetry: () => ref.invalidate(notificationsProvider),
        ),
        data: (notifs) {
          if (notifs.isEmpty) {
            return const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('🔔', style: TextStyle(fontSize: 64)),
                  SizedBox(height: 8),
                  Text('Aucune notification'),
                ],
              ),
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.symmetric(vertical: 8),
            itemCount: notifs.length,
            separatorBuilder: (_, _) => const Divider(height: 1),
            itemBuilder: (_, i) {
              final n = notifs[i];
              return ListTile(
                leading: CircleAvatar(
                  backgroundColor: n.isUnread
                      ? theme.colorScheme.primaryContainer
                      : theme.colorScheme.surfaceContainerHighest,
                  child: Icon(
                    n.isUnread
                        ? Icons.notifications_active
                        : Icons.notifications_none,
                    color: n.isUnread
                        ? theme.colorScheme.onPrimaryContainer
                        : theme.colorScheme.onSurfaceVariant,
                    size: 20,
                  ),
                ),
                title: Text(
                  n.message,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight:
                        n.isUnread ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
                subtitle: Text(
                  DateFormat('d MMM · HH:mm', 'fr_FR').format(n.createdAt),
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                onTap: n.isUnread
                    ? () async {
                        await ref
                            .read(apiClientProvider)
                            .markNotificationRead(n.id);
                        ref.invalidate(notificationsProvider);
                      }
                    : null,
              );
            },
          );
        },
      ),
    );
  }
}
