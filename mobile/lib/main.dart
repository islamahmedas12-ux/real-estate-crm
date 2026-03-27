import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';

// ---------------------------------------------------------------------------
// NOTE: Firebase integration
// ---------------------------------------------------------------------------
// Firebase is intentionally excluded from this PR scope (Issue #11).
// To re-enable Firebase:
//   1. Run `flutterfire configure`
//   2. Import firebase_core and firebase_options
//   3. Call `await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform)`
//      before `runApp`.
// ---------------------------------------------------------------------------

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  runApp(
    // ProviderScope enables Riverpod state management for the whole widget tree.
    const ProviderScope(
      child: RealEstateCrmApp(),
    ),
  );
}

/// Root widget for the Real Estate CRM mobile application.
///
/// Uses [ConsumerWidget] to watch [appRouterProvider] (which itself watches
/// [authProvider]) so the router automatically redirects when auth state
/// changes (login / logout).
class RealEstateCrmApp extends ConsumerWidget {
  const RealEstateCrmApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);

    return MaterialApp.router(
      title: 'Real Estate CRM',
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: ThemeMode.system,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
