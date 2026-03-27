import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'auth_service.dart';
import 'auth_tokens.dart';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/// Immutable snapshot of authentication state.
class AuthState {
  final AuthTokens? tokens;
  final bool isLoading;
  final String? error;

  const AuthState({
    this.tokens,
    this.isLoading = false,
    this.error,
  });

  /// `true` when a non-expired access token is present.
  bool get isAuthenticated => tokens != null && !tokens!.isExpired;

  AuthState copyWith({
    AuthTokens? tokens,
    bool? isLoading,
    String? error,
    bool clearTokens = false,
    bool clearError = false,
  }) {
    return AuthState(
      tokens: clearTokens ? null : (tokens ?? this.tokens),
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

// ---------------------------------------------------------------------------
// Notifier
// ---------------------------------------------------------------------------

/// Riverpod [AsyncNotifier] that manages OIDC authentication state.
///
/// On first build it tries to restore a session from secure storage (and
/// silently refresh if the stored token is expired).
///
/// Consumers should watch [authProvider] and interact via the notifier:
/// ```dart
/// ref.watch(authProvider)      // AsyncValue<AuthState>
/// ref.read(authProvider.notifier).login();
/// ref.read(authProvider.notifier).logout();
/// ```
class AuthNotifier extends AsyncNotifier<AuthState> {
  late final AuthService _authService;

  @override
  Future<AuthState> build() async {
    _authService = AuthService();

    // Attempt to restore session from encrypted secure storage.
    final stored = await _authService.getStoredTokens();

    if (stored != null && !stored.isExpired) {
      return AuthState(tokens: stored);
    }

    // If the access token is expired but we have a refresh token, try a
    // silent refresh before falling back to the "not authenticated" state.
    if (stored?.refreshToken != null) {
      try {
        final refreshed = await _authService.refreshTokens();
        if (refreshed != null) {
          return AuthState(tokens: refreshed);
        }
      } catch (_) {
        // Silent refresh failed — proceed without a session.
      }
    }

    return const AuthState();
  }

  // --------------------------------------------------------------------------
  // Public actions
  // --------------------------------------------------------------------------

  /// Launches the OIDC login flow via the system browser.
  ///
  /// Sets [AuthState.isLoading] while the browser is open, then updates state
  /// with the received tokens on success or an error message on failure.
  Future<void> login() async {
    state = const AsyncData(AuthState(isLoading: true));
    try {
      final tokens = await _authService.login();
      if (tokens != null) {
        state = AsyncData(AuthState(tokens: tokens));
      } else {
        // User cancelled the browser flow.
        state = const AsyncData(AuthState(error: 'Login cancelled'));
      }
    } catch (e) {
      state = AsyncData(AuthState(error: e.toString()));
    }
  }

  /// Signs out by clearing all tokens from secure storage.
  Future<void> logout() async {
    await _authService.logout();
    state = const AsyncData(AuthState());
  }

  // --------------------------------------------------------------------------
  // Token helpers (used by ApiClient interceptor)
  // --------------------------------------------------------------------------

  /// Returns a valid (non-expired) access token, silently refreshing if needed.
  ///
  /// Returns `null` if the user is not authenticated or if silent refresh fails.
  Future<AuthTokens?> getValidTokens() async {
    final current = state.valueOrNull;
    if (current?.tokens == null) return null;

    if (current!.tokens!.isExpired) {
      return _silentRefresh();
    }
    return current.tokens;
  }

  // --------------------------------------------------------------------------
  // Private
  // --------------------------------------------------------------------------

  Future<AuthTokens?> _silentRefresh() async {
    try {
      final refreshed = await _authService.refreshTokens();
      if (refreshed != null) {
        state = AsyncData(AuthState(tokens: refreshed));
        return refreshed;
      }
    } catch (_) {
      // Refresh failed — force logout so the UI can show the login screen.
    }
    await logout();
    return null;
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/// Global provider for the [AuthNotifier] / [AuthState] pair.
final authProvider =
    AsyncNotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);
