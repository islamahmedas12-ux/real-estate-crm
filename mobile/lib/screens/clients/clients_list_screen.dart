import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:shimmer/shimmer.dart';

import '../../models/client.dart';
import '../../providers/client_provider.dart';

class ClientsListScreen extends ConsumerStatefulWidget {
  const ClientsListScreen({super.key});

  @override
  ConsumerState<ClientsListScreen> createState() => _ClientsListScreenState();
}

class _ClientsListScreenState extends ConsumerState<ClientsListScreen> {
  final _searchController = TextEditingController();
  bool _showSearch = false;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    ref.read(clientFilterProvider.notifier).state =
        ref.read(clientFilterProvider).copyWith(
            search: () => query.isEmpty ? null : query);
  }

  void _setTypeFilter(ClientType? type) {
    ref.read(clientFilterProvider.notifier).state =
        ref.read(clientFilterProvider).copyWith(type: () => type);
  }

  @override
  Widget build(BuildContext context) {
    final listState = ref.watch(clientListProvider);
    final filter = ref.watch(clientFilterProvider);

    return Scaffold(
      appBar: AppBar(
        title: _showSearch
            ? TextField(
                controller: _searchController,
                autofocus: true,
                decoration: const InputDecoration(
                  hintText: 'Search clients...',
                  border: InputBorder.none,
                  filled: false,
                  contentPadding: EdgeInsets.zero,
                ),
                onChanged: _onSearchChanged,
              )
            : const Text('Clients'),
        actions: [
          IconButton(
            icon: Icon(_showSearch ? Icons.close : Icons.search),
            onPressed: () {
              setState(() {
                _showSearch = !_showSearch;
                if (!_showSearch) {
                  _searchController.clear();
                  _onSearchChanged('');
                }
              });
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Type filter chips
          _TypeFilterBar(
            selected: filter.type,
            onChanged: _setTypeFilter,
          ),
          Expanded(child: _buildBody(context, listState)),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/clients/new'),
        child: const Icon(Icons.person_add),
      ),
    );
  }

  Widget _buildBody(BuildContext context, ClientListState state) {
    if (state.isLoading) {
      return _buildShimmer();
    }

    if (state.error != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.grey),
            const SizedBox(height: 16),
            Text('Failed to load clients',
                style: Theme.of(context).textTheme.bodyLarge),
            const SizedBox(height: 8),
            FilledButton.tonal(
              onPressed: () =>
                  ref.read(clientListProvider.notifier).loadClients(),
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (state.clients.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.people_outlined, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            Text('No clients found',
                style: Theme.of(context).textTheme.bodyLarge),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => ref.read(clientListProvider.notifier).loadClients(),
      child: NotificationListener<ScrollNotification>(
        onNotification: (notification) {
          if (notification is ScrollEndNotification &&
              notification.metrics.extentAfter < 200) {
            ref.read(clientListProvider.notifier).loadMore();
          }
          return false;
        },
        child: ListView.builder(
          padding: const EdgeInsets.only(top: 4, bottom: 80),
          itemCount: state.clients.length + (state.isLoadingMore ? 1 : 0),
          itemBuilder: (context, index) {
            if (index == state.clients.length) {
              return const Center(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: CircularProgressIndicator(),
                ),
              );
            }
            return _ClientListTile(client: state.clients[index]);
          },
        ),
      ),
    );
  }

  Widget _buildShimmer() {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade300,
      highlightColor: Colors.grey.shade100,
      child: ListView.builder(
        itemCount: 6,
        itemBuilder: (_, __) => const Card(child: SizedBox(height: 80)),
      ),
    );
  }
}

class _TypeFilterBar extends StatelessWidget {
  final ClientType? selected;
  final ValueChanged<ClientType?> onChanged;

  const _TypeFilterBar({required this.selected, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 48,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        children: [
          _chip(context, null, 'All'),
          ...ClientType.values.map((t) => _chip(context, t, t.label)),
        ],
      ),
    );
  }

  Widget _chip(BuildContext context, ClientType? type, String label) {
    final isSelected = selected == type;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (_) => onChanged(isSelected ? null : type),
        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
        visualDensity: VisualDensity.compact,
      ),
    );
  }
}

class _ClientListTile extends StatelessWidget {
  final Client client;

  const _ClientListTile({required this.client});

  Color get _typeColor {
    switch (client.type) {
      case ClientType.buyer:
        return Colors.blue;
      case ClientType.seller:
        return Colors.green;
      case ClientType.tenant:
        return Colors.orange;
      case ClientType.landlord:
        return Colors.purple;
      case ClientType.investor:
        return Colors.teal;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final dateStr = DateFormat('MMM d, y').format(client.createdAt);

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/clients/${client.id}'),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              CircleAvatar(
                backgroundColor: _typeColor.withValues(alpha: 0.15),
                child: Text(
                  client.firstName.isNotEmpty
                      ? client.firstName[0].toUpperCase()
                      : '?',
                  style: TextStyle(
                    color: _typeColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            client.fullName,
                            style: theme.textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: _typeColor.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            client.type.label,
                            style: TextStyle(
                              color: _typeColor,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(Icons.phone, size: 14,
                            color: theme.colorScheme.onSurfaceVariant),
                        const SizedBox(width: 4),
                        Text(
                          client.phone,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                        const Spacer(),
                        Text(
                          dateStr,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                    if (client.leadsCount > 0 || client.contractsCount > 0)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Row(
                          children: [
                            if (client.leadsCount > 0) ...[
                              Icon(Icons.person_search, size: 14,
                                  color: theme.colorScheme.onSurfaceVariant),
                              const SizedBox(width: 2),
                              Text(
                                '${client.leadsCount} leads',
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: theme.colorScheme.onSurfaceVariant,
                                ),
                              ),
                              const SizedBox(width: 12),
                            ],
                            if (client.contractsCount > 0) ...[
                              Icon(Icons.description, size: 14,
                                  color: theme.colorScheme.onSurfaceVariant),
                              const SizedBox(width: 2),
                              Text(
                                '${client.contractsCount} contracts',
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: theme.colorScheme.onSurfaceVariant,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
