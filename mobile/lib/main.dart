import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'config/router.dart';
import 'config/theme.dart';
import 'services/notification_service.dart';
import 'services/offline_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase.
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
