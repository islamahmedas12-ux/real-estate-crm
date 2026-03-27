import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/client.dart';
import 'api_client.dart';

class ClientsService {
  final ApiClient _apiClient;

  ClientsService(this._apiClient);

  Future<ClientListResponse> getClients({
    int page = 1,
    int pageSize = 20,
    String? search,
    ClientType? type,
    ClientSource? source,
    String? assignedAgentId,
    String sortBy = 'createdAt',
    String sortOrder = 'desc',
  }) async {
    final params = <String, dynamic>{
      'page': page,
      'pageSize': pageSize,
      'sortBy': sortBy,
      'sortOrder': sortOrder,
    };

    if (search != null && search.isNotEmpty) params['search'] = search;
    if (type != null) params['type'] = type.value;
    if (source != null) params['source'] = source.value;
    if (assignedAgentId != null) params['assignedAgentId'] = assignedAgentId;

    final response = await _apiClient.dio.get(
      '/api/clients',
      queryParameters: params,
    );

    return ClientListResponse.fromJson(response.data as Map<String, dynamic>);
  }

  Future<ClientDetail> getClient(String id) async {
    final response = await _apiClient.dio.get('/api/clients/$id');
    return ClientDetail.fromJson(response.data as Map<String, dynamic>);
  }

  Future<Client> createClient(Map<String, dynamic> data) async {
    final response = await _apiClient.dio.post('/api/clients', data: data);
    return Client.fromJson(response.data as Map<String, dynamic>);
  }

  Future<Client> updateClient(String id, Map<String, dynamic> data) async {
    final response = await _apiClient.dio.put('/api/clients/$id', data: data);
    return Client.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> deleteClient(String id) async {
    await _apiClient.dio.delete('/api/clients/$id');
  }
}

final clientsServiceProvider = Provider<ClientsService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return ClientsService(apiClient);
});
