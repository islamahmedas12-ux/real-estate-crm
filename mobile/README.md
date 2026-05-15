# Real Estate CRM — Mobile App

Flutter mobile app for real estate agents, running on Android and iOS.

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Flutter SDK | ^3.7.0 | Mobile framework |
| Dart SDK | ^3.7.0 | Language |
| Android Studio | 2024+ | Android build & emulator |
| Xcode | 15+ | iOS build (macOS only) |

## Getting Started

```bash
cd mobile
flutter pub get
flutter run
```

For a physical device, enable USB debugging and run `flutter run --device-id=<device-id>`.

## Android Setup

1. Install Flutter SDK from [flutter.dev](https://flutter.dev/docs/get-started/install)
2. Install Android Studio with Android SDK API 34+
3. Set `ANDROID_HOME` and `ANDROID_SDK_ROOT` environment variables
4. Enable USB debugging on your device (Developer Options → USB debugging)

## iOS Setup (macOS only)

1. Install Flutter SDK from [flutter.dev](https://flutter.dev/docs/get-started/install)
2. Install Xcode 15+ from the Mac App Store
3. Run `xcode-select --install` to install command-line tools
4. Open `ios/Runner.xcworkspace` in Xcode to configure signing

## Authentication (Authme OAuth)

The app authenticates via Authme IAM. Configure these environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `AUTHME_URL` | Authme server base URL | `http://localhost:3001` |
| `AUTHME_REALM` | Authme realm name | `real-estate-dev` |
| `AUTHME_CLIENT_ID` | Mobile OAuth client ID | `crm-mobile` |
| `REDIRECT_URI` | OAuth redirect URI | `io.realestatecrm.mobile://callback` |

The mobile OAuth client must be registered in Authme with:
- **Valid Redirect URIs**: `io.realestatecrm.mobile://callback`
- **Client Protocol**: `openid-connect`
- **Access Token Lifespan**: 15 minutes (use refresh tokens)

### Biometric Login

Android uses Android Keystore; iOS uses iOS Keychain for storing credentials securely. No extra setup is required — biometrics are handled natively by Flutter.

## Firebase Configuration

Firebase is required for push notifications (FCM). See **[Issue #229](https://github.com/islamahmedas12-ux/real-estate-crm/issues/229)** for setup instructions.

Summary:
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Register Android and iOS apps in the Firebase project
3. Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
4. Place them in `android/app/` and `ios/Runner/` respectively
5. Run `flutterfire configure` to link Firebase to the Flutter project

## Building

```bash
# Android APK (debug)
flutter build apk

# Android App Bundle (release)
flutter build appbundle

# iOS IPA (requires macOS)
flutter build ipa
```

## Testing

```bash
# Run all widget tests
flutter test

# Run integration tests
flutter test integration_test/
```

## Offline Sync

The app caches data locally using SQLite. On reconnect, pending changes sync automatically with the backend API. No special setup required.

## Project Structure

```
mobile/
├── lib/
│   ├── main.dart           # App entry point
│   ├── core/               # Auth, theme, constants
│   ├── data/               # Repositories, data sources
│   ├── domain/             # Models, use cases
│   └── presentation/      # Screens, widgets
├── assets/                 # Images, fonts
├── test/                  # Widget tests
└── integration_test/      # Integration tests
```

## References

- Main development guide: [docs/development.md](../docs/development.md)
- Deployment guide: [docs/deployment.md](../docs/deployment.md)
- Authme setup: [docs/authme-setup.md](../docs/authme-setup.md)