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

@riverpod
GoRouter router(Ref ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
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
