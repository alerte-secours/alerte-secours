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

# xcodebuild authentication options (App Store Connect API key), resolved from the app root.
source "$(dirname "${BASH_SOURCE[0]}")/ios-xcode-auth-args.sh"

# Execute xcodebuild using automatic signing (Apple Distribution certificate + Xcode-managed profiles)
cd ios && xcodebuild -exportArchive \
    -archivePath AlerteSecours.xcarchive \
    -exportPath ./build \
    -exportOptionsPlist exportOptions.plist \
    -allowProvisioningUpdates \
    "${XCODE_AUTH_ARGS[@]}" \
    -verbose
