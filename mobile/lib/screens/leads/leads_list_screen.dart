import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:shimmer/shimmer.dart';

import '../../models/lead.dart';
import '../../providers/lead_provider.dart';
import '../../widgets/lead_status_badge.dart';

class LeadsListScreen extends ConsumerStatefulWidget {
  const LeadsListScreen({super.key});

  @override
  ConsumerState<LeadsListScreen> createState() => _LeadsListScreenState();
}

class _LeadsListScreenState extends ConsumerState<LeadsListScreen> {
  final _searchController = TextEditingController();
  bool _showSearch = false;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    ref.read(leadFilterProvider.notifier).state =
        ref.read(leadFilterProvider).copyWith(search: () => query.isEmpty ? null : query);
  }

  void _setStatusFilter(LeadStatus? status) {
    ref.read(leadFilterProvider.notifier).state =
        ref.read(leadFilterProvider).copyWith(status: () => status);
  }

  @override
  Widget build(BuildContext context) {
    final listState = ref.watch(leadListProvider);
    final filter = ref.watch(leadFilterProvider);

    return Scaffold(
      appBar: AppBar(
        title: _showSearch
            ? TextField(
                controller: _searchController,
                autofocus: true,
                decoration: const InputDecoration(
                  hintText: 'Search leads...',
                  border: InputBorder.none,
                  filled: false,
                  contentPadding: EdgeInsets.zero,
                ),
                onChanged: _onSearchChanged,
              )
            : const Text('Leads'),
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
          // Status filter chips
          _StatusFilterBar(
            selected: filter.status,
            onChanged: _setStatusFilter,
          ),
          // List
          Expanded(child: _buildBody(context, listState)),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/leads/new'),
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildBody(BuildContext context, LeadListState state) {
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
            Text('Failed to load leads',
                style: Theme.of(context).textTheme.bodyLarge),
            const SizedBox(height: 8),
            FilledButton.tonal(
              onPressed: () =>
                  ref.read(leadListProvider.notifier).loadLeads(),
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (state.leads.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.person_search_outlined,
                size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            Text('No leads found',
                style: Theme.of(context).textTheme.bodyLarge),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => ref.read(leadListProvider.notifier).loadLeads(),
      child: NotificationListener<ScrollNotification>(
        onNotification: (notification) {
          if (notification is ScrollEndNotification &&
              notification.metrics.extentAfter < 200) {
            ref.read(leadListProvider.notifier).loadMore();
          }
          return false;
        },
        child: ListView.builder(
          padding: const EdgeInsets.only(top: 4, bottom: 80),
          itemCount: state.leads.length + (state.isLoadingMore ? 1 : 0),
          itemBuilder: (context, index) {
            if (index == state.leads.length) {
              return const Center(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: CircularProgressIndicator(),
                ),
              );
            }
            return _LeadListTile(lead: state.leads[index]);
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
        itemBuilder: (_, __) => const Card(child: SizedBox(height: 88)),
      ),
    );
  }
}

class _StatusFilterBar extends StatelessWidget {
  final LeadStatus? selected;
  final ValueChanged<LeadStatus?> onChanged;

  const _StatusFilterBar({required this.selected, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 48,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        children: [
          _chip(context, null, 'All'),
          ...LeadStatus.values.map((s) => _chip(context, s, s.label)),
        ],
      ),
    );
  }

  Widget _chip(BuildContext context, LeadStatus? status, String label) {
    final isSelected = selected == status;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (_) => onChanged(isSelected ? null : status),
        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
        visualDensity: VisualDensity.compact,
      ),
    );
  }
}

class _LeadListTile extends StatelessWidget {
  final Lead lead;

  const _LeadListTile({required this.lead});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final dateStr = DateFormat('MMM d, y').format(lead.createdAt);

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/leads/${lead.id}'),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      lead.clientName,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  LeadStatusBadge(status: lead.status),
                ],
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  LeadPriorityBadge(priority: lead.priority),
                  if (lead.source != null) ...[
                    const SizedBox(width: 8),
                    Icon(Icons.source, size: 14,
                        color: theme.colorScheme.onSurfaceVariant),
                    const SizedBox(width: 4),
                    Text(
                      lead.source!,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                  const Spacer(),
                  if (lead.budget != null)
                    Text(
                      lead.budgetFormatted,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  if (lead.property != null) ...[
                    Icon(Icons.apartment, size: 14,
                        color: theme.colorScheme.onSurfaceVariant),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        lead.property!.title,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ] else
                    const Spacer(),
                  Text(
                    dateStr,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
              if (lead.nextFollowUp != null) ...[
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(
                      Icons.schedule,
                      size: 14,
                      color: lead.nextFollowUp!.isBefore(DateTime.now())
                          ? Colors.red
                          : Colors.orange,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Follow-up: ${DateFormat('MMM d').format(lead.nextFollowUp!)}',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: lead.nextFollowUp!.isBefore(DateTime.now())
                            ? Colors.red
                            : Colors.orange,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
