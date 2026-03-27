import 'package:flutter_appauth/flutter_appauth.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../config/app_config.dart';

class AuthTokens {
  final String accessToken;
  final String? refreshToken;
  final String? idToken;
  final DateTime? accessTokenExpiration;

  AuthTokens({
    required this.accessToken,
    this.refreshToken,
    this.idToken,
    this.accessTokenExpiration,
  });

  bool get isExpired {
    if (accessTokenExpiration == null) return false;
    return DateTime.now().isAfter(
      accessTokenExpiration!.subtract(const Duration(seconds: 30)),
    );
  }
}

class AuthService {
  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _idTokenKey = 'id_token';
  static const _expirationKey = 'token_expiration';

  final FlutterAppAuth _appAuth = const FlutterAppAuth();
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();

  /// Perform OIDC Authorization Code + PKCE login
  Future<AuthTokens?> login() async {
    final result = await _appAuth.authorizeAndExchangeCode(
      AuthorizationTokenRequest(
        AppConfig.authmeClientId,
        AppConfig.redirectUrl,
        issuer: AppConfig.authmeIssuer,
        scopes: AppConfig.scopes,
        preferEphemeralSession: false,
      ),
    );

    if (result == null) return null;

    final tokens = AuthTokens(
      accessToken: result.accessToken!,
      refreshToken: result.refreshToken,
      idToken: result.idToken,
      accessTokenExpiration: result.accessTokenExpirationDateTime,
    );

    await _storeTokens(tokens);
    return tokens;
  }

  /// Refresh access token using stored refresh token
  Future<AuthTokens?> refreshTokens() async {
    final refreshToken = await _secureStorage.read(key: _refreshTokenKey);
    if (refreshToken == null) return null;

    final result = await _appAuth.token(
      TokenRequest(
        AppConfig.authmeClientId,
        AppConfig.redirectUrl,
        issuer: AppConfig.authmeIssuer,
        refreshToken: refreshToken,
        scopes: AppConfig.scopes,
      ),
    );

    if (result == null) return null;

    final tokens = AuthTokens(
      accessToken: result.accessToken!,
      refreshToken: result.refreshToken ?? refreshToken,
      idToken: result.idToken,
      accessTokenExpiration: result.accessTokenExpirationDateTime,
    );

    await _storeTokens(tokens);
    return tokens;
  }

  /// Get stored tokens
  Future<AuthTokens?> getStoredTokens() async {
    final accessToken = await _secureStorage.read(key: _accessTokenKey);
    if (accessToken == null) return null;

    final refreshToken = await _secureStorage.read(key: _refreshTokenKey);
    final idToken = await _secureStorage.read(key: _idTokenKey);
    final expirationStr = await _secureStorage.read(key: _expirationKey);

    DateTime? expiration;
    if (expirationStr != null) {
      expiration = DateTime.tryParse(expirationStr);
    }

    return AuthTokens(
      accessToken: accessToken,
      refreshToken: refreshToken,
      idToken: idToken,
      accessTokenExpiration: expiration,
    );
  }

  /// Logout — clear stored tokens
  Future<void> logout() async {
    await _secureStorage.deleteAll();
  }

  Future<void> _storeTokens(AuthTokens tokens) async {
    await _secureStorage.write(
      key: _accessTokenKey,
      value: tokens.accessToken,
    );
    if (tokens.refreshToken != null) {
      await _secureStorage.write(
        key: _refreshTokenKey,
        value: tokens.refreshToken,
      );
    }
    if (tokens.idToken != null) {
      await _secureStorage.write(key: _idTokenKey, value: tokens.idToken);
    }
    if (tokens.accessTokenExpiration != null) {
      await _secureStorage.write(
        key: _expirationKey,
        value: tokens.accessTokenExpiration!.toIso8601String(),
      );
    }
  }
}
