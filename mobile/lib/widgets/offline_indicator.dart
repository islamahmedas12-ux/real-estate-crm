import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/offline_service.dart';

/// A banner that slides in at the top of the screen when the device goes
/// offline and hides again when connectivity is restored.
///
/// Wrap your main scaffold body with this widget:
/// ```dart
/// Column(
///   children: [
///     const OfflineIndicator(),
///     Expanded(child: yourContent),
///   ],
/// )
/// ```
class OfflineIndicator extends ConsumerWidget {
  const OfflineIndicator({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isOnline = ref.watch(isOnlineProvider);
    final theme = Theme.of(context);

    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 300),
      transitionBuilder: (child, animation) {
        return SizeTransition(
          sizeFactor: animation,
          axisAlignment: -1,
          child: child,
        );
      },
      child: isOnline
          ? const SizedBox.shrink()
          : MaterialBanner(
              key: const ValueKey('offline_banner'),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              leading: Icon(
                Icons.cloud_off,
                color: theme.colorScheme.onErrorContainer,
              ),
              content: Text(
                'You are offline. Some features may be limited.',
                style: TextStyle(
                  color: theme.colorScheme.onErrorContainer,
                ),
              ),
              backgroundColor: theme.colorScheme.errorContainer,
              actions: const [SizedBox.shrink()],
            ),
    );
  }
}

/// A small chip-style indicator to show offline status inline.
class OfflineChip extends ConsumerWidget {
  const OfflineChip({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isOnline = ref.watch(isOnlineProvider);

    if (isOnline) return const SizedBox.shrink();

    return Chip(
      avatar: const Icon(Icons.cloud_off, size: 16),
      label: const Text('Offline'),
      visualDensity: VisualDensity.compact,
      backgroundColor: Theme.of(context).colorScheme.errorContainer,
      labelStyle: TextStyle(
        color: Theme.of(context).colorScheme.onErrorContainer,
        fontSize: 12,
      ),
    );
  }
}

/// A wrapper widget that overlays the offline indicator on top of any
/// scaffold body. Use this when you cannot easily modify the child layout.
class OfflineAwareScaffold extends ConsumerWidget {
  final PreferredSizeWidget? appBar;
  final Widget body;
  final Widget? bottomNavigationBar;
  final Widget? floatingActionButton;

  const OfflineAwareScaffold({
    super.key,
    this.appBar,
    required this.body,
    this.bottomNavigationBar,
    this.floatingActionButton,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: appBar,
      body: Column(
        children: [
          const OfflineIndicator(),
          Expanded(child: body),
        ],
      ),
      bottomNavigationBar: bottomNavigationBar,
      floatingActionButton: floatingActionButton,
    );
  }
}
