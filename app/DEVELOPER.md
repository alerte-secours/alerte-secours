# Alerte Secours Mobile App - Developer Documentation

This document contains technical information for developers working on the Alerte Secours mobile application.

## Table of Contents

- [Project Overview](#project-overview)
- [Technical Stack](#technical-stack)
- [Development Quick Start](#development-quick-start)
- [Installation](#installation)
  - [Android](#android)
  - [iOS](#ios)
- [Project Structure](#project-structure)
- [Accessibility](#accessibility)
- [Troubleshooting](#troubleshooting)

## Project Overview

Alerte Secours is a mobile application built with React Native that handles alerts and emergency-related functionality. The app supports both iOS and Android platforms and includes features such as:

- Alert creation and management with real-time updates
- Location-based features with mapping integration
- Chat/Messaging system with alert-specific chat rooms
- Authentication via SMS verification
- Deep linking for alert sharing
- Push notifications

## Technical Stack

- React Native
- Expo framework
- GraphQL with Hasura
  - Apollo Client for frontend
  - Federated remote schemas
  - Real-time subscriptions support
- Firebase Cloud Messaging (FCM) for push notifications only
- Sentry for error tracking
- MapLibre for mapping functionality
- Zustand for state management
- i18next for internationalization
- React Navigation for navigation
- Expo Updates for OTA updates
- Background Geolocation for location tracking
- Lottie for animations
- React Hook Form for form handling
- Axios for HTTP requests
- Yarn Berry as package manager
- ESLint and Prettier for code quality
- Fastlane for deployment automation

## Development Quick Start

### Prerequisites

- Node.js (version specified in `.node-version`)
- Yarn package manager
- Android Studio (for Android development)
- Xcode (for iOS development)
- Physical device or emulator/simulator

### Environment Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   yarn
   ```
3. Copy the staging environment file:
   ```bash
   cp .env.staging.example .env.staging
   ```
4. Start the development server with staging environment:
   ```bash
   yarn start:staging
   ```

### Running on Devices

#### Android
```bash
yarn android:staging
```

#### iOS
```bash
yarn ios:staging
```

### Staging URLs

The staging environment uses the following URLs:

- GraphQL API: `https://hasura-staging.alertesecours.fr/v1/graphql`
- WebSocket: `wss://hasura-staging.alertesecours.fr/v1/graphql`
- Files API: `https://files-staging.alertesecours.fr/api/v1/oas`
- Minio: `https://minio-staging.alertesecours.fr`
- Geolocation Sync: `https://api-staging.alertesecours.fr/api/v1/oas/geoloc/sync`

## Installation

### Android

#### Using the Yarn Script

The easiest way to install the app is to use the provided yarn script:

```bash
# Set the device ID (emulator or physical device)
export DEVICE=emulator-5554

# Run the installation script
yarn install:android
```

This script (`install-android.sh`) handles the entire installation process, including building APKs with signing, extracting them, and installing on the device.

#### Manual Installation

If you need to install the app manually, you can examine the `install-android.sh` script in the project root to see the detailed steps involved.

### iOS

#### Authentication Key Setup

1. Go to https://appstoreconnect.apple.com/access/integrations/api
2. Click the "+" button to generate a new API key
3. Give it a name (e.g., "AlerteSecours Build Key")
4. Download the .p8 file when prompted
5. Store the .p8 file in a secure location
6. Note down the Key ID and Issuer ID shown on the website
7. Set up environment variables:
   ```sh
   export ASC_API_KEY_ID="YOUR_KEY_ID"
   export ASC_API_ISSUER_ID="YOUR_ISSUER_ID"
   export ASC_API_KEY_PATH="/path/to/your/AuthKey.p8"
   ```

#### Building and Running

  To build and run the iOS app:

  ```bash
  # Run in development mode with staging environment
  yarn ios:staging

  # Build for production (version + clean + archive + export)
  yarn bundle:ios:build

  # Upload the last build to App Store Connect
  yarn bundle:ios:upload

  # Build + upload
  yarn bundle:ios:release
  ```

  Notes on versioning:
  - `yarn bundle:ios:build` updates iOS `CFBundleShortVersionString` and `CFBundleVersion` to a timestamp in `Europe/Paris` timezone (format `YYYYMMDDHHMM`) before archiving/exporting.
  - `yarn bundle:ios` is an alias of `yarn bundle:ios:build`.

The `bundle:ios` command uses the scripts in the `scripts` directory:
- `ios-archive.sh` - Archives the iOS app
- `ios-export.sh` - Exports the archived app
- `ios-upload.sh` - Uploads the app to App Store Connect (used by `bundle:ios:upload`)

## Project Structure

- `/android` - Android-specific code and configuration
- `/ios` - iOS-specific code and configuration
- `/src` - Main application source code
  - `/app` - App initialization and configuration
  - `/assets` - Static assets (images, fonts, animations)
  - `/auth` - Authentication-related code
  - `/biz` - Business logic and constants
  - `/components` - Reusable UI components
  - `/containers` - Container components
  - `/data` - Data management
  - `/events` - Event handling
  - `/finders` - Search and finder utilities
  - `/gql` - GraphQL queries and mutations
  - `/hoc` - Higher-order components
  - `/hooks` - Custom React hooks
  - `/i18n` - Internationalization
  - `/layout` - Layout components
  - `/lib` - Library code
  - `/location` - Location-related functionality
  - `/misc` - Miscellaneous utilities
  - `/navigation` - Navigation configuration
  - `/network` - Network-related code
  - `/notifications` - Notification handling
  - `/permissions` - Permission handling
  - `/scenes` - Scene components
  - `/screens` - Screen components
  - `/sentry` - Sentry error tracking configuration
  - `/stores` - State management stores
  - `/theme` - Styling and theming
  - `/updates` - Update handling
  - `/utils` - Utility functions
- `/docs` - Documentation files
- `/scripts` - Utility scripts for building, deployment, and development
- `/e2e` - End-to-end tests

## Contributing

Guidelines for contributing to the project:

1. Follow the code style and conventions used in the project
2. Write tests for new features
3. Update documentation as needed
4. Use the ESLint and Prettier configurations

## Accessibility

This app has an accessibility baseline (WCAG 2.2 AA, VoiceOver/TalkBack) and app-specific conventions.

### Docs

- Baseline checklist: [`docs/a11y-wcag22-aa.md`](docs/a11y-wcag22-aa.md:1)
- Code conventions + helpers: [`docs/a11y-usage.md`](docs/a11y-usage.md:1)
- Color contrast guidance: [`docs/a11y-color-contrast.md`](docs/a11y-color-contrast.md:1)
- `testID` conventions: [`docs/testids.md`](docs/testids.md:1)
- QA runbook (iOS VoiceOver): [`docs/qa-voiceover.md`](docs/qa-voiceover.md:1)
- QA runbook (Android TalkBack): [`docs/qa-talkback.md`](docs/qa-talkback.md:1)

### PR checklist (required for any UI change)

- [ ] **Roles / labels / hints / states**: all interactive controls expose correct `accessibilityRole`, meaningful `accessibilityLabel`, helpful `accessibilityHint` (especially icon-only actions), and state where applicable.
- [ ] **Focus management**: any modal/dialog/sheet sets initial focus on open, returns focus on close, and avoids focus traps.
- [ ] **Touch target size**: critical tap targets are comfortably tappable (aim ~44x44pt minimum).
- [ ] **Color contrast**: text + icons meet WCAG AA contrast; do not rely on color alone for meaning.
- [ ] **`testID`s for critical controls**: stable `testID` added/updated for key actions and navigation chrome (per [`docs/testids.md`](docs/testids.md:1)).
- [ ] **Tests**: add/update tests covering the new UI behavior (and its states). Prefer assertions that don’t depend on translated text; include E2E coverage for critical flows when applicable.

### Manual validation (screen readers)

When a PR changes UI or navigation, do a quick pass with the platform screen reader:

- iOS: follow [`docs/qa-voiceover.md`](docs/qa-voiceover.md:1) and validate labels/hints, navigation order, and activation behavior on the affected screens.
- Android: follow [`docs/qa-talkback.md`](docs/qa-talkback.md:1) with the same focus on discoverability, focus order, and activation.

## Troubleshooting

### Common Issues

#### Development Environment

- **Clearing Yarn Cache**: Use `yarn clean` (removes node_modules and reinstalls dependencies)
- **Cleaning Gradle**: Run `cd android && ./gradlew clean`
- **Clearing Gradle Cache**: Remove gradle caches with `rm -rf ~/.gradle/caches/ android/.gradle/`
- **Stopping Gradle Daemons**: Run `cd android && ./gradlew --stop`
- **Clearing ADB Cache**: Run `adb shell pm clear com.alertesecours`
- **Rebuilding Gradle**: Use `yarn expo run:android`
- **Rebuilding Expo React Native**: Use `yarn expo prebuild`
- **Clearing Metro Cache**: Use `yarn expo start --dev-client --clear`

#### Screenshots and Testing

- For Android screenshots: Use `scripts/screenshot-android.sh`
- For iOS screenshots: Use `scripts/screenshot-ios.sh`
- For Android emulator: Use `scripts/android-emulator`

#### Emulator Issues
- Clear cache / uninstall the app
- Check emulator datetime
- Check network connectivity

For more troubleshooting tips, see the documentation in the `/docs` directory.
