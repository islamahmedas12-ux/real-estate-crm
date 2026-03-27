import 'dart:async';
import 'dart:convert';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';

/// Manages offline data caching and connectivity monitoring.
///
/// Uses Hive for fast local key-value storage and connectivity_plus to detect
/// network availability changes.
class OfflineService {
  OfflineService._();
  static final OfflineService instance = OfflineService._();

  static const String _propertiesBox = 'cached_properties';
  static const String _clientsBox = 'cached_clients';
  static const String _leadsBox = 'cached_leads';
  static const String _metadataBox = 'cache_metadata';
  static const String _pendingActionsBox = 'pending_actions';

  final Connectivity _connectivity = Connectivity();

  late Box<String> _propertiesStore;
  late Box<String> _clientsStore;
  late Box<String> _leadsStore;
  late Box<String> _metadataStore;
  late Box<String> _pendingActionsStore;

  final StreamController<bool> _connectivityController =
      StreamController<bool>.broadcast();

  /// Emits `true` when the device is online, `false` when offline.
  Stream<bool> get connectivityStream => _connectivityController.stream;

  bool _isOnline = true;
  bool get isOnline => _isOnline;

  /// Initialize Hive boxes and start listening for connectivity changes.
  Future<void> initialize() async {
    await Hive.initFlutter();

    _propertiesStore = await Hive.openBox<String>(_propertiesBox);
    _clientsStore = await Hive.openBox<String>(_clientsBox);
    _leadsStore = await Hive.openBox<String>(_leadsBox);
    _metadataStore = await Hive.openBox<String>(_metadataBox);
    _pendingActionsStore = await Hive.openBox<String>(_pendingActionsBox);

    // Determine initial connectivity state.
    final result = await _connectivity.checkConnectivity();
    _isOnline = _isConnected(result);
    _connectivityController.add(_isOnline);

    // Listen for changes.
    _connectivity.onConnectivityChanged.listen((result) {
      final connected = _isConnected(result);
      if (connected != _isOnline) {
        _isOnline = connected;
        _connectivityController.add(_isOnline);
        debugPrint('OfflineService: connectivity changed — online=$_isOnline');

        if (_isOnline) {
          _syncPendingActions();
        }
      }
    });
  }

  bool _isConnected(List<ConnectivityResult> results) {
    return results.any((r) =>
        r == ConnectivityResult.wifi ||
        r == ConnectivityResult.mobile ||
        r == ConnectivityResult.ethernet);
  }

  // ---------------------------------------------------------------------------
  // Properties cache
  // ---------------------------------------------------------------------------

  Future<void> cacheProperties(List<Map<String, dynamic>> properties) async {
    await _propertiesStore.clear();
    for (final property in properties) {
      final id = property['id']?.toString() ?? '';
      if (id.isNotEmpty) {
        await _propertiesStore.put(id, jsonEncode(property));
      }
    }
    await _setLastSync('properties');
    debugPrint('OfflineService: cached ${properties.length} properties');
  }

  Future<void> cacheProperty(String id, Map<String, dynamic> property) async {
    await _propertiesStore.put(id, jsonEncode(property));
  }

  List<Map<String, dynamic>> getCachedProperties() {
    return _propertiesStore.values.map((raw) {
      return jsonDecode(raw) as Map<String, dynamic>;
    }).toList();
  }

  Map<String, dynamic>? getCachedProperty(String id) {
    final raw = _propertiesStore.get(id);
    if (raw == null) return null;
    return jsonDecode(raw) as Map<String, dynamic>;
  }

  // ---------------------------------------------------------------------------
  // Clients cache
  // ---------------------------------------------------------------------------

  Future<void> cacheClients(List<Map<String, dynamic>> clients) async {
    await _clientsStore.clear();
    for (final client in clients) {
      final id = client['id']?.toString() ?? '';
      if (id.isNotEmpty) {
        await _clientsStore.put(id, jsonEncode(client));
      }
    }
    await _setLastSync('clients');
    debugPrint('OfflineService: cached ${clients.length} clients');
  }

  Future<void> cacheClient(String id, Map<String, dynamic> client) async {
    await _clientsStore.put(id, jsonEncode(client));
  }

  List<Map<String, dynamic>> getCachedClients() {
    return _clientsStore.values.map((raw) {
      return jsonDecode(raw) as Map<String, dynamic>;
    }).toList();
  }

  Map<String, dynamic>? getCachedClient(String id) {
    final raw = _clientsStore.get(id);
    if (raw == null) return null;
    return jsonDecode(raw) as Map<String, dynamic>;
  }

  // ---------------------------------------------------------------------------
  // Leads cache
  // ---------------------------------------------------------------------------

  Future<void> cacheLeads(List<Map<String, dynamic>> leads) async {
    await _leadsStore.clear();
    for (final lead in leads) {
      final id = lead['id']?.toString() ?? '';
      if (id.isNotEmpty) {
        await _leadsStore.put(id, jsonEncode(lead));
      }
    }
    await _setLastSync('leads');
    debugPrint('OfflineService: cached ${leads.length} leads');
  }

  Future<void> cacheLead(String id, Map<String, dynamic> lead) async {
    await _leadsStore.put(id, jsonEncode(lead));
  }

  List<Map<String, dynamic>> getCachedLeads() {
    return _leadsStore.values.map((raw) {
      return jsonDecode(raw) as Map<String, dynamic>;
    }).toList();
  }

  Map<String, dynamic>? getCachedLead(String id) {
    final raw = _leadsStore.get(id);
    if (raw == null) return null;
    return jsonDecode(raw) as Map<String, dynamic>;
  }

  // ---------------------------------------------------------------------------
  // Pending offline actions (queued mutations to sync when back online)
  // ---------------------------------------------------------------------------

  /// Queue an action to be synced when connectivity is restored.
  ///
  /// [action] should include `method`, `endpoint`, and `body` keys.
  Future<void> queueAction(Map<String, dynamic> action) async {
    final key = DateTime.now().millisecondsSinceEpoch.toString();
    action['queuedAt'] = key;
    await _pendingActionsStore.put(key, jsonEncode(action));
    debugPrint('OfflineService: queued offline action — ${action['endpoint']}');
  }

  List<Map<String, dynamic>> getPendingActions() {
    return _pendingActionsStore.values.map((raw) {
      return jsonDecode(raw) as Map<String, dynamic>;
    }).toList();
  }

  Future<void> removePendingAction(String key) async {
    await _pendingActionsStore.delete(key);
  }

  Future<void> clearPendingActions() async {
    await _pendingActionsStore.clear();
  }

  /// Attempt to replay queued mutations.
  ///
  /// Actual HTTP calls should be performed by the caller via a callback
  /// registered through [onSyncPendingAction].
  Future<void> _syncPendingActions() async {
    final pending = getPendingActions();
    if (pending.isEmpty) return;
    debugPrint('OfflineService: syncing ${pending.length} pending actions...');

    for (final action in pending) {
      if (_onSyncCallback != null) {
        try {
          final success = await _onSyncCallback!(action);
          if (success) {
            await removePendingAction(action['queuedAt'] as String);
          }
        } catch (e) {
          debugPrint('OfflineService: sync failed for ${action['endpoint']} — $e');
        }
      }
    }
  }

  /// Register a callback that performs the actual HTTP request for each
  /// pending action. Return `true` if the action was synced successfully.
  Future<bool> Function(Map<String, dynamic> action)? _onSyncCallback;

  void onSyncPendingAction(
    Future<bool> Function(Map<String, dynamic> action) callback,
  ) {
    _onSyncCallback = callback;
  }

  // ---------------------------------------------------------------------------
  // Metadata helpers
  // ---------------------------------------------------------------------------

  Future<void> _setLastSync(String entity) async {
    await _metadataStore.put(
      '${entity}_last_sync',
      DateTime.now().toIso8601String(),
    );
  }

  DateTime? getLastSync(String entity) {
    final raw = _metadataStore.get('${entity}_last_sync');
    if (raw == null) return null;
    return DateTime.tryParse(raw);
  }

  /// Returns true if the cached data for [entity] is older than [maxAge].
  bool isCacheStale(String entity, {Duration maxAge = const Duration(hours: 1)}) {
    final lastSync = getLastSync(entity);
    if (lastSync == null) return true;
    return DateTime.now().difference(lastSync) > maxAge;
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  Future<void> clearAllCaches() async {
    await _propertiesStore.clear();
    await _clientsStore.clear();
    await _leadsStore.clear();
    await _metadataStore.clear();
    debugPrint('OfflineService: all caches cleared');
  }

  void dispose() {
    _connectivityController.close();
  }
}

final offlineServiceProvider = Provider<OfflineService>((ref) {
  return OfflineService.instance;
});

/// Provider that streams current connectivity state.
final connectivityProvider = StreamProvider<bool>((ref) {
  final service = ref.watch(offlineServiceProvider);
  return service.connectivityStream;
});

/// Synchronous provider for quick "are we online?" checks.
final isOnlineProvider = Provider<bool>((ref) {
  final connectivity = ref.watch(connectivityProvider);
  return connectivity.valueOrNull ?? true;
});
