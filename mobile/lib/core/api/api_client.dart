import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../auth/auth_provider.dart';
import 'api_config.dart';

/// Dio-based HTTP client with automatic Bearer token injection and 401 retry.
///
/// The [_AuthInterceptor] intercepts every outgoing request, reads a valid
/// access token from [AuthNotifier.getValidTokens], and adds the
/// `Authorization: Bearer <token>` header.  On a 401 response it attempts a
/// silent token refresh and retries the original request once before logging
/// the user out.
class ApiClient {
  late final Dio dio;
  final Ref _ref;

  ApiClient(this._ref) {
    dio = Dio(
      BaseOptions(
        baseUrl: ApiConfig.baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 30),
        headers: const {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    dio.interceptors.add(_AuthInterceptor(_ref));
  }
}

// ---------------------------------------------------------------------------
// Auth interceptor
// ---------------------------------------------------------------------------

class _AuthInterceptor extends Interceptor {
  final Ref _ref;
  _AuthInterceptor(this._ref);

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    try {
      final notifier = _ref.read(authProvider.notifier);
      final tokens = await notifier.getValidTokens();
      if (tokens != null) {
        options.headers['Authorization'] = 'Bearer ${tokens.accessToken}';
      }
    } catch (_) {
      // If token retrieval fails, forward the request without a token.
      // The server will respond with 401 which we handle below.
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      final notifier = _ref.read(authProvider.notifier);
      final refreshed = await notifier.getValidTokens();

      if (refreshed != null) {
        // Retry the original request with the refreshed token.
        final opts = Options(
          method: err.requestOptions.method,
          headers: {
            ...err.requestOptions.headers,
            'Authorization': 'Bearer ${refreshed.accessToken}',
          },
        );

        try {
          final retryDio = Dio(BaseOptions(baseUrl: ApiConfig.baseUrl));
          final response = await retryDio.request<dynamic>(
            err.requestOptions.path,
            data: err.requestOptions.data,
            queryParameters: err.requestOptions.queryParameters,
            options: opts,
          );
          return handler.resolve(response);
        } on DioException catch (e) {
          return handler.next(e);
        }
      }

      // Could not refresh — force logout.
      await notifier.logout();
    }

    handler.next(err);
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient(ref));
