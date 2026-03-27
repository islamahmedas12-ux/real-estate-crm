import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'config/router.dart';
import 'config/theme.dart';
import 'services/notification_service.dart';
import 'services/offline_service.dart';

// NOTE: Replace this stub with the real generated file once you run:
//   flutterfire configure
// That command generates lib/firebase_options.dart which exports
// DefaultFirebaseOptions.currentPlatform used below.
// Until then, Firebase.initializeApp() is called without options and will only
// work on Android/iOS devices where google-services.json / GoogleService-Info.plist
// is placed in the correct location.

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase.
  // TODO: replace with `options: DefaultFirebaseOptions.currentPlatform`
  //       once `flutterfire configure` has been run.
  await Firebase.initializeApp();

  // Initialize offline caching (Hive boxes + connectivity listener).
  await OfflineService.instance.initialize();

  // Initialize push notifications and local notification channels.
  await NotificationService.instance.initialize();

  runApp(const ProviderScope(child: RealEstateCrmApp()));
}

class RealEstateCrmApp extends ConsumerWidget {
  const RealEstateCrmApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

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
