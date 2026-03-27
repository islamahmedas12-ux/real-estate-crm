import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/auth/auth_provider.dart';
import '../../core/auth/auth_config.dart';

/// Login screen shown when the user is not authenticated.
///
/// Tapping "Sign In" launches the AuthMe OIDC flow via [AuthNotifier.login].
class LoginScreen extends ConsumerWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authAsync = ref.watch(authProvider);

    final isLoading = authAsync.when(
      loading: () => true,
      error: (_, __) => false,
      data: (s) => s.isLoading,
    );

    final errorMessage = authAsync.when(
      loading: () => null,
      error: (e, _) => e.toString(),
      data: (s) => s.error,
    );

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // App logo / title
              const Icon(Icons.home_work_outlined, size: 72, color: Color(0xFF1565C0)),
              const SizedBox(height: 16),
              Text(
                'Real Estate CRM',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Sign in with your organisation account',
                style: Theme.of(context).textTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 40),

              // Error message
              if (errorMessage != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.errorContainer,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    errorMessage,
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.onErrorContainer,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Sign-in button
              ElevatedButton.icon(
                onPressed: isLoading
                    ? null
                    : () => ref.read(authProvider.notifier).login(),
                icon: isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.login),
                label: Text(isLoading ? 'Signing in…' : 'Sign in with AuthMe'),
              ),

              const SizedBox(height: 24),

              // Auth server info (dev only)
              if (AuthConfig.isDev)
                Text(
                  'Auth server: ${AuthConfig.issuer}',
                  style: Theme.of(context)
                      .textTheme
                      .bodySmall
                      ?.copyWith(color: Colors.grey),
                  textAlign: TextAlign.center,
                ),
            ],
          ),
        ),
      ),
    );
  }
}
