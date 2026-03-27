import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/lead.dart';
import '../services/leads_service.dart';

// --- Filter ---

class LeadFilter {
  final LeadStatus? status;
  final LeadPriority? priority;
  final String? search;
  final String sortBy;
  final String sortOrder;

  const LeadFilter({
    this.status,
    this.priority,
    this.search,
    this.sortBy = 'createdAt',
    this.sortOrder = 'desc',
  });

  LeadFilter copyWith({
    LeadStatus? Function()? status,
    LeadPriority? Function()? priority,
    String? Function()? search,
    String? sortBy,
    String? sortOrder,
  }) {
    return LeadFilter(
      status: status != null ? status() : this.status,
      priority: priority != null ? priority() : this.priority,
      search: search != null ? search() : this.search,
      sortBy: sortBy ?? this.sortBy,
      sortOrder: sortOrder ?? this.sortOrder,
    );
  }

  bool get hasActiveFilters => status != null || priority != null;
}

final leadFilterProvider = StateProvider<LeadFilter>((ref) {
  return const LeadFilter();
});

// --- List state ---

class LeadListState {
  final List<Lead> leads;
  final int total;
  final int currentPage;
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;

  const LeadListState({
    this.leads = const [],
    this.total = 0,
    this.currentPage = 1,
    this.isLoading = false,
    this.isLoadingMore = false,
    this.error,
  });

  bool get hasMore => leads.length < total;

  LeadListState copyWith({
    List<Lead>? leads,
    int? total,
    int? currentPage,
    bool? isLoading,
    bool? isLoadingMore,
    String? Function()? error,
  }) {
    return LeadListState(
      leads: leads ?? this.leads,
      total: total ?? this.total,
      currentPage: currentPage ?? this.currentPage,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      error: error != null ? error() : this.error,
    );
  }
}

class LeadListNotifier extends StateNotifier<LeadListState> {
  final LeadsService _service;
  final Ref _ref;

  LeadListNotifier(this._service, this._ref) : super(const LeadListState()) {
    loadLeads();
  }

  Future<void> loadLeads() async {
    state = state.copyWith(isLoading: true, error: () => null);
    try {
      final filter = _ref.read(leadFilterProvider);
      final response = await _service.getLeads(
        page: 1,
        search: filter.search,
        status: filter.status,
        priority: filter.priority,
        sortBy: filter.sortBy,
        sortOrder: filter.sortOrder,
      );
      state = LeadListState(
        leads: response.data,
        total: response.total,
        currentPage: response.page,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: () => e.toString(),
      );
    }
  }

  Future<void> loadMore() async {
    if (!state.hasMore || state.isLoadingMore) return;
    state = state.copyWith(isLoadingMore: true);
    try {
      final filter = _ref.read(leadFilterProvider);
      final nextPage = state.currentPage + 1;
      final response = await _service.getLeads(
        page: nextPage,
        search: filter.search,
        status: filter.status,
        priority: filter.priority,
        sortBy: filter.sortBy,
        sortOrder: filter.sortOrder,
      );
      state = state.copyWith(
        leads: [...state.leads, ...response.data],
        total: response.total,
        currentPage: nextPage,
        isLoadingMore: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoadingMore: false,
        error: () => e.toString(),
      );
    }
  }
}

final leadListProvider =
    StateNotifierProvider<LeadListNotifier, LeadListState>((ref) {
  final service = ref.watch(leadsServiceProvider);
  ref.watch(leadFilterProvider);
  return LeadListNotifier(service, ref);
});

// --- Detail ---

final leadDetailProvider =
    FutureProvider.family<Lead, String>((ref, id) {
  final service = ref.watch(leadsServiceProvider);
  return service.getLead(id);
});

final leadActivitiesProvider =
    FutureProvider.family<List<LeadActivity>, String>((ref, leadId) {
  final service = ref.watch(leadsServiceProvider);
  return service.getActivities(leadId);
});
