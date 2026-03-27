import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/client.dart';
import '../services/clients_service.dart';

// --- Filter ---

class ClientFilter {
  final ClientType? type;
  final ClientSource? source;
  final String? search;
  final String sortBy;
  final String sortOrder;

  const ClientFilter({
    this.type,
    this.source,
    this.search,
    this.sortBy = 'createdAt',
    this.sortOrder = 'desc',
  });

  ClientFilter copyWith({
    ClientType? Function()? type,
    ClientSource? Function()? source,
    String? Function()? search,
    String? sortBy,
    String? sortOrder,
  }) {
    return ClientFilter(
      type: type != null ? type() : this.type,
      source: source != null ? source() : this.source,
      search: search != null ? search() : this.search,
      sortBy: sortBy ?? this.sortBy,
      sortOrder: sortOrder ?? this.sortOrder,
    );
  }

  bool get hasActiveFilters => type != null || source != null;
}

final clientFilterProvider = StateProvider<ClientFilter>((ref) {
  return const ClientFilter();
});

// --- List state ---

class ClientListState {
  final List<Client> clients;
  final int total;
  final int currentPage;
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;

  const ClientListState({
    this.clients = const [],
    this.total = 0,
    this.currentPage = 1,
    this.isLoading = false,
    this.isLoadingMore = false,
    this.error,
  });

  bool get hasMore => clients.length < total;

  ClientListState copyWith({
    List<Client>? clients,
    int? total,
    int? currentPage,
    bool? isLoading,
    bool? isLoadingMore,
    String? Function()? error,
  }) {
    return ClientListState(
      clients: clients ?? this.clients,
      total: total ?? this.total,
      currentPage: currentPage ?? this.currentPage,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      error: error != null ? error() : this.error,
    );
  }
}

class ClientListNotifier extends StateNotifier<ClientListState> {
  final ClientsService _service;
  final Ref _ref;

  ClientListNotifier(this._service, this._ref)
      : super(const ClientListState()) {
    loadClients();
  }

  Future<void> loadClients() async {
    state = state.copyWith(isLoading: true, error: () => null);
    try {
      final filter = _ref.read(clientFilterProvider);
      final response = await _service.getClients(
        page: 1,
        search: filter.search,
        type: filter.type,
        source: filter.source,
        sortBy: filter.sortBy,
        sortOrder: filter.sortOrder,
      );
      state = ClientListState(
        clients: response.data,
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
      final filter = _ref.read(clientFilterProvider);
      final nextPage = state.currentPage + 1;
      final response = await _service.getClients(
        page: nextPage,
        search: filter.search,
        type: filter.type,
        source: filter.source,
        sortBy: filter.sortBy,
        sortOrder: filter.sortOrder,
      );
      state = state.copyWith(
        clients: [...state.clients, ...response.data],
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

final clientListProvider =
    StateNotifierProvider<ClientListNotifier, ClientListState>((ref) {
  final service = ref.watch(clientsServiceProvider);
  ref.watch(clientFilterProvider);
  return ClientListNotifier(service, ref);
});

// --- Detail ---

final clientDetailProvider =
    FutureProvider.family<ClientDetail, String>((ref, id) {
  final service = ref.watch(clientsServiceProvider);
  return service.getClient(id);
});
