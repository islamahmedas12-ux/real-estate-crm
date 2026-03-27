/// AuthMe OIDC configuration for the Real Estate CRM mobile app.
///
/// Environment-aware configuration pointing to the correct AuthMe instance.
enum AppEnvironment { dev, qa, uat, prod }

class AuthConfig {
  // ---------------------------------------------------------------------------
  // Environment resolution (via --dart-define=ENV=<name>)
  // ---------------------------------------------------------------------------
  static const String _envName =
      String.fromEnvironment('ENV', defaultValue: 'dev');

  static AppEnvironment get environment {
    switch (_envName) {
      case 'prod':
        return AppEnvironment.prod;
      case 'uat':
        return AppEnvironment.uat;
      case 'qa':
        return AppEnvironment.qa;
      case 'dev':
      default:
        return AppEnvironment.dev;
    }
  }

  // ---------------------------------------------------------------------------
  // AuthMe base URLs per environment
  // ---------------------------------------------------------------------------
  static const Map<AppEnvironment, String> _authmeBaseUrls = {
    AppEnvironment.dev: 'https://dev-auth.realstate-crm.homes',
    AppEnvironment.qa: 'https://qa-auth.realstate-crm.homes',
    AppEnvironment.uat: 'https://uat-auth.realstate-crm.homes',
    AppEnvironment.prod: 'https://auth.realstate-crm.homes',
  };

  // ---------------------------------------------------------------------------
  // Realm per environment
  // ---------------------------------------------------------------------------
  static const Map<AppEnvironment, String> _realms = {
    AppEnvironment.dev: 'real-estate-dev',
    AppEnvironment.qa: 'real-estate-qa',
    AppEnvironment.uat: 'real-estate-uat',
    AppEnvironment.prod: 'real-estate',
  };

  // ---------------------------------------------------------------------------
  // Client ID
  // ---------------------------------------------------------------------------
  static const String clientId = 'mobile';

  // ---------------------------------------------------------------------------
  // Redirect URI — must match the Android/iOS app scheme
  // ---------------------------------------------------------------------------
  static const String redirectUri = 'com.realestatecrm.app://callback';

  // ---------------------------------------------------------------------------
  // Post-logout redirect URI
  // ---------------------------------------------------------------------------
  static const String postLogoutRedirectUri =
      'com.realestatecrm.app://logout-callback';

  // ---------------------------------------------------------------------------
  // OIDC scopes
  // ---------------------------------------------------------------------------
  static const List<String> scopes = ['openid', 'profile', 'email', 'offline_access'];

  // ---------------------------------------------------------------------------
  // Resolved getters
  // ---------------------------------------------------------------------------
  static String get authmeBaseUrl => _authmeBaseUrls[environment]!;
  static String get realm => _realms[environment]!;

  /// Full OIDC issuer URL — used by AppAuth as `issuer` parameter.
  static String get issuer => '$authmeBaseUrl/realms/$realm';

  /// OIDC discovery document URL.
  static String get discoveryUrl => '$issuer/.well-known/openid-configuration';

  // Convenience
  static bool get isDev => environment == AppEnvironment.dev;
  static bool get isProd => environment == AppEnvironment.prod;
}
