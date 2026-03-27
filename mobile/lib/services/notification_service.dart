import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../config/firebase_options.dart' as config;

/// Top-level handler for background FCM messages.
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  await NotificationService.instance._handleBackgroundMessage(message);
}

/// Represents a single in-app notification.
class AppNotification {
  final String id;
  final String title;
  final String body;
  final String? type; // lead_assigned, property_update, deal_closed, etc.
  final String? referenceId;
  final DateTime createdAt;
  final bool isRead;

  const AppNotification({
    required this.id,
    required this.title,
    required this.body,
    this.type,
    this.referenceId,
    required this.createdAt,
    this.isRead = false,
  });

  AppNotification copyWith({bool? isRead}) {
    return AppNotification(
      id: id,
      title: title,
      body: body,
      type: type,
      referenceId: referenceId,
      createdAt: createdAt,
      isRead: isRead ?? this.isRead,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'body': body,
        'type': type,
        'referenceId': referenceId,
        'createdAt': createdAt.toIso8601String(),
        'isRead': isRead,
      };

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'] as String,
      title: json['title'] as String,
      body: json['body'] as String,
      type: json['type'] as String?,
      referenceId: json['referenceId'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      isRead: json['isRead'] as bool? ?? false,
    );
  }
}

/// User preferences for which notification categories are enabled.
class NotificationPreferences {
  final bool leadAssigned;
  final bool propertyUpdates;
  final bool dealClosed;
  final bool taskReminders;
  final bool systemAlerts;
  final bool pushEnabled;

  const NotificationPreferences({
    this.leadAssigned = true,
    this.propertyUpdates = true,
    this.dealClosed = true,
    this.taskReminders = true,
    this.systemAlerts = true,
    this.pushEnabled = true,
  });

  NotificationPreferences copyWith({
    bool? leadAssigned,
    bool? propertyUpdates,
    bool? dealClosed,
    bool? taskReminders,
    bool? systemAlerts,
    bool? pushEnabled,
  }) {
    return NotificationPreferences(
      leadAssigned: leadAssigned ?? this.leadAssigned,
      propertyUpdates: propertyUpdates ?? this.propertyUpdates,
      dealClosed: dealClosed ?? this.dealClosed,
      taskReminders: taskReminders ?? this.taskReminders,
      systemAlerts: systemAlerts ?? this.systemAlerts,
      pushEnabled: pushEnabled ?? this.pushEnabled,
    );
  }

  Map<String, dynamic> toJson() => {
        'leadAssigned': leadAssigned,
        'propertyUpdates': propertyUpdates,
        'dealClosed': dealClosed,
        'taskReminders': taskReminders,
        'systemAlerts': systemAlerts,
        'pushEnabled': pushEnabled,
      };

  factory NotificationPreferences.fromJson(Map<String, dynamic> json) {
    return NotificationPreferences(
      leadAssigned: json['leadAssigned'] as bool? ?? true,
      propertyUpdates: json['propertyUpdates'] as bool? ?? true,
      dealClosed: json['dealClosed'] as bool? ?? true,
      taskReminders: json['taskReminders'] as bool? ?? true,
      systemAlerts: json['systemAlerts'] as bool? ?? true,
      pushEnabled: json['pushEnabled'] as bool? ?? true,
    );
  }
}

class NotificationService {
  NotificationService._();
  static final NotificationService instance = NotificationService._();

  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  static const String _prefsNotificationsKey = 'app_notifications';
  static const String _prefsPreferencesKey = 'notification_preferences';

  /// Android notification channel for high-importance CRM alerts.
  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'crm_high_importance',
    'CRM Notifications',
    description: 'Notifications for leads, deals, and property updates',
    importance: Importance.high,
  );

  /// Stream controller that emits whenever the notification list changes.
  final StreamController<List<AppNotification>> _notificationsController =
      StreamController<List<AppNotification>>.broadcast();

  Stream<List<AppNotification>> get notificationsStream =>
      _notificationsController.stream;

  /// Stream for foreground message taps (navigation payloads).
  final StreamController<Map<String, dynamic>> _navigationController =
      StreamController<Map<String, dynamic>>.broadcast();

  Stream<Map<String, dynamic>> get navigationStream =>
      _navigationController.stream;

  /// Initialise FCM, local notifications, and register handlers.
  Future<void> initialize() async {
    // Register background handler before anything else.
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Request permission (iOS / Android 13+).
    final settings = await _fcm.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    if (settings.authorizationStatus == AuthorizationStatus.denied) {
      debugPrint('NotificationService: user denied notification permission');
      return;
    }

    // Create Android notification channel.
    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(_channel);

    // Init local notifications plugin.
    const androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );

    await _localNotifications.initialize(
      const InitializationSettings(
        android: androidSettings,
        iOS: iosSettings,
      ),
      onDidReceiveNotificationResponse: _onLocalNotificationTapped,
    );

    // Listen to foreground messages.
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Handle notification taps that open the app from background.
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

    // Check if app was opened from a terminated-state notification.
    final initialMessage = await _fcm.getInitialMessage();
    if (initialMessage != null) {
      _handleNotificationTap(initialMessage);
    }

    // Log FCM token for server registration.
    final token = await _fcm.getToken();
    debugPrint('NotificationService: FCM token = $token');

    // Listen for token refresh.
    _fcm.onTokenRefresh.listen((newToken) {
      debugPrint('NotificationService: FCM token refreshed = $newToken');
      // TODO: send newToken to backend API
    });
  }

  /// Get the current FCM device token for server-side registration.
  Future<String?> getDeviceToken() => _fcm.getToken();

  // ---------------------------------------------------------------------------
  // Message handlers
  // ---------------------------------------------------------------------------

  Future<void> _handleForegroundMessage(RemoteMessage message) async {
    final notification = message.notification;
    if (notification == null) return;

    final prefs = await loadPreferences();
    if (!prefs.pushEnabled) return;
    if (!_shouldShow(message.data['type'] as String?, prefs)) return;

    // Show a local notification so the user sees it while in-app.
    await _localNotifications.show(
      notification.hashCode,
      notification.title,
      notification.body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          _channel.id,
          _channel.name,
          channelDescription: _channel.description,
          importance: Importance.high,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
        ),
        iOS: const DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: true,
          presentSound: true,
        ),
      ),
      payload: jsonEncode(message.data),
    );

    // Persist to the in-app notification list.
    await _persistNotification(
      AppNotification(
        id: message.messageId ?? DateTime.now().millisecondsSinceEpoch.toString(),
        title: notification.title ?? '',
        body: notification.body ?? '',
        type: message.data['type'] as String?,
        referenceId: message.data['referenceId'] as String?,
        createdAt: DateTime.now(),
      ),
    );
  }

  Future<void> _handleBackgroundMessage(RemoteMessage message) async {
    final notification = message.notification;
    if (notification == null) return;

    await _persistNotification(
      AppNotification(
        id: message.messageId ?? DateTime.now().millisecondsSinceEpoch.toString(),
        title: notification.title ?? '',
        body: notification.body ?? '',
        type: message.data['type'] as String?,
        referenceId: message.data['referenceId'] as String?,
        createdAt: DateTime.now(),
      ),
    );
  }

  void _handleNotificationTap(RemoteMessage message) {
    _navigationController.add(message.data.cast<String, dynamic>());
  }

  void _onLocalNotificationTapped(NotificationResponse response) {
    if (response.payload == null) return;
    try {
      final data = jsonDecode(response.payload!) as Map<String, dynamic>;
      _navigationController.add(data);
    } catch (_) {}
  }

  bool _shouldShow(String? type, NotificationPreferences prefs) {
    if (type == null) return true;
    return switch (type) {
      'lead_assigned' => prefs.leadAssigned,
      'property_update' => prefs.propertyUpdates,
      'deal_closed' => prefs.dealClosed,
      'task_reminder' => prefs.taskReminders,
      'system_alert' => prefs.systemAlerts,
      _ => true,
    };
  }

  // ---------------------------------------------------------------------------
  // Persistence — stored as JSON list in shared_preferences
  // ---------------------------------------------------------------------------

  Future<void> _persistNotification(AppNotification notification) async {
    final all = await loadNotifications();
    all.insert(0, notification);
    // Keep only the most recent 100.
    final trimmed = all.length > 100 ? all.sublist(0, 100) : all;
    final prefs = await SharedPreferences.getInstance();
    final encoded = trimmed.map((n) => jsonEncode(n.toJson())).toList();
    await prefs.setStringList(_prefsNotificationsKey, encoded);
    _notificationsController.add(trimmed);
  }

  Future<List<AppNotification>> loadNotifications() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getStringList(_prefsNotificationsKey) ?? [];
    return raw.map((s) {
      final json = jsonDecode(s) as Map<String, dynamic>;
      return AppNotification.fromJson(json);
    }).toList();
  }

  Future<void> markAsRead(String notificationId) async {
    final all = await loadNotifications();
    final updated = all.map((n) {
      if (n.id == notificationId) return n.copyWith(isRead: true);
      return n;
    }).toList();

    final prefs = await SharedPreferences.getInstance();
    final encoded = updated.map((n) => jsonEncode(n.toJson())).toList();
    await prefs.setStringList(_prefsNotificationsKey, encoded);
    _notificationsController.add(updated);
  }

  Future<void> markAllAsRead() async {
    final all = await loadNotifications();
    final updated = all.map((n) => n.copyWith(isRead: true)).toList();

    final prefs = await SharedPreferences.getInstance();
    final encoded = updated.map((n) => jsonEncode(n.toJson())).toList();
    await prefs.setStringList(_prefsNotificationsKey, encoded);
    _notificationsController.add(updated);
  }

  Future<void> deleteNotification(String notificationId) async {
    final all = await loadNotifications();
    all.removeWhere((n) => n.id == notificationId);

    final prefs = await SharedPreferences.getInstance();
    final encoded = all.map((n) => jsonEncode(n.toJson())).toList();
    await prefs.setStringList(_prefsNotificationsKey, encoded);
    _notificationsController.add(all);
  }

  Future<void> clearAll() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_prefsNotificationsKey);
    _notificationsController.add([]);
  }

  int unreadCount(List<AppNotification> notifications) {
    return notifications.where((n) => !n.isRead).length;
  }

  // ---------------------------------------------------------------------------
  // Preferences
  // ---------------------------------------------------------------------------

  Future<NotificationPreferences> loadPreferences() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_prefsPreferencesKey);
    if (raw == null) return const NotificationPreferences();
    return NotificationPreferences.fromJson(
      jsonDecode(raw) as Map<String, dynamic>,
    );
  }

  Future<void> savePreferences(NotificationPreferences preferences) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      _prefsPreferencesKey,
      jsonEncode(preferences.toJson()),
    );
  }

  // ---------------------------------------------------------------------------
  // Topic subscription helpers (for server-side topic-based push)
  // ---------------------------------------------------------------------------

  Future<void> subscribeToTopic(String topic) =>
      _fcm.subscribeToTopic(topic);

  Future<void> unsubscribeFromTopic(String topic) =>
      _fcm.unsubscribeFromTopic(topic);

  void dispose() {
    _notificationsController.close();
    _navigationController.close();
  }
}

final notificationServiceProvider = Provider<NotificationService>((ref) {
  return NotificationService.instance;
});
