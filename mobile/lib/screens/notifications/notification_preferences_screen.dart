import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/notification_provider.dart';
import '../../services/notification_service.dart';

class NotificationPreferencesScreen extends ConsumerWidget {
  const NotificationPreferencesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(notificationProvider);
    final notifier = ref.read(notificationProvider.notifier);
    final prefs = state.preferences;
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notification Preferences'),
      ),
      body: ListView(
        children: [
          // Master toggle
          _SectionHeader(title: 'General', theme: theme),
          SwitchListTile(
            title: const Text('Push Notifications'),
            subtitle: const Text('Receive push notifications on this device'),
            secondary: const Icon(Icons.notifications_active),
            value: prefs.pushEnabled,
            onChanged: (value) {
              notifier.updatePreferences(
                prefs.copyWith(pushEnabled: value),
              );
            },
          ),
          const Divider(),

          // Category toggles
          _SectionHeader(title: 'Categories', theme: theme),
          SwitchListTile(
            title: const Text('Lead Assigned'),
            subtitle: const Text('When a new lead is assigned to you'),
            secondary: const Icon(Icons.person_add),
            value: prefs.leadAssigned,
            onChanged: prefs.pushEnabled
                ? (value) {
                    notifier.updatePreferences(
                      prefs.copyWith(leadAssigned: value),
                    );
                  }
                : null,
          ),
          SwitchListTile(
            title: const Text('Property Updates'),
            subtitle:
                const Text('Price changes, status updates on your listings'),
            secondary: const Icon(Icons.apartment),
            value: prefs.propertyUpdates,
            onChanged: prefs.pushEnabled
                ? (value) {
                    notifier.updatePreferences(
                      prefs.copyWith(propertyUpdates: value),
                    );
                  }
                : null,
          ),
          SwitchListTile(
            title: const Text('Deal Closed'),
            subtitle: const Text('When a deal is successfully closed'),
            secondary: const Icon(Icons.handshake),
            value: prefs.dealClosed,
            onChanged: prefs.pushEnabled
                ? (value) {
                    notifier.updatePreferences(
                      prefs.copyWith(dealClosed: value),
                    );
                  }
                : null,
          ),
          SwitchListTile(
            title: const Text('Task Reminders'),
            subtitle: const Text('Follow-up reminders and due dates'),
            secondary: const Icon(Icons.task_alt),
            value: prefs.taskReminders,
            onChanged: prefs.pushEnabled
                ? (value) {
                    notifier.updatePreferences(
                      prefs.copyWith(taskReminders: value),
                    );
                  }
                : null,
          ),
          SwitchListTile(
            title: const Text('System Alerts'),
            subtitle: const Text('Maintenance, updates, and announcements'),
            secondary: const Icon(Icons.info),
            value: prefs.systemAlerts,
            onChanged: prefs.pushEnabled
                ? (value) {
                    notifier.updatePreferences(
                      prefs.copyWith(systemAlerts: value),
                    );
                  }
                : null,
          ),
          const Divider(),

          // Info
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text(
              'Disabled categories will not trigger push notifications or '
              'appear in your notification center. You can always re-enable '
              'them later.',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.outline,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final ThemeData theme;

  const _SectionHeader({required this.title, required this.theme});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Text(
        title,
        style: theme.textTheme.titleSmall?.copyWith(
          color: theme.colorScheme.primary,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
