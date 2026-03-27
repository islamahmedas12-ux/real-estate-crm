import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/auth_service.dart';

class AuthState {
  final AuthTokens? tokens;
  final bool isLoading;
  final String? error;

  const AuthState({this.tokens, this.isLoading = false, this.error});

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

class AuthNotifier extends AsyncNotifier<AuthState> {
  late final AuthService _authService;

  @override
  Future<AuthState> build() async {
    _authService = AuthService();
    // Try to restore session from secure storage
    final stored = await _authService.getStoredTokens();
    if (stored != null && !stored.isExpired) {
      return AuthState(tokens: stored);
    }
    // Try refresh if we have a refresh token
    if (stored?.refreshToken != null) {
      final refreshed = await _authService.refreshTokens();
      if (refreshed != null) {
        return AuthState(tokens: refreshed);
      }
    }
    return const AuthState();
  }

  Future<void> login() async {
    state = const AsyncData(AuthState(isLoading: true));
    try {
      final tokens = await _authService.login();
      if (tokens != null) {
        state = AsyncData(AuthState(tokens: tokens));
      } else {
        state = const AsyncData(AuthState(error: 'Login cancelled'));
      }
    } catch (e) {
      state = AsyncData(AuthState(error: e.toString()));
    }
  }

  Future<AuthTokens?> getValidTokens() async {
    final current = state.valueOrNull;
    if (current?.tokens == null) return null;

    if (current!.tokens!.isExpired) {
      return refreshTokens();
    }
    return current.tokens;
  }

  Future<AuthTokens?> refreshTokens() async {
    try {
      final newTokens = await _authService.refreshTokens();
      if (newTokens != null) {
        state = AsyncData(AuthState(tokens: newTokens));
        return newTokens;
      }
      // Refresh failed
      await logout();
      return null;
    } catch (e) {
      await logout();
      return null;
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    state = const AsyncData(AuthState());
  }
}

final authStateProvider =
    AsyncNotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);
