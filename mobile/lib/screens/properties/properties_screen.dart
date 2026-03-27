import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';

import '../../models/property.dart';
import '../../providers/property_provider.dart';
import 'property_filter_sheet.dart';

final _viewModeProvider = StateProvider<bool>((ref) => false); // false=list, true=grid

class PropertiesScreen extends ConsumerStatefulWidget {
  const PropertiesScreen({super.key});

  @override
  ConsumerState<PropertiesScreen> createState() => _PropertiesScreenState();
}

class _PropertiesScreenState extends ConsumerState<PropertiesScreen> {
  final _searchController = TextEditingController();
  Timer? _debounce;
  bool _showSearch = false;

  @override
  void dispose() {
    _searchController.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () {
      ref.read(propertyFilterProvider.notifier).state =
          ref.read(propertyFilterProvider).copyWith(
                search: () => query.isEmpty ? null : query,
              );
    });
  }

  void _toggleSearch() {
    setState(() {
      _showSearch = !_showSearch;
      if (!_showSearch) {
        _searchController.clear();
        _debounce?.cancel();
        // Clear search filter
        final current = ref.read(propertyFilterProvider);
        if (current.search != null) {
          ref.read(propertyFilterProvider.notifier).state =
              current.copyWith(search: () => null);
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final listState = ref.watch(propertyListProvider);
    final isGrid = ref.watch(_viewModeProvider);
    final filter = ref.watch(propertyFilterProvider);

    return Scaffold(
      appBar: AppBar(
        title: _showSearch
            ? TextField(
                controller: _searchController,
                autofocus: true,
                decoration: const InputDecoration(
                  hintText: 'Search properties...',
                  border: InputBorder.none,
                ),
                onChanged: _onSearchChanged,
              )
            : const Text('Properties'),
        actions: [
          IconButton(
            icon: Icon(_showSearch ? Icons.close : Icons.search),
            tooltip: _showSearch ? 'Close search' : 'Search',
            onPressed: _toggleSearch,
          ),
          IconButton(
            icon: Icon(isGrid ? Icons.view_list : Icons.grid_view),
            tooltip: isGrid ? 'List view' : 'Grid view',
            onPressed: () =>
                ref.read(_viewModeProvider.notifier).state = !isGrid,
          ),
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.filter_list),
                tooltip: 'Filters',
                onPressed: () => _showFilters(context, ref),
              ),
              if (filter.hasActiveFilters)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      color: Colors.red,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
      body: _buildBody(context, ref, listState, isGrid),
    );
  }

  Widget _buildBody(
    BuildContext context,
    WidgetRef ref,
    PropertyListState state,
    bool isGrid,
  ) {
    if (state.isLoading) {
      return _buildShimmer(isGrid);
    }

    if (state.error != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.grey),
            const SizedBox(height: 16),
            Text('Failed to load properties',
                style: Theme.of(context).textTheme.bodyLarge),
            const SizedBox(height: 8),
            FilledButton.tonal(
              onPressed: () =>
                  ref.read(propertyListProvider.notifier).loadProperties(),
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (state.properties.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.apartment_outlined, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            Text('No properties found',
                style: Theme.of(context).textTheme.bodyLarge),
          ],
        ),
      );
    }

    return Column(
      children: [
        if (state.isFromCache)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: Colors.orange.shade100,
            child: Row(
              children: [
                Icon(Icons.cloud_off, size: 16, color: Colors.orange.shade800),
                const SizedBox(width: 8),
                Text(
                  'Showing cached data — pull to refresh when online',
                  style: TextStyle(fontSize: 12, color: Colors.orange.shade800),
                ),
              ],
            ),
          ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: () =>
                ref.read(propertyListProvider.notifier).loadProperties(),
            child: isGrid
                ? _buildGrid(context, ref, state)
                : _buildList(context, ref, state),
          ),
        ),
      ],
    );
  }

  Widget _buildList(BuildContext context, WidgetRef ref, PropertyListState state) {
    return NotificationListener<ScrollNotification>(
      onNotification: (notification) {
        if (notification is ScrollEndNotification &&
            notification.metrics.extentAfter < 200) {
          ref.read(propertyListProvider.notifier).loadMore();
        }
        return false;
      },
      child: ListView.builder(
        padding: const EdgeInsets.only(top: 8, bottom: 80),
        itemCount: state.properties.length + (state.isLoadingMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == state.properties.length) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: CircularProgressIndicator(),
              ),
            );
          }
          return _PropertyListTile(property: state.properties[index]);
        },
      ),
    );
  }

  Widget _buildGrid(BuildContext context, WidgetRef ref, PropertyListState state) {
    return NotificationListener<ScrollNotification>(
      onNotification: (notification) {
        if (notification is ScrollEndNotification &&
            notification.metrics.extentAfter < 200) {
          ref.read(propertyListProvider.notifier).loadMore();
        }
        return false;
      },
      child: GridView.builder(
        padding: const EdgeInsets.all(12),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.72,
          crossAxisSpacing: 10,
          mainAxisSpacing: 10,
        ),
        itemCount: state.properties.length + (state.isLoadingMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == state.properties.length) {
            return const Center(child: CircularProgressIndicator());
          }
          return _PropertyGridTile(property: state.properties[index]);
        },
      ),
    );
  }

  Widget _buildShimmer(bool isGrid) {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade300,
      highlightColor: Colors.grey.shade100,
      child: isGrid
          ? GridView.builder(
              padding: const EdgeInsets.all(12),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.72,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
              ),
              itemCount: 6,
              itemBuilder: (_, __) => Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            )
          : ListView.builder(
              itemCount: 5,
              itemBuilder: (_, __) => const Card(
                child: SizedBox(height: 120),
              ),
            ),
    );
  }

  void _showFilters(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (context) => const PropertyFilterSheet(),
    );
  }
}

class _PropertyListTile extends StatelessWidget {
  final Property property;

  const _PropertyListTile({required this.property});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final imageUrl = property.primaryImage?.url;

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/properties/${property.id}'),
        child: Row(
          children: [
            SizedBox(
              width: 130,
              height: 120,
              child: imageUrl != null
                  ? CachedNetworkImage(
                      imageUrl: imageUrl,
                      fit: BoxFit.cover,
                      placeholder: (_, __) => Container(color: Colors.grey.shade200),
                      errorWidget: (_, __, ___) =>
                          const Icon(Icons.apartment, size: 40, color: Colors.grey),
                    )
                  : Container(
                      color: Colors.grey.shade200,
                      child: const Icon(Icons.apartment, size: 40, color: Colors.grey),
                    ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            property.title,
                            style: theme.textTheme.titleSmall,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        _StatusChip(status: property.status),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      property.locationText,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      property.priceFormatted,
                      style: theme.textTheme.titleMedium?.copyWith(
                        color: theme.colorScheme.primary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    _PropertyMeta(property: property),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PropertyGridTile extends StatelessWidget {
  final Property property;

  const _PropertyGridTile({required this.property});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final imageUrl = property.primaryImage?.url;

    return Card(
      clipBehavior: Clip.antiAlias,
      margin: EdgeInsets.zero,
      child: InkWell(
        onTap: () => context.push('/properties/${property.id}'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 1.3,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  imageUrl != null
                      ? CachedNetworkImage(
                          imageUrl: imageUrl,
                          fit: BoxFit.cover,
                          placeholder: (_, __) =>
                              Container(color: Colors.grey.shade200),
                          errorWidget: (_, __, ___) => Container(
                            color: Colors.grey.shade200,
                            child: const Icon(Icons.apartment, color: Colors.grey),
                          ),
                        )
                      : Container(
                          color: Colors.grey.shade200,
                          child: const Icon(Icons.apartment, color: Colors.grey),
                        ),
                  Positioned(
                    top: 6,
                    right: 6,
                    child: _StatusChip(status: property.status),
                  ),
                ],
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      property.title,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      property.locationText,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const Spacer(),
                    Text(
                      property.priceFormatted,
                      style: theme.textTheme.titleSmall?.copyWith(
                        color: theme.colorScheme.primary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final PropertyStatus status;

  const _StatusChip({required this.status});

  Color get _color {
    switch (status) {
      case PropertyStatus.available:
        return Colors.green;
      case PropertyStatus.reserved:
        return Colors.orange;
      case PropertyStatus.sold:
        return Colors.blue;
      case PropertyStatus.rented:
        return Colors.purple;
      case PropertyStatus.offMarket:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: _color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        status.label,
        style: TextStyle(
          color: _color,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _PropertyMeta extends StatelessWidget {
  final Property property;

  const _PropertyMeta({required this.property});

  @override
  Widget build(BuildContext context) {
    final style = Theme.of(context).textTheme.bodySmall?.copyWith(
          color: Theme.of(context).colorScheme.onSurfaceVariant,
        );
    return Row(
      children: [
        if (property.bedrooms != null) ...[
          Icon(Icons.bed_outlined, size: 14, color: style?.color),
          const SizedBox(width: 2),
          Text('${property.bedrooms}', style: style),
          const SizedBox(width: 10),
        ],
        if (property.bathrooms != null) ...[
          Icon(Icons.bathtub_outlined, size: 14, color: style?.color),
          const SizedBox(width: 2),
          Text('${property.bathrooms}', style: style),
          const SizedBox(width: 10),
        ],
        Icon(Icons.square_foot, size: 14, color: style?.color),
        const SizedBox(width: 2),
        Text('${property.area.toStringAsFixed(0)} m²', style: style),
      ],
    );
  }
}
