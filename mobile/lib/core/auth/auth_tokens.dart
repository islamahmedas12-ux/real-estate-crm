/// Immutable value object holding OIDC tokens returned from AuthMe.
class AuthTokens {
  final String accessToken;
  final String? refreshToken;
  final String? idToken;
  final DateTime? accessTokenExpiration;

  const AuthTokens({
    required this.accessToken,
    this.refreshToken,
    this.idToken,
    this.accessTokenExpiration,
  });

  /// Returns `true` when the access token is within 30 s of its expiry time.
  bool get isExpired {
    if (accessTokenExpiration == null) return false;
    return DateTime.now().isAfter(
      accessTokenExpiration!.subtract(const Duration(seconds: 30)),
    );
  }

  @override
  String toString() =>
      'AuthTokens(expired: $isExpired, expiry: $accessTokenExpiration)';
}
