import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../auth/auth_provider.dart';
import '../../features/auth/login_screen.dart';
import '../../features/dashboard/dashboard_screen.dart';
import '../../features/properties/properties_screen.dart';
import '../../features/clients/clients_screen.dart';

final _rootKey = GlobalKey<NavigatorState>();

/// Application router — guards all routes behind [authProvider].
///
/// Unauthenticated users are redirected to `/login`.
/// Authenticated users are redirected away from `/login` to `/dashboard`.
final appRouterProvider = Provider<GoRouter>((ref) {
  final authAsync = ref.watch(authProvider);

  return GoRouter(
    navigatorKey: _rootKey,
    initialLocation: '/dashboard',
    redirect: (context, state) {
      final isAuthenticated =
          authAsync.valueOrNull?.isAuthenticated ?? false;
      final isLoading = authAsync.isLoading;
      final onLogin = state.matchedLocation == '/login';

      // While loading, don't redirect (splash/loading state is shown).
      if (isLoading) return null;

      if (!isAuthenticated && !onLogin) return '/login';
      if (isAuthenticated && onLogin) return '/dashboard';
      return null;
    },
    routes: [
      // -----------------------------------------------------------------------
      // Auth
      // -----------------------------------------------------------------------
      GoRoute(
        path: '/login',
        builder: (_, __) => const LoginScreen(),
      ),

      // -----------------------------------------------------------------------
      // Main app
      // -----------------------------------------------------------------------
      GoRoute(
        path: '/dashboard',
        builder: (_, __) => const DashboardScreen(),
      ),
      GoRoute(
        path: '/properties',
        builder: (_, __) => const PropertiesScreen(),
      ),
      GoRoute(
        path: '/clients',
        builder: (_, __) => const ClientsScreen(),
      ),
    ],
  );
});
