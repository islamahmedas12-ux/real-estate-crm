class AppConfig {
  static const String appName = 'Real Estate CRM';

  // API
  static const String apiBaseUrl = 'http://10.0.2.2:3000'; // Android emulator
  static const String apiBaseUrlIos = 'http://localhost:3000';

  // Authme OIDC
  static const String authmeUrl = 'http://10.0.2.2:3001';
  static const String authmeRealm = 'real-estate';
  static const String authmeClientId = 'mobile';
  static const String authmeIssuer =
      '$authmeUrl/realms/$authmeRealm';
  static const String authmeDiscoveryUrl =
      '$authmeIssuer/.well-known/openid-configuration';
  static const String redirectUrl =
      'com.realestate.crm://oauth2redirect';
  static const List<String> scopes = ['openid', 'profile', 'email'];
}
