#!/bin/bash

set -e

set -a
source .env.prod
set +a

# Export build time for consistent release naming
export BUILD_TIME=$(date +%s000)

# Clean previous bundle
echo "Cleaning previous bundle..."
rm -f ios/main.jsbundle*
echo "Cleaning previous archive and stale IPA..."
# Keep ios/build because RN 0.79+ stores codegen headers in ios/build/generated/ios needed for archive.
rm -rf ios/AlerteSecours.xcarchive || true
rm -f ios/build/AlerteSecours.ipa || true

# Get version from Info.plist for release naming
BUNDLE_VERSION=$(/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" ios/AlerteSecours/Info.plist)
PACKAGE_VERSION=$(/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" ios/AlerteSecours/Info.plist)
RELEASE_NAME="com.alertesecours.alertesecours@${PACKAGE_VERSION}+${BUNDLE_VERSION}"

# Generate the bundle and sourcemap
echo "Generating bundle and sourcemap..."
export METRO_DISABLE_FILE_WATCHER=${METRO_DISABLE_FILE_WATCHER:-1}
export CI=${CI:-1}
ulimit -n 4096 2>/dev/null || true
yarn react-native bundle \
  --platform ios \
  --dev false \
  --entry-file index.js \
  --bundle-output ios/main.jsbundle \
  --sourcemap-output ios/main.jsbundle.map \
  --minify true

# Get path to hermesc binary
HERMESC="node_modules/react-native/sdks/hermesc/osx-bin/hermesc"
if [ ! -f "$HERMESC" ]; then
  HERMESC="node_modules/react-native/sdks/hermes/build/bin/hermesc"
fi

# Convert to Hermes bytecode
echo "Converting to Hermes bytecode..."
"$HERMESC" \
  -O \
  -emit-binary \
  -output-source-map \
  -out=ios/main.jsbundle.hbc \
  -g \
  ios/main.jsbundle

# Create Sentry release and upload source maps
if [ -n "$SENTRY_AUTH_TOKEN" ]; then
  echo "Creating Sentry release and uploading artifacts..."
  
  # Create new release
  npx @sentry/cli releases new "$RELEASE_NAME"
  
  # Upload the sourcemap
  npx @sentry/cli releases files "$RELEASE_NAME" \
    upload-sourcemaps \
    --dist "$BUILD_TIME" \
    --rewrite \
    --strip-prefix "$(pwd)" \
    --url-prefix "app:///" \
    --validate \
    --log-level debug \
    ios/main.jsbundle.map \
    ios/main.jsbundle

  # Upload the Hermes bundle and its sourcemap
  npx @sentry/cli releases files "$RELEASE_NAME" \
    upload-sourcemaps \
    --dist "$BUILD_TIME" \
    --rewrite \
    --strip-prefix "$(pwd)" \
    --url-prefix "app:///" \
    --validate \
    --log-level debug \
    ios/main.jsbundle.hbc.map \
    ios/main.jsbundle.hbc
    
  # Finalize release
  npx @sentry/cli releases finalize "$RELEASE_NAME"
else
  echo "Warning: SENTRY_AUTH_TOKEN not set. Skipping sourcemap upload."
fi

# Move the Hermes bundle to the final location
mv ios/main.jsbundle.hbc ios/main.jsbundle

cd ios

# Ensure RN codegen headers path exists
mkdir -p build/generated/ios

# Create logs directory if it doesn't exist
mkdir -p ../logs

# Create archive using xcodebuild
echo "Creating archive..."
xcodebuild \
  -workspace AlerteSecours.xcworkspace \
  -scheme AlerteSecours \
  -configuration Release \
  -archivePath AlerteSecours.xcarchive \
  archive 2>&1 | tee "../logs/ios-archive-$(date +%Y%m%d-%H%M%S).log"

# Verify archive version matches source Info.plist
echo "Verifying archive version matches source Info.plist..."
ARCHIVE_PLIST="AlerteSecours.xcarchive/Products/Applications/AlerteSecours.app/Info.plist"
ARCHIVE_PKG_VERSION=$(/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" "$ARCHIVE_PLIST")
ARCHIVE_BUNDLE_VERSION=$(/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" "$ARCHIVE_PLIST")
echo "Source: ${PACKAGE_VERSION} (${BUNDLE_VERSION}) | Archive: ${ARCHIVE_PKG_VERSION} (${ARCHIVE_BUNDLE_VERSION})"
if [ "$PACKAGE_VERSION" != "$ARCHIVE_PKG_VERSION" ] || [ "$BUNDLE_VERSION" != "$ARCHIVE_BUNDLE_VERSION" ]; then
  echo "Error: Archive version mismatch. Expected ${PACKAGE_VERSION} (${BUNDLE_VERSION}), got ${ARCHIVE_PKG_VERSION} (${ARCHIVE_BUNDLE_VERSION})."
  exit 1
fi

echo "Archive completed successfully at AlerteSecours.xcarchive"
