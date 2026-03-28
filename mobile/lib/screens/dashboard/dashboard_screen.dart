import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:shimmer/shimmer.dart';

import '../../models/dashboard_stats.dart';
import '../../providers/dashboard_provider.dart';
import '../../providers/notification_provider.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboard = ref.watch(dashboardProvider);
    final unreadCount = ref.watch(unreadNotificationCountProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          IconButton(
            icon: Badge(
              isLabelVisible: unreadCount > 0,
              label: Text(
                unreadCount > 99 ? '99+' : '$unreadCount',
                style: const TextStyle(fontSize: 10),
              ),
              child: const Icon(Icons.notifications_outlined),
            ),
            tooltip: 'Notifications',
            onPressed: () => context.push('/notifications'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(dashboardProvider.notifier).refresh(),
        child: dashboard.isLoading && dashboard.stats == null
            ? const _DashboardSkeleton()
            : dashboard.error != null && dashboard.stats == null
                ? _DashboardError(
                    message: dashboard.error!,
                    onRetry: () =>
                        ref.read(dashboardProvider.notifier).refresh(),
                  )
                : _DashboardContent(dashboard: dashboard),
      ),
    );
  }
}

class _DashboardContent extends StatelessWidget {
  final DashboardState dashboard;

  const _DashboardContent({required this.dashboard});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.symmetric(vertical: 8),
      children: [
        _WelcomeHeader(),
        const SizedBox(height: 12),
        _StatsSection(stats: dashboard.stats),
        const SizedBox(height: 8),
        _QuickActions(),
        const SizedBox(height: 8),
        _FollowUpsSection(followUps: dashboard.todayFollowUps),
        const SizedBox(height: 8),
        _RecentActivitiesSection(activities: dashboard.recentActivities),
        const SizedBox(height: 16),
      ],
    );
  }
}

// ─── Welcome Header ─────────────────────────────────────────────────

class _WelcomeHeader extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final hour = DateTime.now().hour;
    String greeting;
    IconData greetingIcon;
    if (hour < 12) {
      greeting = 'Good Morning';
      greetingIcon = Icons.wb_sunny_outlined;
    } else if (hour < 17) {
      greeting = 'Good Afternoon';
      greetingIcon = Icons.wb_cloudy_outlined;
    } else {
      greeting = 'Good Evening';
      greetingIcon = Icons.nights_stay_outlined;
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          Icon(greetingIcon, color: theme.colorScheme.primary, size: 28),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                greeting,
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                DateFormat('EEEE, MMM d').format(DateTime.now()),
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── Stats Cards ─────────────────────────────────────────────────────

class _StatsSection extends StatelessWidget {
  final DashboardStats? stats;

  const _StatsSection({required this.stats});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Overview', style: theme.textTheme.titleMedium),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _StatCard(
                  icon: Icons.person_search,
                  label: 'My Leads',
                  value: stats?.myLeads ?? 0,
                  color: Colors.blue,
                  route: '/leads',
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _StatCard(
                  icon: Icons.people,
                  label: 'My Clients',
                  value: stats?.myClients ?? 0,
                  color: Colors.green,
                  route: '/clients',
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _StatCard(
                  icon: Icons.apartment,
                  label: 'Properties',
                  value: stats?.myProperties ?? 0,
                  color: Colors.orange,
                  route: '/properties',
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _StatCard(
                  icon: Icons.schedule,
                  label: 'Follow-ups',
                  value: stats?.pendingFollowUps ?? 0,
                  color: Colors.red,
                  urgent: (stats?.pendingFollowUps ?? 0) > 5,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          // Summary row
          _SummaryBanner(stats: stats),
        ],
      ),
    );
  }
}

class _SummaryBanner extends StatelessWidget {
  final DashboardStats? stats;

  const _SummaryBanner({required this.stats});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final total = (stats?.myLeads ?? 0) +
        (stats?.myClients ?? 0) +
        (stats?.myProperties ?? 0);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            theme.colorScheme.primary.withAlpha(25),
            theme.colorScheme.tertiary.withAlpha(15),
          ],
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: theme.colorScheme.primary.withAlpha(40),
        ),
      ),
      child: Row(
        children: [
          Icon(
            Icons.insights,
            color: theme.colorScheme.primary,
            size: 20,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'You're managing $total active items with ${stats?.pendingFollowUps ?? 0} pending follow-ups.',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurface,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final int value;
  final Color color;
  final String? route;
  final bool urgent;

  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
    this.route,
    this.urgent = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: urgent
            ? BorderSide(color: color.withAlpha(120), width: 1.5)
            : BorderSide.none,
      ),
      child: InkWell(
        onTap: route != null ? () => context.push(route!) : null,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withAlpha(30),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: color, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          '$value',
                          style: theme.textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        if (urgent) ...[
                          const SizedBox(width: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 4,
                              vertical: 1,
                            ),
                            decoration: BoxDecoration(
                              color: color.withAlpha(30),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              '!',
                              style: TextStyle(
                                color: color,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    Text(
                      label,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              if (route != null)
                Icon(
                  Icons.chevron_right,
                  size: 16,
                  color: theme.colorScheme.onSurfaceVariant.withAlpha(120),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Quick Actions ───────────────────────────────────────────────────

class _QuickActions extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Quick Actions', style: theme.textTheme.titleMedium),
          const SizedBox(height: 8),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _ActionChip(
                  icon: Icons.person_add,
                  label: 'Add Lead',
                  color: Colors.blue,
                  onTap: () => context.push('/leads/new'),
                ),
                const SizedBox(width: 8),
                _ActionChip(
                  icon: Icons.add_home_work,
                  label: 'Add Property',
                  color: Colors.orange,
                  onTap: () => context.push('/properties/new'),
                ),
                const SizedBox(width: 8),
                _ActionChip(
                  icon: Icons.group_add,
                  label: 'Add Client',
                  color: Colors.green,
                  onTap: () => context.push('/clients/new'),
                ),
                const SizedBox(width: 8),
                _ActionChip(
                  icon: Icons.event,
                  label: 'Schedule Viewing',
                  color: Colors.purple,
                  onTap: () => context.push('/leads'),
                ),
                const SizedBox(width: 8),
                _ActionChip(
                  icon: Icons.phone,
                  label: 'Log Call',
                  color: Colors.teal,
                  onTap: () {
                    // TODO: open call log sheet
                  },
                ),
                const SizedBox(width: 8),
                _ActionChip(
                  icon: Icons.qr_code_scanner,
                  label: 'Scan Card',
                  color: Colors.indigo,
                  onTap: () {
                    // TODO: open business card scanner
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _ActionChip({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Material(
      color: color.withAlpha(20),
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withAlpha(30),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              const SizedBox(height: 6),
              Text(
                label,
                style: theme.textTheme.labelSmall?.copyWith(
                  color: color,
                  fontWeight: FontWeight.w600,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Today's Follow-ups ─────────────────────────────────────────────

class _FollowUpsSection extends StatelessWidget {
  final List<FollowUp> followUps;

  const _FollowUpsSection({required this.followUps});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final timeFormat = DateFormat.jm();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text("Today's Follow-ups", style: theme.textTheme.titleMedium),
              if (followUps.isNotEmpty)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primary.withAlpha(25),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${followUps.length}',
                    style: theme.textTheme.labelLarge?.copyWith(
                      color: theme.colorScheme.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          if (followUps.isEmpty)
            Card(
              margin: EdgeInsets.zero,
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Center(
                  child: Column(
                    children: [
                      Icon(
                        Icons.check_circle_outline,
                        size: 36,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'All caught up! No follow-ups for today.',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            )
          else
            ...followUps.map(
              (fu) => Card(
                margin: const EdgeInsets.only(bottom: 6),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: theme.colorScheme.primaryContainer,
                    child: Text(
                      fu.clientName.isNotEmpty
                          ? fu.clientName[0].toUpperCase()
                          : '?',
                      style: TextStyle(
                        color: theme.colorScheme.onPrimaryContainer,
                      ),
                    ),
                  ),
                  title: Text(fu.clientName),
                  subtitle: Text(
                    fu.propertyTitle ?? fu.leadStatus,
                    overflow: TextOverflow.ellipsis,
                  ),
                  trailing: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        timeFormat.format(fu.scheduledAt),
                        style: theme.textTheme.bodySmall?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      if (_isOverdue(fu.scheduledAt))
                        Text(
                          'Overdue',
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: theme.colorScheme.error,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  bool _isOverdue(DateTime scheduledAt) {
    return scheduledAt.isBefore(DateTime.now());
  }
}

// ─── Recent Activities ──────────────────────────────────────────────

class _RecentActivitiesSection extends StatelessWidget {
  final List<RecentActivity> activities;

  const _RecentActivitiesSection({required this.activities});

  IconData _iconForType(String type) {
    switch (type) {
      case 'CALL':
        return Icons.phone;
      case 'EMAIL':
        return Icons.email;
      case 'MEETING':
        return Icons.handshake;
      case 'VIEWING':
        return Icons.visibility;
      case 'NOTE':
        return Icons.note;
      case 'STATUS_CHANGE':
        return Icons.swap_horiz;
      default:
        return Icons.circle;
    }
  }

  Color _colorForType(String type) {
    switch (type) {
      case 'CALL':
        return Colors.blue;
      case 'EMAIL':
        return Colors.indigo;
      case 'MEETING':
        return Colors.green;
      case 'VIEWING':
        return Colors.orange;
      case 'NOTE':
        return Colors.grey;
      case 'STATUS_CHANGE':
        return Colors.purple;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Recent Activity', style: theme.textTheme.titleMedium),
              if (activities.length > 10)
                TextButton(
                  onPressed: () {
                    // TODO: navigate to full activity log
                  },
                  child: const Text('View All'),
                ),
            ],
          ),
          const SizedBox(height: 8),
          if (activities.isEmpty)
            Card(
              margin: EdgeInsets.zero,
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Center(
                  child: Text(
                    'No recent activity',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ),
              ),
            )
          else
            ...activities.take(10).map(
              (a) {
                final color = _colorForType(a.type);
                return Card(
                  margin: const EdgeInsets.only(bottom: 4),
                  child: ListTile(
                    dense: true,
                    leading: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: color.withAlpha(25),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        _iconForType(a.type),
                        size: 18,
                        color: color,
                      ),
                    ),
                    title: Text(
                      a.description,
                      style: theme.textTheme.bodyMedium,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    subtitle: Text(
                      _formatRelativeTime(a.createdAt),
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ),
                );
              },
            ),
        ],
      ),
    );
  }

  String _formatRelativeTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);

    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return DateFormat.MMMd().format(dt);
  }
}

// ─── Skeleton Loading ───────────────────────────────────────────────

class _DashboardSkeleton extends StatelessWidget {
  const _DashboardSkeleton();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final baseColor = isDark ? Colors.grey[800]! : Colors.grey[300]!;
    final highlightColor = isDark ? Colors.grey[700]! : Colors.grey[100]!;

    return Shimmer.fromColors(
      baseColor: baseColor,
      highlightColor: highlightColor,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Welcome skeleton
          _SkeletonBox(height: 48),
          const SizedBox(height: 16),
          // Stats skeleton
          Row(
            children: [
              Expanded(child: _SkeletonBox(height: 80)),
              const SizedBox(width: 8),
              Expanded(child: _SkeletonBox(height: 80)),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(child: _SkeletonBox(height: 80)),
              const SizedBox(width: 8),
              Expanded(child: _SkeletonBox(height: 80)),
            ],
          ),
          const SizedBox(height: 8),
          _SkeletonBox(height: 44),
          const SizedBox(height: 24),
          // Quick actions skeleton
          _SkeletonBox(height: 80),
          const SizedBox(height: 24),
          // Follow-ups skeleton
          _SkeletonBox(height: 64),
          const SizedBox(height: 6),
          _SkeletonBox(height: 64),
          const SizedBox(height: 6),
          _SkeletonBox(height: 64),
          const SizedBox(height: 24),
          // Activities skeleton
          _SkeletonBox(height: 48),
          const SizedBox(height: 4),
          _SkeletonBox(height: 48),
          const SizedBox(height: 4),
          _SkeletonBox(height: 48),
        ],
      ),
    );
  }
}

class _SkeletonBox extends StatelessWidget {
  final double height;

  const _SkeletonBox({required this.height});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
    );
  }
}

// ─── Error State ────────────────────────────────────────────────────

class _DashboardError extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _DashboardError({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.cloud_off,
              size: 48,
              color: theme.colorScheme.error,
            ),
            const SizedBox(height: 16),
            Text(
              message,
              style: theme.textTheme.bodyLarge,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}
