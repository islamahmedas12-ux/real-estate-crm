import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../models/lead.dart';
import '../../providers/lead_provider.dart';
import '../../services/leads_service.dart';

class LeadFormScreen extends ConsumerStatefulWidget {
  final String? leadId;

  const LeadFormScreen({super.key, this.leadId});

  bool get isEditing => leadId != null;

  @override
  ConsumerState<LeadFormScreen> createState() => _LeadFormScreenState();
}

class _LeadFormScreenState extends ConsumerState<LeadFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _clientIdController = TextEditingController();
  final _propertyIdController = TextEditingController();
  final _sourceController = TextEditingController();
  final _budgetController = TextEditingController();
  final _notesController = TextEditingController();

  LeadStatus _status = LeadStatus.newLead;
  LeadPriority _priority = LeadPriority.medium;
  DateTime? _nextFollowUp;
  bool _isSubmitting = false;
  bool _loaded = false;

  @override
  void dispose() {
    _clientIdController.dispose();
    _propertyIdController.dispose();
    _sourceController.dispose();
    _budgetController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _populateFromLead(Lead lead) {
    if (_loaded) return;
    _loaded = true;
    _clientIdController.text = lead.clientId;
    _propertyIdController.text = lead.propertyId ?? '';
    _sourceController.text = lead.source ?? '';
    _budgetController.text =
        lead.budget != null ? lead.budget!.toStringAsFixed(0) : '';
    _notesController.text = lead.notes ?? '';
    _status = lead.status;
    _priority = lead.priority;
    _nextFollowUp = lead.nextFollowUp;
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    final data = <String, dynamic>{
      'clientId': _clientIdController.text.trim(),
      'status': _status.value,
      'priority': _priority.value,
    };

    final propId = _propertyIdController.text.trim();
    if (propId.isNotEmpty) data['propertyId'] = propId;

    final source = _sourceController.text.trim();
    if (source.isNotEmpty) data['source'] = source;

    final budget = double.tryParse(_budgetController.text.trim());
    if (budget != null) data['budget'] = budget;

    final notes = _notesController.text.trim();
    if (notes.isNotEmpty) data['notes'] = notes;

    if (_nextFollowUp != null) {
      data['nextFollowUp'] = _nextFollowUp!.toIso8601String();
    }

    try {
      final service = ref.read(leadsServiceProvider);

      if (widget.isEditing) {
        await service.updateLead(widget.leadId!, data);
      } else {
        await service.createLead(data);
      }

      ref.read(leadListProvider.notifier).loadLeads();

      if (mounted) {
        context.pop(true);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
                widget.isEditing ? 'Lead updated' : 'Lead created'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Future<void> _pickFollowUpDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _nextFollowUp ?? DateTime.now().add(const Duration(days: 1)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (date != null) {
      setState(() => _nextFollowUp = date);
    }
  }

  @override
  Widget build(BuildContext context) {
    // If editing, load existing lead data
    if (widget.isEditing) {
      final leadAsync = ref.watch(leadDetailProvider(widget.leadId!));
      return leadAsync.when(
        loading: () => Scaffold(
          appBar: AppBar(title: const Text('Edit Lead')),
          body: const Center(child: CircularProgressIndicator()),
        ),
        error: (e, _) => Scaffold(
          appBar: AppBar(title: const Text('Edit Lead')),
          body: Center(child: Text('Error: $e')),
        ),
        data: (lead) {
          _populateFromLead(lead);
          return _buildForm(context);
        },
      );
    }

    return _buildForm(context);
  }

  Widget _buildForm(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.isEditing ? 'Edit Lead' : 'New Lead'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Client ID
            TextFormField(
              controller: _clientIdController,
              decoration: const InputDecoration(
                labelText: 'Client ID *',
                hintText: 'Enter client ID',
                prefixIcon: Icon(Icons.person),
              ),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'Required' : null,
            ),
            const SizedBox(height: 16),

            // Property ID (optional)
            TextFormField(
              controller: _propertyIdController,
              decoration: const InputDecoration(
                labelText: 'Property ID',
                hintText: 'Enter property ID (optional)',
                prefixIcon: Icon(Icons.apartment),
              ),
            ),
            const SizedBox(height: 16),

            // Status
            DropdownButtonFormField<LeadStatus>(
              value: _status,
              decoration: const InputDecoration(
                labelText: 'Status',
                prefixIcon: Icon(Icons.flag),
              ),
              items: LeadStatus.values
                  .map((s) =>
                      DropdownMenuItem(value: s, child: Text(s.label)))
                  .toList(),
              onChanged: (v) => setState(() => _status = v!),
            ),
            const SizedBox(height: 16),

            // Priority
            DropdownButtonFormField<LeadPriority>(
              value: _priority,
              decoration: const InputDecoration(
                labelText: 'Priority',
                prefixIcon: Icon(Icons.priority_high),
              ),
              items: LeadPriority.values
                  .map((p) =>
                      DropdownMenuItem(value: p, child: Text(p.label)))
                  .toList(),
              onChanged: (v) => setState(() => _priority = v!),
            ),
            const SizedBox(height: 16),

            // Source
            TextFormField(
              controller: _sourceController,
              decoration: const InputDecoration(
                labelText: 'Source',
                hintText: 'e.g. Website, Referral',
                prefixIcon: Icon(Icons.source),
              ),
            ),
            const SizedBox(height: 16),

            // Budget
            TextFormField(
              controller: _budgetController,
              decoration: const InputDecoration(
                labelText: 'Budget (EGP)',
                hintText: 'Enter budget amount',
                prefixIcon: Icon(Icons.attach_money),
              ),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 16),

            // Next follow-up
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.calendar_today),
              title: Text(_nextFollowUp != null
                  ? 'Follow-up: ${_nextFollowUp!.day}/${_nextFollowUp!.month}/${_nextFollowUp!.year}'
                  : 'Set follow-up date'),
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (_nextFollowUp != null)
                    IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () =>
                          setState(() => _nextFollowUp = null),
                    ),
                  IconButton(
                    icon: const Icon(Icons.edit_calendar),
                    onPressed: _pickFollowUpDate,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Notes
            TextFormField(
              controller: _notesController,
              decoration: const InputDecoration(
                labelText: 'Notes',
                hintText: 'Add notes about this lead...',
                prefixIcon: Icon(Icons.note),
                alignLabelWithHint: true,
              ),
              maxLines: 4,
            ),
            const SizedBox(height: 24),

            // Submit
            FilledButton.icon(
              onPressed: _isSubmitting ? null : _submit,
              icon: _isSubmitting
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Icon(widget.isEditing ? Icons.save : Icons.add),
              label: Text(widget.isEditing ? 'Save Changes' : 'Create Lead'),
            ),

            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}
