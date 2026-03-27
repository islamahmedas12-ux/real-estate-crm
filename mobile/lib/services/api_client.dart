import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/app_config.dart';
import '../providers/auth_provider.dart';

class ApiClient {
  late final Dio dio;
  final Ref _ref;

  ApiClient(this._ref) {
    dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    dio.interceptors.add(_AuthInterceptor(_ref));
  }
}

class _AuthInterceptor extends Interceptor {
  final Ref _ref;

  _AuthInterceptor(this._ref);

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final authNotifier = _ref.read(authStateProvider.notifier);
    final tokens = await authNotifier.getValidTokens();

    if (tokens != null) {
      options.headers['Authorization'] = 'Bearer ${tokens.accessToken}';
    }

    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      // Token expired — try refresh
      final authNotifier = _ref.read(authStateProvider.notifier);
      final newTokens = await authNotifier.refreshTokens();

      if (newTokens != null) {
        // Retry original request with new token
        final opts = err.requestOptions;
        opts.headers['Authorization'] = 'Bearer ${newTokens.accessToken}';

        try {
          final response = await Dio().fetch(opts);
          return handler.resolve(response);
        } on DioException catch (e) {
          return handler.next(e);
        }
      }

      // Refresh failed — logout
      await authNotifier.logout();
    }

    handler.next(err);
  }
}

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(ref);
});
