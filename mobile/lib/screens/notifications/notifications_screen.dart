import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../providers/notification_provider.dart';
import '../../services/notification_service.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notificationState = ref.watch(notificationProvider);
    final notifier = ref.read(notificationProvider.notifier);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (notificationState.unreadCount > 0)
            TextButton(
              onPressed: () => notifier.markAllAsRead(),
              child: const Text('Mark all read'),
            ),
          PopupMenuButton<String>(
            onSelected: (value) {
              switch (value) {
                case 'clear':
                  _showClearConfirmation(context, notifier);
                case 'preferences':
                  context.push('/notifications/preferences');
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'preferences',
                child: ListTile(
                  leading: Icon(Icons.settings),
                  title: Text('Preferences'),
                  contentPadding: EdgeInsets.zero,
                ),
              ),
              const PopupMenuItem(
                value: 'clear',
                child: ListTile(
                  leading: Icon(Icons.delete_sweep),
                  title: Text('Clear all'),
                  contentPadding: EdgeInsets.zero,
                ),
              ),
            ],
          ),
        ],
      ),
      body: notificationState.isLoading
          ? const Center(child: CircularProgressIndicator())
          : notificationState.notifications.isEmpty
              ? _buildEmptyState(theme)
              : RefreshIndicator(
                  onRefresh: () => notifier.refresh(),
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    itemCount: notificationState.notifications.length,
                    itemBuilder: (context, index) {
                      final notification =
                          notificationState.notifications[index];
                      return _NotificationTile(
                        notification: notification,
                        onTap: () => _onNotificationTap(
                          context,
                          ref,
                          notification,
                        ),
                        onDismiss: () =>
                            notifier.deleteNotification(notification.id),
                      );
                    },
                  ),
                ),
    );
  }

  Widget _buildEmptyState(ThemeData theme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.notifications_none,
            size: 80,
            color: theme.colorScheme.outline,
          ),
          const SizedBox(height: 16),
          Text(
            'No notifications',
            style: theme.textTheme.titleMedium?.copyWith(
              color: theme.colorScheme.outline,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'You\'re all caught up!',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.outline,
            ),
          ),
        ],
      ),
    );
  }

  void _onNotificationTap(
    BuildContext context,
    WidgetRef ref,
    AppNotification notification,
  ) {
    final notifier = ref.read(notificationProvider.notifier);
    if (!notification.isRead) {
      notifier.markAsRead(notification.id);
    }

    // Navigate based on notification type.
    final type = notification.type;
    final refId = notification.referenceId;
    if (type == null || refId == null) return;

    switch (type) {
      case 'lead_assigned':
        context.push('/leads/$refId');
      case 'property_update':
        context.push('/properties/$refId');
      case 'deal_closed':
        context.push('/clients/$refId');
      case 'task_reminder':
        context.push('/dashboard');
      default:
        break;
    }
  }

  void _showClearConfirmation(
    BuildContext context,
    NotificationNotifier notifier,
  ) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Clear all notifications'),
        content: const Text(
          'Are you sure you want to remove all notifications? This cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              notifier.clearAll();
              Navigator.pop(ctx);
            },
            child: const Text('Clear'),
          ),
        ],
      ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  final AppNotification notification;
  final VoidCallback onTap;
  final VoidCallback onDismiss;

  const _NotificationTile({
    required this.notification,
    required this.onTap,
    required this.onDismiss,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final timeAgo = _formatTimeAgo(notification.createdAt);

    return Dismissible(
      key: Key(notification.id),
      direction: DismissDirection.endToStart,
      onDismissed: (_) => onDismiss(),
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        color: theme.colorScheme.error,
        child: Icon(Icons.delete, color: theme.colorScheme.onError),
      ),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: notification.isRead
              ? theme.colorScheme.surfaceContainerHighest
              : theme.colorScheme.primaryContainer,
          child: Icon(
            _iconForType(notification.type),
            color: notification.isRead
                ? theme.colorScheme.outline
                : theme.colorScheme.primary,
            size: 20,
          ),
        ),
        title: Text(
          notification.title,
          style: TextStyle(
            fontWeight: notification.isRead ? FontWeight.normal : FontWeight.w600,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              notification.body,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            Text(
              timeAgo,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.outline,
              ),
            ),
          ],
        ),
        trailing: notification.isRead
            ? null
            : Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  color: theme.colorScheme.primary,
                  shape: BoxShape.circle,
                ),
              ),
        onTap: onTap,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      ),
    );
  }

  IconData _iconForType(String? type) {
    return switch (type) {
      'lead_assigned' => Icons.person_add,
      'property_update' => Icons.apartment,
      'deal_closed' => Icons.handshake,
      'task_reminder' => Icons.task_alt,
      'system_alert' => Icons.info,
      _ => Icons.notifications,
    };
  }

  String _formatTimeAgo(DateTime dateTime) {
    final now = DateTime.now();
    final diff = now.difference(dateTime);

    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return DateFormat('MMM d, y').format(dateTime);
  }
}
