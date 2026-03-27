# Mobile App Analysis — Sprint 1 Readiness
**Analyst:** Youssef Adel, Senior Mobile Developer  
**Date:** 2026-03-27  
**Flutter SDK target:** ≥ 3.7.0  
**State management:** Riverpod 2.x  

---

## 1. Executive Summary

The mobile app skeleton is **well-structured** and further along than a typical Sprint-0 start. All major screens exist with real UI, proper loading/error/empty states, and paginated lists. The service and provider layers are complete and production-grade. The main gaps are:

- Firebase has placeholder credentials (not yet configured with `flutterfire configure`)
- Profile screen is a stub
- `AppConfig` was environment-unaware (fixed in this sprint)
- `AppShell` had a double-AppBar bug (fixed in this sprint)
- Dashboard quick-action buttons had wrong routes (fixed in this sprint)
- No write (create/edit) support for Properties yet
- Offline-aware mutations not wired into providers yet

---

## 2. Screen-by-Screen Status

| Screen | File | Status | Notes |
|---|---|---|---|
| **Login** | `screens/auth/login_screen.dart` | ✅ Complete | OIDC + biometrics wired, loading/error states |
| **Dashboard** | `screens/dashboard/dashboard_screen.dart` | ✅ Complete (minor fixes applied) | Stats, follow-ups, recent activity, shimmer skeleton |
| **Properties List** | `screens/properties/properties_screen.dart` | ✅ Complete | Grid/list toggle, filter badge, pagination, shimmer |
| **Property Detail** | `screens/properties/property_detail_screen.dart` | ✅ Complete | Image carousel, full-screen gallery, map link, share |
| **Property Filter** | `screens/properties/property_filter_sheet.dart` | ✅ Complete | All filter fields wired, DraggableScrollableSheet |
| **Property Create/Edit** | _missing_ | ❌ Missing | No `property_form_screen.dart` exists |
| **Leads List** | `screens/leads/leads_list_screen.dart` | ✅ Complete | Search, status chip filter, pagination, shimmer |
| **Lead Detail** | `screens/leads/lead_detail_screen.dart` | ✅ Complete | Activity timeline, add activity, change status, delete |
| **Lead Form** | `screens/leads/lead_form_screen.dart` | ⚠️ Partial | Works but uses raw ID text fields instead of pickers for Client/Property |
| **Clients List** | `screens/clients/clients_list_screen.dart` | ✅ Complete | Search, type filter chips, pagination |
| **Client Detail** | `screens/clients/client_detail_screen.dart` | ✅ Complete | Contact actions, leads/contracts tabs, delete |
| **Client Form** | `screens/clients/client_form_screen.dart` | ✅ Complete | All fields, validation, create/edit |
| **Notifications** | `screens/notifications/notifications_screen.dart` | ✅ Complete | Dismissible list, mark all read, navigation on tap |
| **Notification Prefs** | `screens/notifications/notification_preferences_screen.dart` | ✅ Complete | Per-category toggles, master push toggle |
| **Profile** | `screens/profile/profile_screen.dart` | ❌ Stub | Only shows sign-out button — no user info, no settings |

---

## 3. API Service Integration Status

All services use `Dio` via `ApiClient` with Bearer token injection (auto-refresh on 401). All services are wired via Riverpod providers.

| Service | File | Status | Endpoints |
|---|---|---|---|
| `ApiClient` | `services/api_client.dart` | ✅ Complete | Auth interceptor, 401 auto-refresh |
| `AuthService` | `services/auth_service.dart` | ✅ Complete | OIDC PKCE login, refresh, secure storage |
| `PropertyService` | `services/property_service.dart` | ✅ Complete | GET list, GET detail, GET stats |
| `LeadsService` | `services/leads_service.dart` | ✅ Complete | Full CRUD + activities + status change |
| `ClientsService` | `services/clients_service.dart` | ✅ Complete | Full CRUD |
| `NotificationService` | `services/notification_service.dart` | ✅ Complete | FCM + local notifications + persistence |
| `BiometricService` | `services/biometric_service.dart` | ✅ Complete | `local_auth` wrapped, isAvailable + authenticate |
| `OfflineService` | `services/offline_service.dart` | ✅ Complete | Hive caching + connectivity + pending-action queue |

**Gap:** `PropertyService` has no create/update/delete methods — these need to be added when `PropertyFormScreen` is built.

---

## 4. State Management (Riverpod)

| Provider | File | Pattern | Status |
|---|---|---|---|
| `authStateProvider` | `providers/auth_provider.dart` | `AsyncNotifierProvider` | ✅ Proper — async build restores session on startup |
| `dashboardProvider` | `providers/dashboard_provider.dart` | `StateNotifierProvider` | ✅ Proper |
| `propertyListProvider` | `providers/property_provider.dart` | `StateNotifierProvider` | ✅ Proper — pagination + filter reactivity |
| `propertyDetailProvider` | `providers/property_provider.dart` | `FutureProvider.family` | ✅ Proper |
| `propertyFilterProvider` | `providers/property_provider.dart` | `StateProvider` | ✅ Proper |
| `leadListProvider` | `providers/lead_provider.dart` | `StateNotifierProvider` | ✅ Proper |
| `leadDetailProvider` | `providers/lead_provider.dart` | `FutureProvider.family` | ✅ Proper |
| `leadActivitiesProvider` | `providers/lead_provider.dart` | `FutureProvider.family` | ✅ Proper |
| `clientListProvider` | `providers/client_provider.dart` | `StateNotifierProvider` | ✅ Proper |
| `clientDetailProvider` | `providers/client_provider.dart` | `FutureProvider.family` | ✅ Proper |
| `notificationProvider` | `providers/notification_provider.dart` | `StateNotifierProvider` | ✅ Proper — real-time FCM stream subscription |

**Overall:** State management is correctly implemented. No business logic in widgets. Filters trigger automatic list refreshes. All providers properly dispose streams.

---

## 5. Offline Support Status

**File:** `services/offline_service.dart`  
**Status:** ✅ Infrastructure complete — integration partial

### What's done:
- Hive initialized with 5 boxes: `cached_properties`, `cached_clients`, `cached_leads`, `cache_metadata`, `pending_actions`
- Connectivity monitoring via `connectivity_plus` with stream-based reactivity
- `isOnlineProvider` / `connectivityProvider` available for UI
- `OfflineIndicator` widget implemented and wired into `AppShell`
- Cache read/write methods for all 3 entities
- `pendingActionsQueue` for offline mutations with `onSyncPendingAction` callback
- `isCacheStale()` with configurable max age

### What's missing:
- **Providers don't fall back to cache on error.** If the API call fails and the device is offline, providers show error state instead of serving cached data.
- **Mutations don't queue offline.** `createLead`, `updateLead`, etc. don't call `OfflineService.queueAction()` when offline.
- No sync callback registered anywhere to replay pending actions.

---

## 6. Biometric Auth Status

**File:** `services/biometric_service.dart`  
**Status:** ✅ Complete

- `isAvailable()` checks `canCheckBiometrics && isDeviceSupported`
- `authenticate()` calls `LocalAuthentication.authenticate` with `stickyAuth: true, biometricOnly: false`
- `getAvailableBiometrics()` exposes enrolled types
- `LoginScreen` checks availability on `initState` and conditionally shows the biometric button

**Gap:** Biometric auth on the login screen currently triggers a full OIDC flow after success — it doesn't skip to a token-refresh path. If the user has a valid stored token, biometric should unlock directly without OIDC.

---

## 7. Push Notifications Status

**File:** `services/notification_service.dart`  
**Status:** ✅ Complete

- FCM integration with foreground + background + terminated-state handlers
- Android high-importance channel `crm_high_importance` created
- iOS `DarwinInitializationSettings` configured
- Local notifications shown for foreground FCM messages
- `AppNotification` model with full JSON serialization
- `NotificationPreferences` per-category toggles persisted in `SharedPreferences`
- `notificationsStream` feeds `notificationProvider` in real time
- `navigationStream` for tap-based deep-link routing
- FCM token refresh listener with TODO to send to backend
- `NotificationsScreen` and `NotificationPreferencesScreen` fully implemented

**Gap:** FCM token is logged but never sent to the backend API. Backend cannot target specific devices until `_fcm.onTokenRefresh` calls the API. This needs a `POST /api/users/me/device-token` call.

---

## 8. Firebase Integration Status

**File:** `config/firebase_options.dart`  
**Status:** ⚠️ Placeholder — critical for production

The custom `firebase_options.dart` defines a hand-crafted `FirebaseOptions` class with `'YOUR_*'` placeholder values. **This is not the standard `firebase_options.dart` generated by `flutterfire configure`.**

The standard file exports `DefaultFirebaseOptions.currentPlatform` which `Firebase.initializeApp()` requires. Until `flutterfire configure` is run against a real Firebase project:
- Push notifications will not work
- The app will fail to initialize Firebase in release builds

**Action required:**
1. Create a Firebase project at https://console.firebase.google.com
2. Run `flutterfire configure` from the `mobile/` directory
3. Replace `lib/config/firebase_options.dart` with the generated file
4. Add `google-services.json` to `android/app/`
5. Add `GoogleService-Info.plist` to `ios/Runner/`
6. Update `main.dart`: `await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);`

---

## 9. Environment / API Base URL Configuration

**File:** `config/app_config.dart`  
**Status:** ✅ Fixed in this sprint

Previous state: single hardcoded `http://10.0.2.2:3000` constant (Android emulator only).

**Current state after fix:**
```dart
// Select environment at build time:
flutter run  --dart-define=ENV=dev   # default
flutter run  --dart-define=ENV=qa
flutter run  --dart-define=ENV=uat
flutter run  --dart-define=ENV=prod
flutter build apk --dart-define=ENV=prod
```

| Environment | API Base URL |
|---|---|
| `dev` | `http://10.0.2.2:3000` (Android emulator) |
| `qa` | `https://api.qa.real-estate-crm.example.com` |
| `uat` | `https://api.uat.real-estate-crm.example.com` |
| `prod` | `https://api.real-estate-crm.example.com` |

**Update the placeholder URLs** with real endpoints in `app_config.dart` when infra is provisioned.

---

## 10. Issues Found

### 🔴 Critical (blocks functionality)

| # | Issue | File | Fix Applied |
|---|---|---|---|
| C-1 | **Double AppBar** — `AppShell` rendered its own AppBar on top of each screen's AppBar, causing duplicate headers in the shell routes | `widgets/app_shell.dart` | ✅ Fixed — AppShell AppBar removed; each screen owns its header |
| C-2 | **Firebase not initialized** — `firebase_options.dart` has placeholder values; `Firebase.initializeApp()` will fail in release mode or on real devices without `google-services.json` | `config/firebase_options.dart`, `main.dart` | ⚠️ Documented + warning comment added — requires `flutterfire configure` by infra/backend team |
| C-3 | **Dashboard "Add Lead" navigated to list instead of form** — `context.go('/leads')` sent users to the list, not the creation form | `screens/dashboard/dashboard_screen.dart` | ✅ Fixed — changed to `context.push('/leads/new')` |
| C-4 | **Dashboard "Add Client" navigated to list instead of form** | `screens/dashboard/dashboard_screen.dart` | ✅ Fixed — changed to `context.push('/clients/new')` |
| C-5 | **Dashboard notification bell was a no-op TODO** | `screens/dashboard/dashboard_screen.dart` | ✅ Fixed — wired to `context.push('/notifications')` with unread badge |
| C-6 | **AppConfig hardcoded to dev only** — no multi-environment support | `config/app_config.dart` | ✅ Fixed — full ENV-based configuration |

### 🟡 Major (impacts features)

| # | Issue | File | Status |
|---|---|---|---|
| M-1 | **FCM device token never sent to backend** — server cannot send targeted push notifications | `services/notification_service.dart` | Open — add `POST /api/users/me/device-token` |
| M-2 | **Offline fallback not wired** — providers show error instead of cache when offline | All providers | Open — wrap API calls with cache fallback |
| M-3 | **Offline mutations not queued** — create/update/delete fail silently when offline instead of queuing | All service files | Open — call `OfflineService.queueAction()` |
| M-4 | **Property create/edit screen missing** — no `PropertyFormScreen`, no create/update/delete in `PropertyService` | `services/property_service.dart` | Open — Sprint 2 |
| M-5 | **Profile screen is a stub** — shows no user info (name, email, role, avatar) | `screens/profile/profile_screen.dart` | Open — Sprint 2 |
| M-6 | **Biometric auth triggers full OIDC flow** — should instead re-use existing stored tokens without a new OIDC round-trip | `screens/auth/login_screen.dart`, `providers/auth_provider.dart` | Open — Sprint 2 |

### 🟠 Minor (polish/UX)

| # | Issue | File | Status |
|---|---|---|---|
| N-1 | **Lead form uses raw text fields for Client ID and Property ID** — UX should use searchable pickers | `screens/leads/lead_form_screen.dart` | Open |
| N-2 | **Dashboard "Log Call" quick action is a no-op** — opens nothing | `screens/dashboard/dashboard_screen.dart` | Open |
| N-3 | **iOS API base URL** — `AppConfig` previously had `apiBaseUrlIos` but Dio always used `apiBaseUrl`; now environment-driven | Fixed via C-6 | ✅ Resolved |
| N-4 | **No pagination reset when filter changes** — `ClientListNotifier` and `LeadListNotifier` correctly call `loadClients()`/`loadLeads()` from page 1, but the filter `StateProvider` change triggers a new notifier instance, which is correct | `providers/client_provider.dart`, `providers/lead_provider.dart` | Already correct ✅ |
| N-5 | **`firebase_options.dart` uses custom class**, not the `firebase_core` `FirebaseOptions` — won't compile with `DefaultFirebaseOptions.currentPlatform` until regenerated | `config/firebase_options.dart` | See C-2 |
| N-6 | **Dark mode shimmer colors** — dashboard skeleton uses `Colors.grey[800]` logic correctly but properties/leads/clients shimmer don't adapt to dark mode | Various screens | Open |

---

## 11. Missing Features (Backlog)

| Feature | Priority | Notes |
|---|---|---|
| Property create/edit screen + service methods | High | Sprint 2 |
| Profile screen — user info, avatar, settings | High | Sprint 2 |
| FCM token registration to backend | High | Needed before push works end-to-end |
| Offline fallback in providers | Medium | Cache-first strategy |
| Offline mutation queuing | Medium | Queue + sync on reconnect |
| Client/Property pickers in Lead form | Medium | UX improvement |
| Contracts screen | Medium | Referenced in client detail but no dedicated screen |
| Biometric re-auth with existing tokens | Medium | Skip OIDC for returning users |
| Tests — widget + integration | Medium | `test/widget_test.dart` is Flutter boilerplate only |
| Deep link handling from FCM taps | Low | `navigationStream` is set up; routing logic in `NotificationsScreen` exists |
| App icon / splash screen | Low | Assets directories exist but are empty |

---

## 12. Tech Debt

1. **No code generation run yet** — `freezed` and `riverpod_generator` are in `dev_dependencies` but no `.g.dart` or `.freezed.dart` files exist. Models use hand-rolled `fromJson`. Consider migrating to generated code for safety.
2. **pubspec.yaml uses `flutter_riverpod`** (Riverpod 2) but all providers use `StateNotifier` and `StateNotifierProvider` (Riverpod v1-style). Should migrate to `@riverpod` codegen or `Notifier`/`AsyncNotifier` for consistency. (Auth provider already uses `AsyncNotifier` correctly.)
3. **No error boundary widget** — individual screens handle errors locally but there's no global `ProviderObserver` for unhandled exceptions.
4. **No analytics / crash reporting** — Firebase Crashlytics not integrated.

---

## 13. Build Instructions (Current)

```bash
cd mobile/

# Dev (Android emulator)
flutter run --dart-define=ENV=dev

# QA
flutter run --dart-define=ENV=qa

# Release build
flutter build apk --dart-define=ENV=prod --release
flutter build ipa --dart-define=ENV=prod --release

# Before first run, get dependencies:
flutter pub get
```

**Firebase setup required before first real-device run — see Section 8.**
