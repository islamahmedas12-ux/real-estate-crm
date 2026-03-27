import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../models/client.dart';
import '../../providers/client_provider.dart';
import '../../services/clients_service.dart';

class ClientDetailScreen extends ConsumerWidget {
  final String clientId;

  const ClientDetailScreen({super.key, required this.clientId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detailAsync = ref.watch(clientDetailProvider(clientId));

    return detailAsync.when(
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
              const Text('Failed to load client'),
              const SizedBox(height: 8),
              FilledButton.tonal(
                onPressed: () =>
                    ref.invalidate(clientDetailProvider(clientId)),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
      data: (detail) =>
          _ClientDetailView(detail: detail, clientId: clientId),
    );
  }
}

class _ClientDetailView extends ConsumerWidget {
  final ClientDetail detail;
  final String clientId;

  const _ClientDetailView({required this.detail, required this.clientId});

  Client get client => detail.client;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Client Details'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () async {
              final result = await context.push('/clients/$clientId/edit');
              if (result == true) {
                ref.invalidate(clientDetailProvider(clientId));
              }
            },
          ),
          IconButton(
            icon: const Icon(Icons.delete, color: Colors.red),
            onPressed: () => _confirmDelete(context, ref),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 30,
                      child: Text(
                        client.firstName.isNotEmpty
                            ? client.firstName[0].toUpperCase()
                            : '?',
                        style: const TextStyle(
                            fontSize: 24, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            client.fullName,
                            style: theme.textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          _ClientTypeBadge(type: client.type),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 12),

            // Contact actions
            Card(
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.phone),
                    title: Text(client.phone),
                    subtitle: const Text('Phone'),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.phone, color: Colors.green),
                          onPressed: () =>
                              launchUrl(Uri(scheme: 'tel', path: client.phone)),
                        ),
                        IconButton(
                          icon: const Icon(Icons.message, color: Colors.blue),
                          onPressed: () =>
                              launchUrl(Uri(scheme: 'sms', path: client.phone)),
                        ),
                      ],
                    ),
                  ),
                  if (client.email != null && client.email!.isNotEmpty)
                    ListTile(
                      leading: const Icon(Icons.email),
                      title: Text(client.email!),
                      subtitle: const Text('Email'),
                      trailing: IconButton(
                        icon: const Icon(Icons.email, color: Colors.orange),
                        onPressed: () => launchUrl(
                            Uri(scheme: 'mailto', path: client.email)),
                      ),
                    ),
                ],
              ),
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
                    _DetailRow(label: 'Type', value: client.type.label),
                    _DetailRow(label: 'Source', value: client.source.label),
                    if (client.nationalId != null &&
                        client.nationalId!.isNotEmpty)
                      _DetailRow(
                          label: 'National ID', value: client.nationalId!),
                    if (client.assignedAgent != null)
                      _DetailRow(
                          label: 'Agent', value: client.assignedAgent!.name),
                    _DetailRow(
                      label: 'Created',
                      value:
                          DateFormat('MMM d, y').format(client.createdAt),
                    ),
                  ],
                ),
              ),
            ),

            if (client.notes != null && client.notes!.isNotEmpty) ...[
              const SizedBox(height: 12),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Notes', style: theme.textTheme.titleSmall),
                      const SizedBox(height: 8),
                      Text(client.notes!,
                          style: theme.textTheme.bodyMedium),
                    ],
                  ),
                ),
              ),
            ],

            // Leads section
            if (detail.leads.isNotEmpty) ...[
              const SizedBox(height: 16),
              Text('Leads (${detail.leads.length})',
                  style: theme.textTheme.titleMedium),
              const SizedBox(height: 8),
              ...detail.leads.map(
                (lead) => Card(
                  child: ListTile(
                    leading: CircleAvatar(
                      radius: 16,
                      backgroundColor:
                          _statusColor(lead.status).withValues(alpha: 0.15),
                      child: Icon(Icons.person_search,
                          size: 16, color: _statusColor(lead.status)),
                    ),
                    title: Text(lead.propertyTitle ?? 'No property'),
                    subtitle: Text(
                      '${lead.status} - ${lead.priority}  |  ${DateFormat('MMM d').format(lead.createdAt)}',
                    ),
                    onTap: () => context.push('/leads/${lead.id}'),
                    trailing: const Icon(Icons.chevron_right),
                  ),
                ),
              ),
            ],

            // Contracts section
            if (detail.contracts.isNotEmpty) ...[
              const SizedBox(height: 16),
              Text('Contracts (${detail.contracts.length})',
                  style: theme.textTheme.titleMedium),
              const SizedBox(height: 8),
              ...detail.contracts.map(
                (contract) => Card(
                  child: ListTile(
                    leading: const CircleAvatar(
                      radius: 16,
                      child: Icon(Icons.description, size: 16),
                    ),
                    title: Text(
                        contract.propertyTitle ?? contract.type),
                    subtitle: Text(
                      '${contract.status}  |  ${_formatAmount(contract.totalAmount)}',
                    ),
                  ),
                ),
              ),
            ],

            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'NEW':
        return Colors.blue;
      case 'CONTACTED':
        return Colors.cyan;
      case 'QUALIFIED':
        return Colors.teal;
      case 'PROPOSAL':
        return Colors.orange;
      case 'NEGOTIATION':
        return Colors.deepOrange;
      case 'WON':
        return Colors.green;
      case 'LOST':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _formatAmount(double amount) {
    if (amount >= 1000000) {
      return '${(amount / 1000000).toStringAsFixed(1)}M EGP';
    }
    if (amount >= 1000) {
      return '${(amount / 1000).toStringAsFixed(1)}K EGP';
    }
    return '${amount.toStringAsFixed(0)} EGP';
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Client'),
        content: const Text(
            'Are you sure you want to delete this client? This action cannot be undone.'),
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
        final service = ref.read(clientsServiceProvider);
        await service.deleteClient(clientId);
        ref.read(clientListProvider.notifier).loadClients();
        if (context.mounted) {
          context.pop();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Client deleted')),
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

class _ClientTypeBadge extends StatelessWidget {
  final ClientType type;

  const _ClientTypeBadge({required this.type});

  Color get _color {
    switch (type) {
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
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(
        color: _color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _color.withValues(alpha: 0.4)),
      ),
      child: Text(
        type.label,
        style: TextStyle(
          color: _color,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
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
