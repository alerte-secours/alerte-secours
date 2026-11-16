# get/create creds
- appstoreconnect apiKey
generate a key here: https://appstoreconnect.apple.com/access/integrations/api
- retrieve provider id (called PublicId in the output of altool)
```sh
xcrun altool --list-providers --apiKey $ASC_API_KEY_ID --apiIssuer $ASC_API_ISSUER_ID --apiKeyPath $ASC_API_KEY_PATH
```

# Authentication Key Setup
1. Go to https://appstoreconnect.apple.com/access/integrations/api
2. Click the "+" button to generate a new API key
3. Give it a name (e.g., "AlerteSecours Build Key")
4. Download the .p8 file when prompted
5. Store the .p8 file as `~/.private_keys/AuthKey_<KEY_ID>.p8` (mode 600), one of the places `altool` looks for it
6. Note down the Key ID and Issuer ID shown on the website
7. Set up environment variables:
```sh
export ASC_API_KEY_ID="YOUR_KEY_ID"
export ASC_API_ISSUER_ID="YOUR_ISSUER_ID"
export ASC_API_KEY_PATH="$HOME/.private_keys/AuthKey_YOUR_KEY_ID.p8"
```

# check build commands
```sh
cd ios
codesign -dvvv build/extracted/Payload/AlerteSecours.app
codesign --verify --deep --strict --verbose=2 build/extracted/Payload/AlerteSecours.app
xcrun altool --validate-app --type ios --file build/AlerteSecours.ipa --apiKey $ASC_API_KEY_ID --apiIssuer $ASC_API_ISSUER_ID
```

# toolchain
The app (Expo SDK 54 / React Native 0.81) must be built with **Xcode 26.x**. Built with
Xcode 27 it compiles but aborts at launch: the iOS 27 SDK requires the UIScene life cycle,
which this Expo SDK does not adopt. With several Xcode versions installed:
```sh
export DEVELOPER_DIR=/Applications/Xcode-26.6.app/Contents/Developer
```

# release from a machine without an Apple ID in Xcode
`ios-archive.sh` and `ios-export.sh` pass the App Store Connect API key to `xcodebuild`
when `ASC_API_KEY_ID`, `ASC_API_ISSUER_ID` and `ASC_API_KEY_PATH` are set (`.env.prod`), so
certificates and profiles are managed without signing in to Xcode. The key needs the Admin
role for that. `altool` looks for it in `~/.private_keys/AuthKey_<KEY_ID>.p8`.

`ios/AlerteSecours/Supporting/Expo.plist` is generated from `app.config.js` by
`yarn bundle:ios:expo-plist` (part of `yarn bundle:ios:build`, run it once by hand before a
development build on a fresh clone). It needs `keys/certificate.pem` and fails when that
certificate is missing, invalid, expired or different from the one in the Android manifest.

# CI (GitHub Actions)
`.github/workflows/ios-release.yaml` (manual trigger) runs `yarn bundle:ios:build` on a
macOS runner and, when the `upload` input is ticked on a run of the `main` branch,
`yarn bundle:ios:upload`. Its first step fails the job when a secret is missing or when
an upload is requested from another branch; later steps stop it when the development
certificate is no longer valid or when the useful places database has no defibrillators.

Repository secrets:

| secret | content |
| --- | --- |
| `ASC_API_KEY_ID`, `ASC_API_ISSUER_ID` | App Store Connect API key identifiers |
| `ASC_API_KEY_P8` | content of `AuthKey_<KEY_ID>.p8` |
| `IOS_DEV_CERT_P12_B64`, `IOS_DEV_CERT_PASSWORD` | Apple Development certificate + key (base64 `.p12`) used to sign the archive |
| `SENTRY_DSN` | error tracker DSN of `.env.prod` (its URL, organisation and project are public and come from `.env.prod.example`) |
| `SENTRY_AUTH_TOKEN` | token used to upload sourcemaps and dSYMs |
| `IOS_GOOGLE_SERVICE_INFO_PLIST_B64` | base64 of `ios/AlerteSecours/GoogleService-Info.plist`, the copy bundled in the app (`ios/GoogleService-Info.plist` must be identical) |
| `EXPO_UPDATES_CERTIFICATE` | content of `keys/certificate.pem` (public) |

The App Store distribution certificate is cloud-managed: it is used through the API key at
export time and is not stored in the repository secrets. The development certificate
expires after one year and must then be replaced.

# troubleshooting
`pod install` fails with `invalid byte sequence in UTF-8` in its post-install hook when a
previous release left `ios/AlerteSecours.xcarchive` behind: React Native reads every
`Info.plist` under `ios/`, binary ones included. Delete the archive and run it again.
