import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../models/client.dart';
import '../../providers/client_provider.dart';
import '../../services/clients_service.dart';

class ClientFormScreen extends ConsumerStatefulWidget {
  final String? clientId;

  const ClientFormScreen({super.key, this.clientId});

  bool get isEditing => clientId != null;

  @override
  ConsumerState<ClientFormScreen> createState() => _ClientFormScreenState();
}

class _ClientFormScreenState extends ConsumerState<ClientFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _nationalIdController = TextEditingController();
  final _notesController = TextEditingController();

  ClientType _type = ClientType.buyer;
  ClientSource _source = ClientSource.other;
  bool _isSubmitting = false;
  bool _loaded = false;

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _nationalIdController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _populateFromClient(Client client) {
    if (_loaded) return;
    _loaded = true;
    _firstNameController.text = client.firstName;
    _lastNameController.text = client.lastName;
    _emailController.text = client.email ?? '';
    _phoneController.text = client.phone;
    _nationalIdController.text = client.nationalId ?? '';
    _notesController.text = client.notes ?? '';
    _type = client.type;
    _source = client.source;
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    final data = <String, dynamic>{
      'firstName': _firstNameController.text.trim(),
      'lastName': _lastNameController.text.trim(),
      'phone': _phoneController.text.trim(),
      'type': _type.value,
      'source': _source.value,
    };

    final email = _emailController.text.trim();
    if (email.isNotEmpty) data['email'] = email;

    final nationalId = _nationalIdController.text.trim();
    if (nationalId.isNotEmpty) data['nationalId'] = nationalId;

    final notes = _notesController.text.trim();
    if (notes.isNotEmpty) data['notes'] = notes;

    try {
      final service = ref.read(clientsServiceProvider);

      if (widget.isEditing) {
        await service.updateClient(widget.clientId!, data);
      } else {
        await service.createClient(data);
      }

      ref.read(clientListProvider.notifier).loadClients();

      if (mounted) {
        context.pop(true);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
                widget.isEditing ? 'Client updated' : 'Client created'),
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

  @override
  Widget build(BuildContext context) {
    if (widget.isEditing) {
      final detailAsync = ref.watch(clientDetailProvider(widget.clientId!));
      return detailAsync.when(
        loading: () => Scaffold(
          appBar: AppBar(title: const Text('Edit Client')),
          body: const Center(child: CircularProgressIndicator()),
        ),
        error: (e, _) => Scaffold(
          appBar: AppBar(title: const Text('Edit Client')),
          body: Center(child: Text('Error: $e')),
        ),
        data: (detail) {
          _populateFromClient(detail.client);
          return _buildForm(context);
        },
      );
    }

    return _buildForm(context);
  }

  Widget _buildForm(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.isEditing ? 'Edit Client' : 'New Client'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // First name
            TextFormField(
              controller: _firstNameController,
              decoration: const InputDecoration(
                labelText: 'First Name *',
                prefixIcon: Icon(Icons.person),
              ),
              textCapitalization: TextCapitalization.words,
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'Required' : null,
            ),
            const SizedBox(height: 16),

            // Last name
            TextFormField(
              controller: _lastNameController,
              decoration: const InputDecoration(
                labelText: 'Last Name *',
                prefixIcon: Icon(Icons.person_outline),
              ),
              textCapitalization: TextCapitalization.words,
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'Required' : null,
            ),
            const SizedBox(height: 16),

            // Phone
            TextFormField(
              controller: _phoneController,
              decoration: const InputDecoration(
                labelText: 'Phone *',
                hintText: '+20xxxxxxxxxx',
                prefixIcon: Icon(Icons.phone),
              ),
              keyboardType: TextInputType.phone,
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'Required' : null,
            ),
            const SizedBox(height: 16),

            // Email
            TextFormField(
              controller: _emailController,
              decoration: const InputDecoration(
                labelText: 'Email',
                prefixIcon: Icon(Icons.email),
              ),
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 16),

            // National ID
            TextFormField(
              controller: _nationalIdController,
              decoration: const InputDecoration(
                labelText: 'National ID',
                prefixIcon: Icon(Icons.badge),
              ),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 16),

            // Type
            DropdownButtonFormField<ClientType>(
              value: _type,
              decoration: const InputDecoration(
                labelText: 'Client Type',
                prefixIcon: Icon(Icons.category),
              ),
              items: ClientType.values
                  .map((t) =>
                      DropdownMenuItem(value: t, child: Text(t.label)))
                  .toList(),
              onChanged: (v) => setState(() => _type = v!),
            ),
            const SizedBox(height: 16),

            // Source
            DropdownButtonFormField<ClientSource>(
              value: _source,
              decoration: const InputDecoration(
                labelText: 'Source',
                prefixIcon: Icon(Icons.source),
              ),
              items: ClientSource.values
                  .map((s) =>
                      DropdownMenuItem(value: s, child: Text(s.label)))
                  .toList(),
              onChanged: (v) => setState(() => _source = v!),
            ),
            const SizedBox(height: 16),

            // Notes
            TextFormField(
              controller: _notesController,
              decoration: const InputDecoration(
                labelText: 'Notes',
                hintText: 'Add notes about this client...',
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
                  : Icon(widget.isEditing ? Icons.save : Icons.person_add),
              label:
                  Text(widget.isEditing ? 'Save Changes' : 'Create Client'),
            ),

            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}
