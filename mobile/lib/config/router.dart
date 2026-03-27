import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../providers/auth_provider.dart';
import '../screens/auth/login_screen.dart';
import '../screens/dashboard/dashboard_screen.dart';
import '../screens/properties/properties_screen.dart';
import '../screens/properties/property_detail_screen.dart';
import '../screens/leads/leads_list_screen.dart';
import '../screens/leads/lead_detail_screen.dart';
import '../screens/leads/lead_form_screen.dart';
import '../screens/clients/clients_list_screen.dart';
import '../screens/clients/client_detail_screen.dart';
import '../screens/clients/client_form_screen.dart';
import '../screens/notifications/notifications_screen.dart';
import '../screens/notifications/notification_preferences_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../widgets/app_shell.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/dashboard',
    redirect: (context, state) {
      final isAuthenticated = authState.valueOrNull?.isAuthenticated ?? false;
      final isLoggingIn = state.matchedLocation == '/login';

      if (!isAuthenticated && !isLoggingIn) return '/login';
      if (isAuthenticated && isLoggingIn) return '/dashboard';
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) => AppShell(child: child),
        routes: [
          GoRoute(
            path: '/dashboard',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: DashboardScreen(),
            ),
          ),
          GoRoute(
            path: '/properties',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: PropertiesScreen(),
            ),
            routes: [
              GoRoute(
                path: ':id',
                parentNavigatorKey: _rootNavigatorKey,
                builder: (context, state) => PropertyDetailScreen(
                  propertyId: state.pathParameters['id']!,
                ),
              ),
            ],
          ),
          GoRoute(
            path: '/leads',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: LeadsListScreen(),
            ),
            routes: [
              GoRoute(
                path: 'new',
                parentNavigatorKey: _rootNavigatorKey,
                builder: (context, state) => const LeadFormScreen(),
              ),
              GoRoute(
                path: ':id',
                parentNavigatorKey: _rootNavigatorKey,
                builder: (context, state) => LeadDetailScreen(
                  leadId: state.pathParameters['id']!,
                ),
                routes: [
                  GoRoute(
                    path: 'edit',
                    parentNavigatorKey: _rootNavigatorKey,
                    builder: (context, state) => LeadFormScreen(
                      leadId: state.pathParameters['id']!,
                    ),
                  ),
                ],
              ),
            ],
          ),
          GoRoute(
            path: '/clients',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: ClientsListScreen(),
            ),
            routes: [
              GoRoute(
                path: 'new',
                parentNavigatorKey: _rootNavigatorKey,
                builder: (context, state) => const ClientFormScreen(),
              ),
              GoRoute(
                path: ':id',
                parentNavigatorKey: _rootNavigatorKey,
                builder: (context, state) => ClientDetailScreen(
                  clientId: state.pathParameters['id']!,
                ),
                routes: [
                  GoRoute(
                    path: 'edit',
                    parentNavigatorKey: _rootNavigatorKey,
                    builder: (context, state) => ClientFormScreen(
                      clientId: state.pathParameters['id']!,
                    ),
                  ),
                ],
              ),
            ],
          ),
          GoRoute(
            path: '/notifications',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: NotificationsScreen(),
            ),
            routes: [
              GoRoute(
                path: 'preferences',
                parentNavigatorKey: _rootNavigatorKey,
                builder: (context, state) =>
                    const NotificationPreferencesScreen(),
              ),
            ],
          ),
          GoRoute(
            path: '/profile',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: ProfileScreen(),
            ),
          ),
        ],
      ),
    ],
  );
});
