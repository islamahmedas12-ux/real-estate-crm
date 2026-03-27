import '../auth/auth_config.dart';

/// API base-URL configuration, mirroring the environment selection in
/// [AuthConfig].
class ApiConfig {
  static const Map<AppEnvironment, String> _baseUrls = {
    AppEnvironment.dev: 'http://10.0.2.2:3000', // Android emulator → localhost
    AppEnvironment.qa: 'https://api.qa.realstate-crm.homes',
    AppEnvironment.uat: 'https://api.uat.realstate-crm.homes',
    AppEnvironment.prod: 'https://api.realstate-crm.homes',
  };

  static String get baseUrl => _baseUrls[AuthConfig.environment]!;
}
