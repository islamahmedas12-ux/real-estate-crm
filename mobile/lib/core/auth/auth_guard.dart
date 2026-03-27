import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'auth_provider.dart';

/// A widget that conditionally shows the authenticated [child] or the
/// [unauthenticated] placeholder depending on the current [AuthState].
///
/// While the initial auth check is in progress (e.g. loading tokens from
/// secure storage) a [CircularProgressIndicator] is displayed.
class AuthGuard extends ConsumerWidget {
  const AuthGuard({
    super.key,
    required this.child,
    required this.unauthenticated,
  });

  /// Widget to display when the user is authenticated.
  final Widget child;

  /// Widget to display when the user is not authenticated (e.g. LoginScreen).
  final Widget unauthenticated;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authAsync = ref.watch(authProvider);

    return authAsync.when(
      loading: () => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      ),
      error: (_, __) => unauthenticated,
      data: (state) => state.isAuthenticated ? child : unauthenticated,
    );
  }
}
