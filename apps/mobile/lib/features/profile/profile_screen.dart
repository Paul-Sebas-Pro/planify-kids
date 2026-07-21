import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../shared/l10n/l10n_extensions.dart';
import '../../shared/providers/locale_provider.dart';
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
        title: Text(context.l10n.profileTitle),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () =>
                ref.read(authProvider.notifier).logout(),
            tooltip: context.l10n.profileLogoutTooltip,
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
                        context.l10n.profilePoints(user?.points ?? 0),
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
              title: Text(context.l10n.profileHistoryTitle),
              subtitle: Text(context.l10n.profileHistorySubtitle),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => context.push('/history'),
            ),
          ),

          const SizedBox(height: 8),

          // Planning famille (lecture seule, toutes les tâches de tous les membres)
          Card(
            child: ListTile(
              leading: const Icon(Icons.calendar_view_week_outlined),
              title: Text(context.l10n.profilePlanningTitle),
              subtitle: Text(context.l10n.profilePlanningSubtitle),
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
              title: Text(context.l10n.profileNotificationsTitle),
              subtitle: Text(
                unreadCount > 0
                    ? context.l10n.profileNotificationsUnread(
                        unreadCount, unreadCount > 1 ? 's' : '')
                    : context.l10n.profileNotificationsAllRead,
              ),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => context.push('/notifications'),
            ),
          ),

          const SizedBox(height: 16),

          // Langue
          Card(
            child: ListTile(
              leading: const Icon(Icons.language_outlined),
              title: Text(context.l10n.profileLanguageTitle),
              trailing: DropdownButton<String>(
                value: ref.watch(appLocaleProvider).languageCode,
                underline: const SizedBox.shrink(),
                items: [
                  DropdownMenuItem(
                      value: 'fr', child: Text(context.l10n.profileLanguageFr)),
                  DropdownMenuItem(
                      value: 'en', child: Text(context.l10n.profileLanguageEn)),
                ],
                onChanged: (code) {
                  if (code == null) return;
                  ref.read(appLocaleProvider.notifier).setLocale(Locale(code));
                },
              ),
            ),
          ),

          const SizedBox(height: 16),

          // Classement famille
          Text(context.l10n.profileRankingTitle, style: theme.textTheme.titleMedium),
          const SizedBox(height: 8),
          statsAsync.when(
            loading: () =>
                const Center(child: CircularProgressIndicator()),
            error: (e, _) => Text(context.l10n.profileLoadError(e)),
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
