/// Application configuration.
///
/// The active environment is selected via the `--dart-define=ENV=<name>` flag
/// at build time, or by setting the `ENV` environment variable.
///
/// Supported values: `dev` (default), `qa`, `uat`, `prod`.
///
/// Usage examples:
///   flutter run  --dart-define=ENV=dev
///   flutter run  --dart-define=ENV=prod
///   flutter build apk --dart-define=ENV=prod
enum Environment { dev, qa, uat, prod }

class AppConfig {
  static const String appName = 'Real Estate CRM';

  // ---------------------------------------------------------------------------
  // Environment resolution
  // ---------------------------------------------------------------------------

  /// Resolved from --dart-define=ENV=<value> at build time.
  /// Falls back to 'dev' if not set.
  static const String _envName =
      String.fromEnvironment('ENV', defaultValue: 'dev');

  static Environment get environment {
    switch (_envName) {
      case 'prod':
        return Environment.prod;
      case 'uat':
        return Environment.uat;
      case 'qa':
        return Environment.qa;
      case 'dev':
      default:
        return Environment.dev;
    }
  }

  // ---------------------------------------------------------------------------
  // API base URLs per environment
  // ---------------------------------------------------------------------------

  static const Map<Environment, String> _apiBaseUrls = {
    Environment.dev: 'http://10.0.2.2:3000', // Android emulator → localhost
    Environment.qa: 'https://api.qa.real-estate-crm.example.com',
    Environment.uat: 'https://api.uat.real-estate-crm.example.com',
    Environment.prod: 'https://api.real-estate-crm.example.com',
  };

  /// Use this as `baseUrl` in Dio / ApiClient.
  static String get apiBaseUrl => _apiBaseUrls[environment]!;

  // ---------------------------------------------------------------------------
  // Auth (Authme / Keycloak) per environment
  // ---------------------------------------------------------------------------

  static const Map<Environment, String> _authmeUrls = {
    Environment.dev: 'http://10.0.2.2:3001',
    Environment.qa: 'https://auth.qa.real-estate-crm.example.com',
    Environment.uat: 'https://auth.uat.real-estate-crm.example.com',
    Environment.prod: 'https://auth.real-estate-crm.example.com',
  };

  static const String authmeRealm = 'real-estate';
  static const String authmeClientId = 'mobile';

  static String get authmeUrl => _authmeUrls[environment]!;
  static String get authmeIssuer => '${authmeUrl}/realms/$authmeRealm';
  static String get authmeDiscoveryUrl =>
      '$authmeIssuer/.well-known/openid-configuration';

  // ---------------------------------------------------------------------------
  // OAuth redirect
  // ---------------------------------------------------------------------------

  static const String redirectUrl = 'com.realestate.crm://oauth2redirect';
  static const List<String> scopes = ['openid', 'profile', 'email'];

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  static bool get isDev => environment == Environment.dev;
  static bool get isProd => environment == Environment.prod;
  static bool get isDebug => environment != Environment.prod;
}
