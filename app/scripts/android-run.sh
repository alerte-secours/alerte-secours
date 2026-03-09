#!/usr/bin/env bash
# Smart android runner for Expo dev client with ABI flavors.
# DEVICE env var selects the target explicitly (no autodetect).
# - If DEVICE equals "emulator" or starts with "emulator-"  => emulator (x86_64)
# - Otherwise                                               => USB device (arm64-v8a)
#
# Examples:
#   DEVICE=emulator-5554 yarn android
#   DEVICE=emulator       yarn android
#   DEVICE=45290DLAQ000DG yarn android
#   DEVICE=device         yarn android   # (will not set ANDROID_SERIAL)
#
# Overrides:
#   EXPO_ANDROID_GRADLE_ARGS  # pass additional Gradle args (preserves ABI defaults)
#   EXTRA_ARGS                # extra args forwarded to `expo run:android`
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v adb >/dev/null 2>&1; then
  echo "adb not found in PATH. Please install Android platform-tools." >&2
  exit 1
fi

if [[ -z "${DEVICE:-}" ]]; then
  cat >&2 <<EOF
DEVICE environment variable is required (no autodetect).

Usage examples:
  DEVICE=emulator-5554 yarn android
  DEVICE=emulator       yarn android
  DEVICE=45290DLAQ000DG yarn android
  DEVICE=device         yarn android

Tip: set DEVICE to a serial (e.g., emulator-5554 or a USB serial) to also export ANDROID_SERIAL
so Gradle/adb target that device explicitly when multiple devices are connected.
EOF
  exit 1
fi

EXTRA_ARGS="${EXTRA_ARGS:-}"
LOWER_DEVICE="$(echo "$DEVICE" | tr '[:upper:]' '[:lower:]')"

# Determine target kind
if [[ "$LOWER_DEVICE" == "emulator" || "$DEVICE" =~ ^emulator- ]]; then
  TARGET_KIND="emulator"
else
  TARGET_KIND="device"
fi

# If DEVICE looks like an adb serial (not the generic tokens), export ANDROID_SERIAL
if [[ "$LOWER_DEVICE" != "emulator" && "$LOWER_DEVICE" != "device" ]]; then
  export ANDROID_SERIAL="$DEVICE"
fi

# Ensure expo CLI is available
if ! command -v expo >/dev/null 2>&1; then
  echo "expo CLI not found. Using npx expo ..." >&2
  USE_NPX=1
else
  USE_NPX=0
fi

if [[ "$TARGET_KIND" == "emulator" ]]; then
  # x86_64 ABI for emulator
  export EXPO_ANDROID_GRADLE_ARGS="${EXPO_ANDROID_GRADLE_ARGS:- -PreactNativeArchitectures=x86_64}"
  echo "Target: Emulator (DEVICE=${DEVICE})"
  echo "Gradle args: ${EXPO_ANDROID_GRADLE_ARGS}"
  echo "Variant   : emulatorX86_64Debug"
  if [[ "$USE_NPX" -eq 1 ]]; then
    exec npx expo run:android --variant emulatorX86_64Debug ${EXTRA_ARGS}
  else
    exec expo run:android --variant emulatorX86_64Debug ${EXTRA_ARGS}
  fi
fi

# USB device (arm64-v8a)
export EXPO_ANDROID_GRADLE_ARGS="${EXPO_ANDROID_GRADLE_ARGS:- -PreactNativeArchitectures=arm64-v8a}"
echo "Target: USB Device (DEVICE=${DEVICE})"
echo "Gradle args: ${EXPO_ANDROID_GRADLE_ARGS}"
echo "Variant   : deviceArm64Debug"
if [[ "$USE_NPX" -eq 1 ]]; then
  exec npx expo run:android --variant deviceArm64Debug ${EXTRA_ARGS}
else
  exec expo run:android --variant deviceArm64Debug ${EXTRA_ARGS}
fi
