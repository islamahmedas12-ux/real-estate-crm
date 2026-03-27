import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/dashboard_stats.dart';
import '../services/api_client.dart';

class DashboardState {
  final DashboardStats? stats;
  final List<FollowUp> todayFollowUps;
  final List<RecentActivity> recentActivities;
  final bool isLoading;
  final String? error;

  const DashboardState({
    this.stats,
    this.todayFollowUps = const [],
    this.recentActivities = const [],
    this.isLoading = false,
    this.error,
  });

  DashboardState copyWith({
    DashboardStats? stats,
    List<FollowUp>? todayFollowUps,
    List<RecentActivity>? recentActivities,
    bool? isLoading,
    String? error,
  }) {
    return DashboardState(
      stats: stats ?? this.stats,
      todayFollowUps: todayFollowUps ?? this.todayFollowUps,
      recentActivities: recentActivities ?? this.recentActivities,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class DashboardNotifier extends StateNotifier<DashboardState> {
  final ApiClient _api;

  DashboardNotifier(this._api) : super(const DashboardState()) {
    load();
  }

  Future<void> load() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _api.dio.get('/dashboard');
      final data = response.data as Map<String, dynamic>;

      state = state.copyWith(
        stats: DashboardStats.fromJson(data['stats'] as Map<String, dynamic>),
        todayFollowUps: (data['todayFollowUps'] as List)
            .map((e) => FollowUp.fromJson(e as Map<String, dynamic>))
            .toList(),
        recentActivities: (data['recentActivities'] as List)
            .map((e) => RecentActivity.fromJson(e as Map<String, dynamic>))
            .toList(),
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load dashboard',
      );
    }
  }

  Future<void> refresh() => load();
}

final dashboardProvider =
    StateNotifierProvider<DashboardNotifier, DashboardState>((ref) {
  final api = ref.watch(apiClientProvider);
  return DashboardNotifier(api);
});
