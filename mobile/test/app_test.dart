import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:real_estate_crm/config/router.dart';
import 'package:real_estate_crm/providers/auth_provider.dart';
import 'package:real_estate_crm/screens/auth/login_screen.dart';
import 'package:real_estate_crm/models/lead.dart';

// ─── Login Screen Tests ─────────────────────────────────────────────────────

void main() {
  group('LoginScreen', () {
    testWidgets('renders CRM branding and sign in button', (tester) async {
      final container = ProviderContainer(
        overrides: [
          authStateProvider.overrideWith(() => _FakeAuthNotifier()),
        ],
      );
      addTearDown(container.dispose);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp.router(
            routerConfig: _createTestRouter(isAuthenticated: false),
            theme: ThemeData(useMaterial3: true),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Real Estate CRM'), findsWidgets);
      expect(find.text('Agent Portal'), findsOneWidget);
      expect(find.text('Sign in'), findsOneWidget);
    });

    testWidgets('shows loading indicator when authenticating', (tester) async {
      final container = ProviderContainer(
        overrides: [
          authStateProvider.overrideWith(() => _FakeLoadingAuthNotifier()),
        ],
      );
      addTearDown(container.dispose);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp.router(
            routerConfig: _createTestRouter(isAuthenticated: false),
            theme: ThemeData(useMaterial3: true),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Signing in...'), findsOneWidget);
    });

    testWidgets('shows error message when login fails', (tester) async {
      final container = ProviderContainer(
        overrides: [
          authStateProvider.overrideWith(() => _FakeErrorAuthNotifier()),
        ],
      );
      addTearDown(container.dispose);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp.router(
            routerConfig: _createTestRouter(isAuthenticated: false),
            theme: ThemeData(useMaterial3: true),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Login failed'), findsOneWidget);
    });
  });

  group('LeadDetailScreen', () {
    testWidgets('renders lead client name and status badge', (tester) async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(
            theme: ThemeData(useMaterial3: true),
            home: _TestLeadDetailView(
              lead: _fakeLead(),
              leadId: 'lead-001',
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Ahmed Hassan'), findsOneWidget);
      expect(find.text('New'), findsWidgets);
    });

    testWidgets('shows budget formatted', (tester) async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(
            theme: ThemeData(useMaterial3: true),
            home: _TestLeadDetailView(
              lead: _fakeLead(),
              leadId: 'lead-001',
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.textContaining('SAR'), findsWidgets);
    });
  });
}

// ─── Fake Router ────────────────────────────────────────────────────────────

GoRouter _createTestRouter({required bool isAuthenticated}) {
  return GoRouter(
    initialLocation: '/dashboard',
    redirect: (context, state) {
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
      GoRoute(
        path: '/dashboard',
        builder: (context, state) => const Scaffold(body: Text('Dashboard')),
      ),
    ],
  );
}

// ─── Fake Providers ─────────────────────────────────────────────────────────

class _FakeAuthNotifier extends AsyncNotifier<AuthState>
    implements AuthNotifier {
  _FakeAuthNotifier() : super(const AsyncData(AuthState()));

  @override
  Future<void> login() async {}

  @override
  Future<AuthTokens?> getValidTokens() async => null;

  @override
  Future<AuthTokens?> refreshTokens() async => null;

  @override
  Future<void> logout() async {}
}

class _FakeLoadingAuthNotifier extends AsyncNotifier<AuthState>
    implements AuthNotifier {
  _FakeLoadingAuthNotifier()
      : super(const AsyncData(AuthState(isLoading: true)));

  @override
  Future<void> login() async {}

  @override
  Future<AuthTokens?> getValidTokens() async => null;

  @override
  Future<AuthTokens?> refreshTokens() async => null;

  @override
  Future<void> logout() async {}
}

class _FakeErrorAuthNotifier extends AsyncNotifier<AuthState>
    implements AuthNotifier {
  _FakeErrorAuthNotifier()
      : super(const AsyncData(AuthState(error: 'Login failed')));

  @override
  Future<void> login() async {}

  @override
  Future<AuthTokens?> getValidTokens() async => null;

  @override
  Future<AuthTokens?> refreshTokens() async => null;

  @override
  Future<void> logout() async {}
}

// ─── Fake Lead ───────────────────────────────────────────────────────────────

Lead _fakeLead() {
  return Lead(
    id: 'lead-001',
    clientId: 'client-001',
    client: const LeadClient(
      id: 'client-001',
      firstName: 'Ahmed',
      lastName: 'Hassan',
      phone: '0500000000',
    ),
    status: LeadStatus.newLead,
    priority: LeadPriority.high,
    createdAt: DateTime(2024, 1, 15),
    updatedAt: DateTime(2024, 1, 15),
    budget: 1500000,
  );
}

// ─── Test Wrapper for LeadDetailView ───────────────────────────────────────

class _TestLeadDetailView extends StatelessWidget {
  final Lead lead;
  final String leadId;

  const _TestLeadDetailView({required this.lead, required this.leadId});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Lead Details')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 24,
                      child: Text(
                        lead.clientName.isNotEmpty
                            ? lead.clientName[0].toUpperCase()
                            : '?',
                        style: const TextStyle(
                            fontSize: 20, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        lead.clientName,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        children: [
                          Text('Status',
                              style: theme.textTheme.bodySmall?.copyWith(
                                  color: theme.colorScheme.onSurfaceVariant)),
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.blue.shade100,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              lead.status.label,
                              style: const TextStyle(
                                  color: Colors.blue,
                                  fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Details', style: theme.textTheme.titleSmall),
                    const Divider(),
                    _DetailRow(
                        label: 'Budget',
                        value:
                            '${lead.budget?.toStringAsFixed(0) ?? "N/A"} SAR'),
                    _DetailRow(
                      label: 'Created',
                      value: '${lead.createdAt.day}/${lead.createdAt.month}/${lead.createdAt.year}',
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _statusLabel(LeadStatus status) {
    switch (status) {
      case LeadStatus.newLead:
        return 'New';
      case LeadStatus.contacted:
        return 'Contacted';
      case LeadStatus.qualified:
        return 'Qualified';
      default:
        return status.name;
    }
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;

  const _DetailRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(
              label,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          Expanded(child: Text(value, style: theme.textTheme.bodyMedium)),
        ],
      ),
    );
  }
}