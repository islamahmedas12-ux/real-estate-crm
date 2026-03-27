import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../models/lead.dart';
import '../../providers/lead_provider.dart';
import '../../services/leads_service.dart';
import '../../widgets/lead_status_badge.dart';
import '../../widgets/activity_timeline.dart';

class LeadDetailScreen extends ConsumerWidget {
  final String leadId;

  const LeadDetailScreen({super.key, required this.leadId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final leadAsync = ref.watch(leadDetailProvider(leadId));

    return leadAsync.when(
      loading: () => Scaffold(
        appBar: AppBar(),
        body: const Center(child: CircularProgressIndicator()),
      ),
      error: (error, _) => Scaffold(
        appBar: AppBar(),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.grey),
              const SizedBox(height: 16),
              const Text('Failed to load lead'),
              const SizedBox(height: 8),
              FilledButton.tonal(
                onPressed: () =>
                    ref.invalidate(leadDetailProvider(leadId)),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
      data: (lead) => _LeadDetailView(lead: lead, leadId: leadId),
    );
  }
}

class _LeadDetailView extends ConsumerWidget {
  final Lead lead;
  final String leadId;

  const _LeadDetailView({required this.lead, required this.leadId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final activitiesAsync = ref.watch(leadActivitiesProvider(leadId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Lead Details'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () async {
              final result = await context.push('/leads/$leadId/edit');
              if (result == true) {
                ref.invalidate(leadDetailProvider(leadId));
                ref.invalidate(leadActivitiesProvider(leadId));
              }
            },
          ),
          PopupMenuButton<String>(
            onSelected: (value) => _onMenuAction(context, ref, value),
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'add_activity',
                child: ListTile(
                  leading: Icon(Icons.add_comment),
                  title: Text('Add Activity'),
                  contentPadding: EdgeInsets.zero,
                ),
              ),
              const PopupMenuItem(
                value: 'change_status',
                child: ListTile(
                  leading: Icon(Icons.swap_horiz),
                  title: Text('Change Status'),
                  contentPadding: EdgeInsets.zero,
                ),
              ),
              const PopupMenuItem(
                value: 'delete',
                child: ListTile(
                  leading: Icon(Icons.delete, color: Colors.red),
                  title: Text('Delete', style: TextStyle(color: Colors.red)),
                  contentPadding: EdgeInsets.zero,
                ),
              ),
            ],
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Client info card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 24,
                          child: Text(
                            lead.clientName.isNotEmpty
                                ? lead.clientName[0].toUpperCase()
                                : '?',
                            style: const TextStyle(
                                fontSize: 20, fontWeight: FontWeight.bold),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                lead.clientName,
                                style: theme.textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              if (lead.client?.phone != null)
                                Text(
                                  lead.client!.phone,
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: theme.colorScheme.onSurfaceVariant,
                                  ),
                                ),
                            ],
                          ),
                        ),
                        if (lead.client?.phone != null)
                          IconButton(
                            icon: const Icon(Icons.phone),
                            onPressed: () => _callClient(lead.client!.phone),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 12),

            // Status & priority
            Row(
              children: [
                Expanded(
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        children: [
                          Text('Status',
                              style: theme.textTheme.bodySmall?.copyWith(
                                  color: theme.colorScheme.onSurfaceVariant)),
                          const SizedBox(height: 4),
                          LeadStatusBadge(status: lead.status, large: true),
                        ],
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        children: [
                          Text('Priority',
                              style: theme.textTheme.bodySmall?.copyWith(
                                  color: theme.colorScheme.onSurfaceVariant)),
                          const SizedBox(height: 4),
                          LeadPriorityBadge(priority: lead.priority),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            // Details
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Details', style: theme.textTheme.titleSmall),
                    const Divider(),
                    _DetailRow(
                        label: 'Budget', value: lead.budgetFormatted),
                    if (lead.source != null)
                      _DetailRow(label: 'Source', value: lead.source!),
                    if (lead.property != null)
                      _DetailRow(
                          label: 'Property', value: lead.property!.title),
                    if (lead.assignedAgent != null)
                      _DetailRow(
                          label: 'Agent', value: lead.assignedAgent!.name),
                    if (lead.nextFollowUp != null)
                      _DetailRow(
                        label: 'Next Follow-up',
                        value: DateFormat('MMM d, y').format(lead.nextFollowUp!),
                      ),
                    _DetailRow(
                      label: 'Created',
                      value: DateFormat('MMM d, y').format(lead.createdAt),
                    ),
                  ],
                ),
              ),
            ),

            if (lead.notes != null && lead.notes!.isNotEmpty) ...[
              const SizedBox(height: 12),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Notes', style: theme.textTheme.titleSmall),
                      const SizedBox(height: 8),
                      Text(lead.notes!, style: theme.textTheme.bodyMedium),
                    ],
                  ),
                ),
              ),
            ],

            const SizedBox(height: 16),

            // Activities section
            Text('Activities', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            activitiesAsync.when(
              loading: () =>
                  const Center(child: CircularProgressIndicator()),
              error: (_, __) => const Text('Failed to load activities'),
              data: (activities) => ActivityTimeline(activities: activities),
            ),

            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  void _callClient(String phone) {
    launchUrl(Uri(scheme: 'tel', path: phone));
  }

  void _onMenuAction(
      BuildContext context, WidgetRef ref, String action) async {
    switch (action) {
      case 'add_activity':
        await _showAddActivityDialog(context, ref);
        break;
      case 'change_status':
        await _showChangeStatusDialog(context, ref);
        break;
      case 'delete':
        await _confirmDelete(context, ref);
        break;
    }
  }

  Future<void> _showAddActivityDialog(
      BuildContext context, WidgetRef ref) async {
    LeadActivityType selectedType = LeadActivityType.note;
    final descController = TextEditingController();

    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Add Activity'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<LeadActivityType>(
                value: selectedType,
                decoration: const InputDecoration(labelText: 'Type'),
                items: LeadActivityType.values
                    .where((t) => t != LeadActivityType.statusChange)
                    .map((t) => DropdownMenuItem(
                        value: t, child: Text(t.label)))
                    .toList(),
                onChanged: (v) =>
                    setDialogState(() => selectedType = v!),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: descController,
                decoration: const InputDecoration(
                  labelText: 'Description',
                  hintText: 'Enter activity details...',
                ),
                maxLines: 3,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Add'),
            ),
          ],
        ),
      ),
    );

    if (result == true && descController.text.isNotEmpty && context.mounted) {
      try {
        final service = ref.read(leadsServiceProvider);
        await service.addActivity(
          leadId,
          type: selectedType.value,
          description: descController.text,
        );
        ref.invalidate(leadActivitiesProvider(leadId));
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Activity added')),
          );
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $e')),
          );
        }
      }
    }
    descController.dispose();
  }

  Future<void> _showChangeStatusDialog(
      BuildContext context, WidgetRef ref) async {
    final result = await showDialog<LeadStatus>(
      context: context,
      builder: (ctx) => SimpleDialog(
        title: const Text('Change Status'),
        children: LeadStatus.values
            .map((s) => SimpleDialogOption(
                  onPressed: () => Navigator.pop(ctx, s),
                  child: Row(
                    children: [
                      LeadStatusBadge(status: s),
                      if (s == lead.status) ...[
                        const SizedBox(width: 8),
                        const Icon(Icons.check, size: 18),
                      ],
                    ],
                  ),
                ))
            .toList(),
      ),
    );

    if (result != null && result != lead.status && context.mounted) {
      try {
        final service = ref.read(leadsServiceProvider);
        await service.changeStatus(leadId, result.value);
        ref.invalidate(leadDetailProvider(leadId));
        ref.invalidate(leadActivitiesProvider(leadId));
        ref.read(leadListProvider.notifier).loadLeads();
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Status changed to ${result.label}')),
          );
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $e')),
          );
        }
      }
    }
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Lead'),
        content: const Text(
            'Are you sure you want to delete this lead? This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      try {
        final service = ref.read(leadsServiceProvider);
        await service.deleteLead(leadId);
        ref.read(leadListProvider.notifier).loadLeads();
        if (context.mounted) {
          context.pop();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Lead deleted')),
          );
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $e')),
          );
        }
      }
    }
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;

  const _DetailRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(
              label,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          Expanded(
            child: Text(value, style: theme.textTheme.bodyMedium),
          ),
        ],
      ),
    );
  }
}
