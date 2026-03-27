import 'package:flutter_appauth/flutter_appauth.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'auth_config.dart';
import 'auth_tokens.dart';

/// Service responsible for all OIDC / OAuth2 operations against AuthMe.
///
/// Flow:
///   1. [login] — launches the OIDC Authorization Code + PKCE flow and stores
///      the returned tokens in encrypted secure storage.
///   2. [refreshTokens] — silently exchanges a stored refresh token for a new
///      access token without user interaction.
///   3. [getStoredTokens] — restores a previous session from secure storage
///      (used on cold start to re-hydrate the app state).
///   4. [logout] — clears all stored tokens from secure storage.
class AuthService {
  // --------------------------------------------------------------------------
  // Secure storage keys
  // --------------------------------------------------------------------------
  static const _kAccessToken = 'oidc_access_token';
  static const _kRefreshToken = 'oidc_refresh_token';
  static const _kIdToken = 'oidc_id_token';
  static const _kExpiration = 'oidc_access_token_expiry';

  // --------------------------------------------------------------------------
  // Dependencies
  // --------------------------------------------------------------------------
  final FlutterAppAuth _appAuth;
  final FlutterSecureStorage _secureStorage;

  AuthService({
    FlutterAppAuth? appAuth,
    FlutterSecureStorage? secureStorage,
  })  : _appAuth = appAuth ?? const FlutterAppAuth(),
        _secureStorage = secureStorage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
              iOptions: IOSOptions(
                accessibility: KeychainAccessibility.first_unlock,
              ),
            );

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  /// Initiates the OIDC Authorization Code + PKCE login flow.
  ///
  /// Opens a browser / in-app browser tab pointing to the AuthMe login page at
  /// `https://dev-auth.realstate-crm.homes/realms/real-estate-dev`.
  /// After the user authenticates, AuthMe redirects back to
  /// `com.realestatecrm.app://callback` and AppAuth completes the code exchange.
  ///
  /// Returns [AuthTokens] on success, `null` if the user cancelled.
  /// Throws on network / OIDC errors.
  Future<AuthTokens?> login() async {
    final result = await _appAuth.authorizeAndExchangeCode(
      AuthorizationTokenRequest(
        AuthConfig.clientId,
        AuthConfig.redirectUri,
        issuer: AuthConfig.issuer,
        scopes: AuthConfig.scopes,
        preferEphemeralSession: false,
        allowInsecureConnections: AuthConfig.isDev,
      ),
    );

    if (result == null) return null;

    final tokens = AuthTokens(
      accessToken: result.accessToken!,
      refreshToken: result.refreshToken,
      idToken: result.idToken,
      accessTokenExpiration: result.accessTokenExpirationDateTime,
    );

    await _persistTokens(tokens);
    return tokens;
  }

  /// Silently refreshes the access token using the stored refresh token.
  ///
  /// Returns the new [AuthTokens] on success, `null` if no refresh token is
  /// available or if AuthMe rejects it.
  Future<AuthTokens?> refreshTokens() async {
    final storedRefresh = await _secureStorage.read(key: _kRefreshToken);
    if (storedRefresh == null) return null;

    final result = await _appAuth.token(
      TokenRequest(
        AuthConfig.clientId,
        AuthConfig.redirectUri,
        issuer: AuthConfig.issuer,
        refreshToken: storedRefresh,
        scopes: AuthConfig.scopes,
        allowInsecureConnections: AuthConfig.isDev,
      ),
    );

    if (result == null) return null;

    final tokens = AuthTokens(
      accessToken: result.accessToken!,
      refreshToken: result.refreshToken ?? storedRefresh,
      idToken: result.idToken,
      accessTokenExpiration: result.accessTokenExpirationDateTime,
    );

    await _persistTokens(tokens);
    return tokens;
  }

  /// Restores tokens persisted in secure storage from a previous session.
  ///
  /// Returns `null` when there is no previously stored access token.
  Future<AuthTokens?> getStoredTokens() async {
    final accessToken = await _secureStorage.read(key: _kAccessToken);
    if (accessToken == null) return null;

    final refreshToken = await _secureStorage.read(key: _kRefreshToken);
    final idToken = await _secureStorage.read(key: _kIdToken);
    final expiryStr = await _secureStorage.read(key: _kExpiration);

    final expiry = expiryStr != null ? DateTime.tryParse(expiryStr) : null;

    return AuthTokens(
      accessToken: accessToken,
      refreshToken: refreshToken,
      idToken: idToken,
      accessTokenExpiration: expiry,
    );
  }

  /// Clears all stored OIDC tokens, effectively ending the session.
  Future<void> logout() async {
    await _secureStorage.deleteAll();
  }

  // --------------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------------

  Future<void> _persistTokens(AuthTokens tokens) async {
    await _secureStorage.write(key: _kAccessToken, value: tokens.accessToken);

    if (tokens.refreshToken != null) {
      await _secureStorage.write(
          key: _kRefreshToken, value: tokens.refreshToken);
    }
    if (tokens.idToken != null) {
      await _secureStorage.write(key: _kIdToken, value: tokens.idToken);
    }
    if (tokens.accessTokenExpiration != null) {
      await _secureStorage.write(
        key: _kExpiration,
        value: tokens.accessTokenExpiration!.toIso8601String(),
      );
    }
  }
}
