#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INFO_PLIST_PATH="$PROJECT_ROOT_DIR/ios/AlerteSecours/Info.plist"

if [ ! -f "$INFO_PLIST_PATH" ]; then
  echo "error: Info.plist not found at $INFO_PLIST_PATH" >&2
  exit 1
fi

# Generate a unique timestamp version/build number in Europe/Paris timezone
# This value will be used for both CFBundleShortVersionString and CFBundleVersion.
# Format: YYYYMMDDHHMM, e.g. 202601121110 (valid as a numeric-only iOS version).
BUILD_NUMBER="$(TZ=Europe/Paris date +%Y%m%d%H%M)"

echo "[ios-set-timestamp-build-number] Using build number: $BUILD_NUMBER"

PLISTBUDDY="/usr/libexec/PlistBuddy"

if [ ! -x "$PLISTBUDDY" ]; then
  echo "error: $PLISTBUDDY not found or not executable. This script must run on macOS with PlistBuddy available." >&2
  exit 1
fi

set_plist_version_key() {
	local key="$1"
	# Try to set the existing key, or add it if it does not exist yet.
	if ! "$PLISTBUDDY" -c "Set :$key $BUILD_NUMBER" "$INFO_PLIST_PATH" 2>/dev/null; then
		"$PLISTBUDDY" -c "Add :$key string $BUILD_NUMBER" "$INFO_PLIST_PATH"
	fi
}

set_plist_version_key "CFBundleVersion"
set_plist_version_key "CFBundleShortVersionString"

echo "[ios-set-timestamp-build-number] Updated CFBundleShortVersionString and CFBundleVersion in $INFO_PLIST_PATH to $BUILD_NUMBER"

# Print the build number on stdout so callers can capture/log it easily.
echo "$BUILD_NUMBER"

