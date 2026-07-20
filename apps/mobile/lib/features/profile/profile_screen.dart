import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../auth/auth_provider.dart';
import '../notifications/notifications_provider.dart';
import 'profile_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).value;
    final statsAsync = ref.watch(familyStatsProvider);
    final unreadCount = ref
            .watch(notificationsProvider)
            .value
            ?.where((n) => n.isUnread)
            .length ??
        0;
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mon profil'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () =>
                ref.read(authProvider.notifier).logout(),
            tooltip: 'Déconnexion',
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Avatar + nom + points
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 40,
                    backgroundColor: theme.colorScheme.primaryContainer,
                    child: Text(
                      user?.name.substring(0, 1).toUpperCase() ?? '?',
                      style: theme.textTheme.headlineMedium?.copyWith(
                        color: theme.colorScheme.onPrimaryContainer,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    user?.name ?? '',
                    style: theme.textTheme.titleLarge,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('⭐', style: TextStyle(fontSize: 20)),
                      const SizedBox(width: 4),
                      Text(
                        '${user?.points ?? 0} points',
                        style: theme.textTheme.titleMedium?.copyWith(
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 16),

          // Historique
          Card(
            child: ListTile(
              leading: const Icon(Icons.history),
              title: const Text('Mon historique'),
              subtitle: const Text('Tâches, badges, récompenses'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => context.push('/history'),
            ),
          ),

          const SizedBox(height: 8),

          // Planning famille (lecture seule, toutes les tâches de tous les membres)
          Card(
            child: ListTile(
              leading: const Icon(Icons.calendar_view_week_outlined),
              title: const Text('Planning famille'),
              subtitle: const Text('Toutes les tâches de la semaine'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => context.push('/planning-wall'),
            ),
          ),

          const SizedBox(height: 8),

          // Notifications
          Card(
            child: ListTile(
              leading: unreadCount > 0
                  ? Badge(
                      label: Text(unreadCount > 9 ? '9+' : '$unreadCount'),
                      child: const Icon(Icons.notifications_outlined),
                    )
                  : const Icon(Icons.notifications_outlined),
              title: const Text('Notifications'),
              subtitle: Text(
                unreadCount > 0
                    ? '$unreadCount non lue${unreadCount > 1 ? 's' : ''}'
                    : 'Tout est lu',
              ),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => context.push('/notifications'),
            ),
          ),

          const SizedBox(height: 16),

          // Classement famille
          Text('Classement famille', style: theme.textTheme.titleMedium),
          const SizedBox(height: 8),
          statsAsync.when(
            loading: () =>
                const Center(child: CircularProgressIndicator()),
            error: (e, _) => Text('Impossible de charger : $e'),
            data: (stats) {
              final children = stats['children'] as List<dynamic>? ?? [];
              return Column(
                children: children.asMap().entries.map((entry) {
                  final rank = entry.key + 1;
                  final child = entry.value as Map<String, dynamic>;
                  final isMe = child['id'] == user?.id;
                  final medal = switch (rank) {
                    1 => '🥇',
                    2 => '🥈',
                    3 => '🥉',
                    _ => '$rank.',
                  };
                  return Card(
                    color: isMe
                        ? theme.colorScheme.primaryContainer
                        : null,
                    child: ListTile(
                      leading: Text(medal,
                          style: const TextStyle(fontSize: 24)),
                      title: Text(
                        child['name'] as String? ?? '',
                        style: isMe
                            ? const TextStyle(fontWeight: FontWeight.bold)
                            : null,
                      ),
                      trailing: Text(
                        '${child['points'] ?? 0} pts',
                        style: theme.textTheme.labelLarge?.copyWith(
                          color: isMe
                              ? theme.colorScheme.onPrimaryContainer
                              : theme.colorScheme.primary,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              );
            },
          ),
        ],
      ),
    );
  }
}
