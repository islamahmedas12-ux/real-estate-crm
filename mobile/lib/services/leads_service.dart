import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/lead.dart';
import 'api_client.dart';

class LeadsService {
  final ApiClient _apiClient;

  LeadsService(this._apiClient);

  Future<LeadListResponse> getLeads({
    int page = 1,
    int pageSize = 20,
    String? search,
    LeadStatus? status,
    LeadPriority? priority,
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
    if (status != null) params['status'] = status.value;
    if (priority != null) params['priority'] = priority.value;
    if (assignedAgentId != null) params['assignedAgentId'] = assignedAgentId;

    final response = await _apiClient.dio.get(
      '/api/leads',
      queryParameters: params,
    );

    return LeadListResponse.fromJson(response.data as Map<String, dynamic>);
  }

  Future<Lead> getLead(String id) async {
    final response = await _apiClient.dio.get('/api/leads/$id');
    return Lead.fromJson(response.data as Map<String, dynamic>);
  }

  Future<List<LeadActivity>> getActivities(
    String leadId, {
    int page = 1,
    int limit = 50,
  }) async {
    final response = await _apiClient.dio.get(
      '/api/leads/$leadId/activities',
      queryParameters: {'page': page, 'limit': limit},
    );

    final data = response.data as Map<String, dynamic>;
    final items = data['data'] as List? ?? [];
    return items
        .map((e) => LeadActivity.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Lead> createLead(Map<String, dynamic> data) async {
    final response = await _apiClient.dio.post('/api/leads', data: data);
    return Lead.fromJson(response.data as Map<String, dynamic>);
  }

  Future<Lead> updateLead(String id, Map<String, dynamic> data) async {
    final response = await _apiClient.dio.put('/api/leads/$id', data: data);
    return Lead.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> deleteLead(String id) async {
    await _apiClient.dio.delete('/api/leads/$id');
  }

  Future<Lead> changeStatus(String id, String status, {String? notes}) async {
    final data = <String, dynamic>{'status': status};
    if (notes != null) data['notes'] = notes;
    final response = await _apiClient.dio.patch(
      '/api/leads/$id/status',
      data: data,
    );
    return Lead.fromJson(response.data as Map<String, dynamic>);
  }

  Future<LeadActivity> addActivity(
    String leadId, {
    required String type,
    required String description,
  }) async {
    final response = await _apiClient.dio.post(
      '/api/leads/$leadId/activities',
      data: {'type': type, 'description': description},
    );
    return LeadActivity.fromJson(response.data as Map<String, dynamic>);
  }
}

final leadsServiceProvider = Provider<LeadsService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return LeadsService(apiClient);
});
