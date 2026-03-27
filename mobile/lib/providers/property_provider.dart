import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/property.dart';
import '../services/offline_service.dart';
import '../services/property_service.dart';

class PropertyFilter {
  final String? search;
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
    this.search,
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
    String? Function()? search,
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
      search: search != null ? search() : this.search,
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
  final bool isFromCache;
  final String? error;

  const PropertyListState({
    this.properties = const [],
    this.total = 0,
    this.currentPage = 1,
    this.isLoading = false,
    this.isLoadingMore = false,
    this.isFromCache = false,
    this.error,
  });

  bool get hasMore => properties.length < total;

  PropertyListState copyWith({
    List<Property>? properties,
    int? total,
    int? currentPage,
    bool? isLoading,
    bool? isLoadingMore,
    bool? isFromCache,
    String? Function()? error,
  }) {
    return PropertyListState(
      properties: properties ?? this.properties,
      total: total ?? this.total,
      currentPage: currentPage ?? this.currentPage,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      isFromCache: isFromCache ?? this.isFromCache,
      error: error != null ? error() : this.error,
    );
  }
}

class PropertyListNotifier extends StateNotifier<PropertyListState> {
  final PropertyService _service;
  final OfflineService _offlineService;
  final Ref _ref;

  PropertyListNotifier(this._service, this._offlineService, this._ref)
      : super(const PropertyListState()) {
    loadProperties();
  }

  Future<void> loadProperties() async {
    state = state.copyWith(isLoading: true, error: () => null);
    try {
      final filter = _ref.read(propertyFilterProvider);
      final response = await _service.getProperties(
        page: 1,
        search: filter.search,
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
      // Cache first page for offline use
      if (!filter.hasActiveFilters && (filter.search == null || filter.search!.isEmpty)) {
        _cacheProperties(response.data);
      }
    } catch (e) {
      // Fallback to cached data when offline
      final cached = _offlineService.getCachedProperties();
      if (cached.isNotEmpty) {
        final properties = cached.map((json) => Property.fromJson(json)).toList();
        state = PropertyListState(
          properties: properties,
          total: properties.length,
          currentPage: 1,
          isFromCache: true,
        );
        debugPrint('PropertyListNotifier: loaded ${properties.length} cached properties');
      } else {
        state = state.copyWith(
          isLoading: false,
          error: () => e.toString(),
        );
      }
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
        search: filter.search,
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

  void _cacheProperties(List<Property> properties) {
    final jsonList = properties.map((p) => {
      'id': p.id,
      'title': p.title,
      'description': p.description,
      'type': p.type.value,
      'status': p.status.value,
      'price': p.price.toString(),
      'area': p.area.toString(),
      'bedrooms': p.bedrooms,
      'bathrooms': p.bathrooms,
      'floor': p.floor,
      'address': p.address,
      'city': p.city,
      'region': p.region,
      'latitude': p.latitude?.toString(),
      'longitude': p.longitude?.toString(),
      'features': p.features,
      'assignedAgentId': p.assignedAgentId,
      'assignedAgent': p.assignedAgent != null
          ? {
              'id': p.assignedAgent!.id,
              'firstName': p.assignedAgent!.firstName,
              'lastName': p.assignedAgent!.lastName,
              'email': p.assignedAgent!.email,
              'phone': p.assignedAgent!.phone,
            }
          : null,
      'images': p.images
          .map((img) => {
                'id': img.id,
                'url': img.url,
                'caption': img.caption,
                'isPrimary': img.isPrimary,
                'order': img.order,
              })
          .toList(),
      'createdAt': p.createdAt.toIso8601String(),
      'updatedAt': p.updatedAt.toIso8601String(),
    }).toList();
    _offlineService.cacheProperties(jsonList);
  }
}

final propertyListProvider =
    StateNotifierProvider<PropertyListNotifier, PropertyListState>((ref) {
  final service = ref.watch(propertyServiceProvider);
  final offlineService = ref.watch(offlineServiceProvider);
  ref.watch(propertyFilterProvider);
  return PropertyListNotifier(service, offlineService, ref);
});

final propertyDetailProvider =
    FutureProvider.family<Property, String>((ref, id) async {
  final service = ref.watch(propertyServiceProvider);
  final offlineService = ref.watch(offlineServiceProvider);
  try {
    final property = await service.getProperty(id);
    // Cache individual property for offline access
    offlineService.cacheProperty(id, {
      'id': property.id,
      'title': property.title,
      'description': property.description,
      'type': property.type.value,
      'status': property.status.value,
      'price': property.price.toString(),
      'area': property.area.toString(),
      'bedrooms': property.bedrooms,
      'bathrooms': property.bathrooms,
      'floor': property.floor,
      'address': property.address,
      'city': property.city,
      'region': property.region,
      'latitude': property.latitude?.toString(),
      'longitude': property.longitude?.toString(),
      'features': property.features,
      'assignedAgentId': property.assignedAgentId,
      'assignedAgent': property.assignedAgent != null
          ? {
              'id': property.assignedAgent!.id,
              'firstName': property.assignedAgent!.firstName,
              'lastName': property.assignedAgent!.lastName,
              'email': property.assignedAgent!.email,
              'phone': property.assignedAgent!.phone,
            }
          : null,
      'images': property.images
          .map((img) => {
                'id': img.id,
                'url': img.url,
                'caption': img.caption,
                'isPrimary': img.isPrimary,
                'order': img.order,
              })
          .toList(),
      'createdAt': property.createdAt.toIso8601String(),
      'updatedAt': property.updatedAt.toIso8601String(),
    });
    return property;
  } catch (e) {
    // Fallback to cached property when offline
    final cached = offlineService.getCachedProperty(id);
    if (cached != null) {
      debugPrint('propertyDetailProvider: loaded cached property $id');
      return Property.fromJson(cached);
    }
    rethrow;
  }
});
