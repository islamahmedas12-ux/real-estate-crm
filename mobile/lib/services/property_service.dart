import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/property.dart';
import 'api_client.dart';

class PropertyService {
  final ApiClient _apiClient;

  PropertyService(this._apiClient);

  Future<PropertyListResponse> getProperties({
    int page = 1,
    int limit = 20,
    PropertyType? type,
    PropertyStatus? status,
    String? city,
    int? bedrooms,
    double? minPrice,
    double? maxPrice,
    double? minArea,
    double? maxArea,
    String sortBy = 'createdAt',
    String sortOrder = 'desc',
  }) async {
    final params = <String, dynamic>{
      'page': page,
      'limit': limit,
      'sortBy': sortBy,
      'sortOrder': sortOrder,
    };

    if (type != null) params['type'] = type.value;
    if (status != null) params['status'] = status.value;
    if (city != null && city.isNotEmpty) params['city'] = city;
    if (bedrooms != null) params['bedrooms'] = bedrooms;
    if (minPrice != null) params['minPrice'] = minPrice.toStringAsFixed(2);
    if (maxPrice != null) params['maxPrice'] = maxPrice.toStringAsFixed(2);
    if (minArea != null) params['minArea'] = minArea.toStringAsFixed(2);
    if (maxArea != null) params['maxArea'] = maxArea.toStringAsFixed(2);

    final response = await _apiClient.dio.get(
      '/api/properties',
      queryParameters: params,
    );

    return PropertyListResponse.fromJson(response.data as Map<String, dynamic>);
  }

  Future<Property> getProperty(String id) async {
    final response = await _apiClient.dio.get('/api/properties/$id');
    return Property.fromJson(response.data as Map<String, dynamic>);
  }

  Future<PropertyStats> getStats() async {
    final response = await _apiClient.dio.get('/api/properties/stats');
    return PropertyStats.fromJson(response.data as Map<String, dynamic>);
  }
}

final propertyServiceProvider = Provider<PropertyService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return PropertyService(apiClient);
});
