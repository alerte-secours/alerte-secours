# Configuration Files Requirements

This document outlines the configuration files required for the Alerte Secours mobile app and how to set them up.

## Environment Variables

The app uses environment variables for configuration and sensitive information. There are several environment files:

### Development Environment

Copy `.env.default` to `.env.local` (which is git-ignored) and fill in the required values:

- `BACKGROUND_GEOLOCATION_LICENSE`: License key for react-native-background-geolocation

### Production Environment

Copy `.env.prod.example` to `.env.prod` (which is git-ignored) and fill in the required values:

- `SENTRY_DSN`: Your Sentry DSN for error tracking
- `SENTRY_ORG`: Your Sentry organization
- `SENTRY_PROJECT`: Your Sentry project name
- `ASC_API_KEY_ID`: Your App Store Connect API Key ID
- `ASC_API_ISSUER_ID`: Your App Store Connect API Issuer ID
- `ASC_API_KEY_PATH`: Path to your App Store Connect API Key file
- `PROVIDER_ID`: Your App Store Connect Provider ID

### Staging Environment

Copy `.env.staging.example` to `.env.staging` (which is git-ignored) and fill in the required values with the same information as the production environment, but with staging-specific values where applicable.

## Google Services Configuration

### iOS

1. Copy `ios/GoogleService-Info.example.plist` to `ios/GoogleService-Info.plist`
2. Copy `ios/AlerteSecours/GoogleService-Info.example.plist` to `ios/AlerteSecours/GoogleService-Info.plist`
3. Fill in the following values:
   - `API_KEY`: Your Google API key
   - `GCM_SENDER_ID`: Your GCM sender ID
   - `PROJECT_ID`: Your Firebase project ID
   - `STORAGE_BUCKET`: Your Firebase storage bucket
   - `GOOGLE_APP_ID`: Your Google app ID

### Android

1. Copy `android/app/google-services.example.json` to `android/app/google-services.json`
2. Fill in the following values:
   - `project_number`: Your Firebase project number
   - `project_id`: Your Firebase project ID
   - `storage_bucket`: Your Firebase storage bucket
   - `mobilesdk_app_id`: Your Firebase mobile SDK app ID
   - `client_id`: Your OAuth client ID
   - `current_key`: Your Google API key

## Expo Updates Configuration

1. Copy `ios/AlerteSecours/Supporting/Expo.example.plist` to `ios/AlerteSecours/Supporting/Expo.plist`
2. Fill in the `EXUpdatesCodeSigningCertificate` with your Expo code signing certificate

## How to Obtain These Values

### Firebase Configuration

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project or create a new one
3. Add iOS and Android apps to your project
4. Download the configuration files for each platform

### Background Geolocation License

Purchase a license from [Transistor Software](https://www.transistorsoft.com/shop/products/react-native-background-geolocation)

### Expo Code Signing Certificate

Generate a code signing certificate for Expo updates by following the [Expo documentation](https://docs.expo.dev/eas-update/code-signing/)