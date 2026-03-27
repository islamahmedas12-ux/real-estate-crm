import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/property.dart';
import '../services/property_service.dart';

class PropertyFilter {
  final PropertyType? type;
  final PropertyStatus? status;
  final String? city;
  final int? bedrooms;
  final double? minPrice;
  final double? maxPrice;
  final double? minArea;
  final double? maxArea;
  final String sortBy;
  final String sortOrder;

  const PropertyFilter({
    this.type,
    this.status,
    this.city,
    this.bedrooms,
    this.minPrice,
    this.maxPrice,
    this.minArea,
    this.maxArea,
    this.sortBy = 'createdAt',
    this.sortOrder = 'desc',
  });

  PropertyFilter copyWith({
    PropertyType? Function()? type,
    PropertyStatus? Function()? status,
    String? Function()? city,
    int? Function()? bedrooms,
    double? Function()? minPrice,
    double? Function()? maxPrice,
    double? Function()? minArea,
    double? Function()? maxArea,
    String? sortBy,
    String? sortOrder,
  }) {
    return PropertyFilter(
      type: type != null ? type() : this.type,
      status: status != null ? status() : this.status,
      city: city != null ? city() : this.city,
      bedrooms: bedrooms != null ? bedrooms() : this.bedrooms,
      minPrice: minPrice != null ? minPrice() : this.minPrice,
      maxPrice: maxPrice != null ? maxPrice() : this.maxPrice,
      minArea: minArea != null ? minArea() : this.minArea,
      maxArea: maxArea != null ? maxArea() : this.maxArea,
      sortBy: sortBy ?? this.sortBy,
      sortOrder: sortOrder ?? this.sortOrder,
    );
  }

  bool get hasActiveFilters =>
      type != null ||
      status != null ||
      (city != null && city!.isNotEmpty) ||
      bedrooms != null ||
      minPrice != null ||
      maxPrice != null ||
      minArea != null ||
      maxArea != null;
}

final propertyFilterProvider = StateProvider<PropertyFilter>((ref) {
  return const PropertyFilter();
});

class PropertyListState {
  final List<Property> properties;
  final int total;
  final int currentPage;
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;

  const PropertyListState({
    this.properties = const [],
    this.total = 0,
    this.currentPage = 1,
    this.isLoading = false,
    this.isLoadingMore = false,
    this.error,
  });

  bool get hasMore => properties.length < total;

  PropertyListState copyWith({
    List<Property>? properties,
    int? total,
    int? currentPage,
    bool? isLoading,
    bool? isLoadingMore,
    String? Function()? error,
  }) {
    return PropertyListState(
      properties: properties ?? this.properties,
      total: total ?? this.total,
      currentPage: currentPage ?? this.currentPage,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      error: error != null ? error() : this.error,
    );
  }
}

class PropertyListNotifier extends StateNotifier<PropertyListState> {
  final PropertyService _service;
  final Ref _ref;

  PropertyListNotifier(this._service, this._ref) : super(const PropertyListState()) {
    loadProperties();
  }

  Future<void> loadProperties() async {
    state = state.copyWith(isLoading: true, error: () => null);
    try {
      final filter = _ref.read(propertyFilterProvider);
      final response = await _service.getProperties(
        page: 1,
        type: filter.type,
        status: filter.status,
        city: filter.city,
        bedrooms: filter.bedrooms,
        minPrice: filter.minPrice,
        maxPrice: filter.maxPrice,
        minArea: filter.minArea,
        maxArea: filter.maxArea,
        sortBy: filter.sortBy,
        sortOrder: filter.sortOrder,
      );
      state = PropertyListState(
        properties: response.data,
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
      final filter = _ref.read(propertyFilterProvider);
      final nextPage = state.currentPage + 1;
      final response = await _service.getProperties(
        page: nextPage,
        type: filter.type,
        status: filter.status,
        city: filter.city,
        bedrooms: filter.bedrooms,
        minPrice: filter.minPrice,
        maxPrice: filter.maxPrice,
        minArea: filter.minArea,
        maxArea: filter.maxArea,
        sortBy: filter.sortBy,
        sortOrder: filter.sortOrder,
      );
      state = state.copyWith(
        properties: [...state.properties, ...response.data],
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

final propertyListProvider =
    StateNotifierProvider<PropertyListNotifier, PropertyListState>((ref) {
  final service = ref.watch(propertyServiceProvider);
  ref.watch(propertyFilterProvider);
  return PropertyListNotifier(service, ref);
});

final propertyDetailProvider =
    FutureProvider.family<Property, String>((ref, id) {
  final service = ref.watch(propertyServiceProvider);
  return service.getProperty(id);
});
