#!/bin/bash

# Source the .env.prod file
set -a
source .env.prod
set +a

# Print debug information
echo "Debug information:"
echo "Using local app-store signing via exportOptions.plist (method=app-store)"

echo "Available code signing identities (security find-identity -v -p codesigning):"
xcrun security find-identity -v -p codesigning || echo "No code signing identities found or security tool error"

# When an App Store Connect API key is configured, let xcodebuild use it to manage
# signing assets. Needed on machines with no Apple ID signed in to Xcode, CI included.
XCODE_AUTH_ARGS=()
if [ -n "$ASC_API_KEY_ID" ] && [ -n "$ASC_API_ISSUER_ID" ] && [ -f "$ASC_API_KEY_PATH" ]; then
  echo "Using App Store Connect API key $ASC_API_KEY_ID for provisioning"
  XCODE_AUTH_ARGS=(
    -authenticationKeyPath "$ASC_API_KEY_PATH"
    -authenticationKeyID "$ASC_API_KEY_ID"
    -authenticationKeyIssuerID "$ASC_API_ISSUER_ID"
  )
fi

# Execute xcodebuild using automatic signing (Apple Distribution certificate + Xcode-managed profiles)
cd ios && xcodebuild -exportArchive \
    -archivePath AlerteSecours.xcarchive \
    -exportPath ./build \
    -exportOptionsPlist exportOptions.plist \
    -allowProvisioningUpdates \
    "${XCODE_AUTH_ARGS[@]}" \
    -verbose
