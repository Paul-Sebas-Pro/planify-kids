import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/badges/badge_celebration.dart';
import '../features/notifications/notifications_provider.dart';
import '../shared/l10n/l10n_extensions.dart';

class ShellScreen extends ConsumerWidget {
  final Widget child;
  const ShellScreen({super.key, required this.child});

  int _selectedIndex(BuildContext context) {
    final loc = GoRouterState.of(context).uri.path;
    if (loc.startsWith('/rewards')) return 1;
    if (loc.startsWith('/exchanges')) return 2;
    if (loc.startsWith('/badges')) return 3;
    if (loc.startsWith('/profile')) return 4;
    return 0;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final unreadCount = ref
            .watch(notificationsProvider)
            .value
            ?.where((n) => n.isUnread)
            .length ??
        0;

    Widget profileIcon(bool selected) {
      final icon = Icon(selected ? Icons.person : Icons.person_outlined);
      if (unreadCount == 0) return icon;
      return Badge(
        label: Text(unreadCount > 9 ? '9+' : '$unreadCount'),
        child: icon,
      );
    }

    return Scaffold(
      body: BadgeCelebrationListener(child: child),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex(context),
        onDestinationSelected: (i) {
          switch (i) {
            case 0:
              context.go('/');
            case 1:
              context.go('/rewards');
            case 2:
              context.go('/exchanges');
            case 3:
              context.go('/badges');
            case 4:
              context.go('/profile');
          }
        },
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.today_outlined),
            selectedIcon: const Icon(Icons.today),
            label: context.l10n.shellNavToday,
          ),
          NavigationDestination(
            icon: const Icon(Icons.card_giftcard_outlined),
            selectedIcon: const Icon(Icons.card_giftcard),
            label: context.l10n.shellNavRewards,
          ),
          NavigationDestination(
            icon: const Icon(Icons.swap_horiz_outlined),
            selectedIcon: const Icon(Icons.swap_horiz),
            label: context.l10n.shellNavExchanges,
          ),
          NavigationDestination(
            icon: const Icon(Icons.emoji_events_outlined),
            selectedIcon: const Icon(Icons.emoji_events),
            label: context.l10n.shellNavBadges,
          ),
          NavigationDestination(
            icon: profileIcon(false),
            selectedIcon: profileIcon(true),
            label: context.l10n.shellNavProfile,
          ),
        ],
      ),
    );
  }
}
