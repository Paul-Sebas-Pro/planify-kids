import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../features/auth/auth_provider.dart';
import '../features/auth/login_screen.dart';
import '../features/badges/badges_screen.dart';
import '../features/exchanges/exchanges_screen.dart';
import '../features/profile/profile_screen.dart';
import '../features/tasks/today_screen.dart';
import 'shell_screen.dart';

part 'router.g.dart';

// Notifies GoRouter when authProvider state changes so redirect is re-evaluated.
class _AuthChangeNotifier extends ChangeNotifier {
  _AuthChangeNotifier(Ref ref) {
    ref.listen(authProvider, (_, _) => notifyListeners());
  }
}

@Riverpod(keepAlive: true)
GoRouter router(Ref ref) {
  final notifier = _AuthChangeNotifier(ref);
  ref.onDispose(notifier.dispose);

  return GoRouter(
    initialLocation: '/',
    refreshListenable: notifier,
    redirect: (context, state) {
      // Always read current state — never close over a captured value.
      final authState = ref.read(authProvider);
      final isLoggedIn = authState.value != null;
      final isLoading = authState.isLoading;

      if (isLoading) return null;
      if (!isLoggedIn && state.matchedLocation != '/login') return '/login';
      if (isLoggedIn && state.matchedLocation == '/login') return '/';
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (_, _) => const LoginScreen(),
      ),
      ShellRoute(
        builder: (_, _, child) => ShellScreen(child: child),
        routes: [
          GoRoute(path: '/', builder: (_, _) => const TodayScreen()),
          GoRoute(path: '/badges', builder: (_, _) => const BadgesScreen()),
          GoRoute(
              path: '/exchanges',
              builder: (_, _) => const ExchangesScreen()),
          GoRoute(path: '/profile', builder: (_, _) => const ProfileScreen()),
        ],
      ),
    ],
  );
}
