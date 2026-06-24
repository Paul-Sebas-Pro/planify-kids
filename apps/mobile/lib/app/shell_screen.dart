import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/notifications/notifications_provider.dart';

class ShellScreen extends ConsumerWidget {
  final Widget child;
  const ShellScreen({super.key, required this.child});

  int _selectedIndex(BuildContext context) {
    final loc = GoRouterState.of(context).uri.path;
    if (loc.startsWith('/badges')) return 1;
    if (loc.startsWith('/exchanges')) return 2;
    if (loc.startsWith('/profile')) return 3;
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
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex(context),
        onDestinationSelected: (i) {
          switch (i) {
            case 0:
              context.go('/');
            case 1:
              context.go('/badges');
            case 2:
              context.go('/exchanges');
            case 3:
              context.go('/profile');
          }
        },
        destinations: [
          const NavigationDestination(
            icon: Icon(Icons.today_outlined),
            selectedIcon: Icon(Icons.today),
            label: 'Aujourd\'hui',
          ),
          const NavigationDestination(
            icon: Icon(Icons.emoji_events_outlined),
            selectedIcon: Icon(Icons.emoji_events),
            label: 'Badges',
          ),
          const NavigationDestination(
            icon: Icon(Icons.swap_horiz_outlined),
            selectedIcon: Icon(Icons.swap_horiz),
            label: 'Échanges',
          ),
          NavigationDestination(
            icon: profileIcon(false),
            selectedIcon: profileIcon(true),
            label: 'Profil',
          ),
        ],
      ),
    );
  }
}
