#!/bin/bash

# Source the environment variables
set -a
source .env.prod
set +a

# Print debug information
echo "Debug information:"
echo "ASC_API_KEY_ID: $ASC_API_KEY_ID"
echo "ASC_API_ISSUER_ID: $ASC_API_ISSUER_ID"
echo "ASC_API_KEY_PATH: $ASC_API_KEY_PATH"

# Verify versions before upload to prevent stale IPA submission
SOURCE_PLIST="ios/AlerteSecours/Info.plist"
ARCHIVE_PLIST="ios/AlerteSecours.xcarchive/Products/Applications/AlerteSecours.app/Info.plist"
IPA_PATH="ios/build/AlerteSecours.ipa"

if [ ! -f "$SOURCE_PLIST" ]; then
  echo "Error: Source Info.plist not found at $SOURCE_PLIST"
  exit 1
fi

if [ ! -f "$ARCHIVE_PLIST" ]; then
  echo "Error: Archive Info.plist not found at $ARCHIVE_PLIST"
  echo "Hint: Run 'yarn bundle:ios' to create a fresh archive and export."
  exit 1
fi

SRC_PKG_VERSION=$(/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" "$SOURCE_PLIST")
SRC_BUILD_NUMBER=$(/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" "$SOURCE_PLIST")
ARC_PKG_VERSION=$(/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" "$ARCHIVE_PLIST")
ARC_BUILD_NUMBER=$(/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" "$ARCHIVE_PLIST")

echo "Version check:"
echo "  Source Info.plist        : $SRC_PKG_VERSION ($SRC_BUILD_NUMBER)"
echo "  Archive Info.plist       : $ARC_PKG_VERSION ($ARC_BUILD_NUMBER)"

if [ "$SRC_PKG_VERSION" != "$ARC_PKG_VERSION" ] || [ "$SRC_BUILD_NUMBER" != "$ARC_BUILD_NUMBER" ]; then
  echo "Error: Archive version mismatch with source Info.plist."
  echo "Hint: Run 'yarn bundle:ios' to rebuild with the correct versions."
  exit 1
fi

if [ ! -f "$IPA_PATH" ]; then
  echo "Error: IPA not found at $IPA_PATH"
  echo "Hint: Run 'yarn bundle:ios' to export a fresh IPA."
  exit 1
fi

# Attempt to read CFBundleShortVersionString and CFBundleVersion from the IPA for extra safety
IPA_PLIST_TMP=$(mktemp -t as_ipa_Info.plist)
unzip -p "$IPA_PATH" "Payload/AlerteSecours.app/Info.plist" > "$IPA_PLIST_TMP" 2>/dev/null || true

  if [ -s "$IPA_PLIST_TMP" ]; then
    IPA_PKG_VERSION=$(/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" "$IPA_PLIST_TMP" 2>/dev/null || echo "")
    IPA_BUILD_NUMBER=$(/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" "$IPA_PLIST_TMP" 2>/dev/null || echo "")
    echo "  IPA Info.plist (from payload): ${IPA_PKG_VERSION:-unknown} (${IPA_BUILD_NUMBER:-unknown})"
    if [ -n "$IPA_PKG_VERSION" ] && [ -n "$IPA_BUILD_NUMBER" ]; then
      # Enforce that CFBundleShortVersionString matches exactly between source and IPA.
      if [ "$SRC_PKG_VERSION" != "$IPA_PKG_VERSION" ]; then
        echo "Error: IPA CFBundleShortVersionString mismatch with source Info.plist."
        echo "Hint: Run 'yarn bundle:ios' to export a fresh IPA aligned with current versions."
        rm -f "$IPA_PLIST_TMP"
        exit 1
      fi

      # Allow IPA CFBundleVersion to be greater than or equal to the source
      # (Xcode may auto-increment it), but reject if it is lower, which
      # indicates a stale IPA.
      if [ "$IPA_BUILD_NUMBER" -lt "$SRC_BUILD_NUMBER" ]; then
        echo "Error: IPA CFBundleVersion ($IPA_BUILD_NUMBER) is lower than source build number ($SRC_BUILD_NUMBER)."
        echo "Hint: Run 'yarn bundle:ios' to export a fresh IPA aligned with current versions."
        rm -f "$IPA_PLIST_TMP"
        exit 1
      fi
    fi
  else
  echo "Warning: Could not read Info.plist from IPA payload for verification. Continuing."
fi
rm -f "$IPA_PLIST_TMP"

# Execute upload using xcrun altool with App Store Connect API key
echo "Uploading to App Store Connect using xcrun altool..."

# Use altool with API key authentication
xcrun altool --upload-app \
  --type ios \
  --file "$IPA_PATH" \
  --apiKey "$ASC_API_KEY_ID" \
  --apiIssuer "$ASC_API_ISSUER_ID" \
  --verbose

if [ $? -eq 0 ]; then
  echo "✅ Successfully uploaded IPA to App Store Connect!"
  echo "The build will be available in TestFlight once processing is complete."
else
  echo "❌ Upload failed. Check the error messages above."
  exit 1
fi
