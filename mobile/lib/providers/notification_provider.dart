import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/notification_service.dart';

/// State for the notification center.
class NotificationState {
  final List<AppNotification> notifications;
  final bool isLoading;
  final String? error;
  final NotificationPreferences preferences;

  const NotificationState({
    this.notifications = const [],
    this.isLoading = false,
    this.error,
    this.preferences = const NotificationPreferences(),
  });

  int get unreadCount => notifications.where((n) => !n.isRead).length;

  NotificationState copyWith({
    List<AppNotification>? notifications,
    bool? isLoading,
    String? Function()? error,
    NotificationPreferences? preferences,
  }) {
    return NotificationState(
      notifications: notifications ?? this.notifications,
      isLoading: isLoading ?? this.isLoading,
      error: error != null ? error() : this.error,
      preferences: preferences ?? this.preferences,
    );
  }
}

class NotificationNotifier extends StateNotifier<NotificationState> {
  final NotificationService _service;
  StreamSubscription<List<AppNotification>>? _subscription;

  NotificationNotifier(this._service) : super(const NotificationState()) {
    _init();
  }

  Future<void> _init() async {
    state = state.copyWith(isLoading: true);
    try {
      final notifications = await _service.loadNotifications();
      final preferences = await _service.loadPreferences();
      state = NotificationState(
        notifications: notifications,
        preferences: preferences,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: () => e.toString(),
      );
    }

    // Listen for real-time updates from FCM.
    _subscription = _service.notificationsStream.listen((notifications) {
      state = state.copyWith(notifications: notifications);
    });
  }

  Future<void> refresh() async {
    state = state.copyWith(isLoading: true, error: () => null);
    try {
      final notifications = await _service.loadNotifications();
      state = state.copyWith(
        notifications: notifications,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: () => e.toString(),
      );
    }
  }

  Future<void> markAsRead(String id) async {
    await _service.markAsRead(id);
  }

  Future<void> markAllAsRead() async {
    await _service.markAllAsRead();
  }

  Future<void> deleteNotification(String id) async {
    await _service.deleteNotification(id);
  }

  Future<void> clearAll() async {
    await _service.clearAll();
  }

  Future<void> updatePreferences(NotificationPreferences preferences) async {
    await _service.savePreferences(preferences);
    state = state.copyWith(preferences: preferences);
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}

final notificationProvider =
    StateNotifierProvider<NotificationNotifier, NotificationState>((ref) {
  final service = ref.watch(notificationServiceProvider);
  return NotificationNotifier(service);
});

/// Convenience provider for the unread badge count.
final unreadNotificationCountProvider = Provider<int>((ref) {
  return ref.watch(notificationProvider).unreadCount;
});
