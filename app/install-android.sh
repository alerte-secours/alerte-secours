#!/usr/bin/env bash
set -euo pipefail

# Repo root (this script lives at repo root)
ROOT_DIR="$(cd "$(dirname "$0")"; pwd)"

# Auto-pick a single target device if DEVICE not provided
DEVICE="${DEVICE:-}"
if [ -z "$DEVICE" ]; then
  EMU=$(adb devices | awk '/^emulator-/{print $1}' | head -n1)
  USB=$(adb devices -l | awk '/ device usb:/{print $1}' | head -n1)
  if [ -n "$EMU" ] && [ -z "$USB" ]; then DEVICE="$EMU"; fi
  if [ -n "$USB" ] && [ -z "$EMU" ]; then DEVICE="$USB"; fi
fi

if [ -z "$DEVICE" ]; then
  echo "Error: DEVICE not set and could not auto-detect a single target." >&2
  echo "Usage: DEVICE=<adb-serial> ./install-android.sh [AAB_PATH]" >&2
  exit 1
fi

# Optional first arg: override AAB path, otherwise auto-detect newest release AAB
AAB_PATH="${1:-}"
if [ -z "$AAB_PATH" ]; then
  AAB_PATH="$("$ROOT_DIR/scripts/find-latest-aab.sh")"
fi

if [ ! -f "$AAB_PATH" ]; then
  echo "AAB not found: $AAB_PATH" >&2
  exit 1
fi

# Bundletool path (override with BUNDLETOOL=/path/to/bundletool.jar)
BUNDLETOOL="${BUNDLETOOL:-/opt/bundletool-all-1.17.1.jar}"

# Temp output dir
OUT_DIR="$(mktemp -d)"
APKS_PATH="$OUT_DIR/app.apks"

echo "Target device: $DEVICE"
echo "Using AAB:     $AAB_PATH"
echo "Bundletool:    $BUNDLETOOL"

# Default: generate APKs optimized for the connected device.
# Set CONNECTED_DEVICE=0 to force universal APK generation/install.
if [ "${CONNECTED_DEVICE:-1}" = "1" ]; then
  echo "Building device-optimized APKs for connected device..."
  java -jar "$BUNDLETOOL" build-apks \
    --connected-device \
    --bundle "$AAB_PATH" \
    --output "$APKS_PATH" \
    --ks "$ROOT_DIR/android/app/debug.keystore" \
    --ks-pass pass:android \
    --ks-key-alias androiddebugkey \
    --key-pass pass:android

  echo "Installing APKs to $DEVICE..."
  java -jar "$BUNDLETOOL" install-apks --device-id "$DEVICE" --apks "$APKS_PATH"
else
  echo "Building universal APK..."
  java -jar "$BUNDLETOOL" build-apks \
    --mode universal \
    --bundle "$AAB_PATH" \
    --output "$APKS_PATH" \
    --ks "$ROOT_DIR/android/app/debug.keystore" \
    --ks-pass pass:android \
    --ks-key-alias androiddebugkey \
    --key-pass pass:android

  echo "Extracting and installing universal APK..."
  unzip -o "$APKS_PATH" -d "$OUT_DIR" >/dev/null
  adb -s "$DEVICE" install -r "$OUT_DIR/universal.apk"
fi

echo "Installation complete on $DEVICE"
