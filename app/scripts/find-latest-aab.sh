#!/usr/bin/env bash
set -euo pipefail

# Always operate from repo root
ROOT_DIR="$(cd "$(dirname "$0")/.."; pwd)"
cd "$ROOT_DIR"

# Try to find the most recent release AAB regardless of variant (deviceArm64Release, emulatorX86_64Release, universalRelease, etc.)
set +e
LATEST=$(ls -t android/app/build/outputs/bundle/*Release/app-*-release.aab 2>/dev/null | head -n1)
set -e

if [ -z "${LATEST:-}" ]; then
  echo "No AABs found under android/app/build/outputs/bundle/*Release" >&2
  echo "Hint: run: ./gradlew :app:bundleDeviceArm64Release (or your desired variant)" >&2
  exit 1
fi

echo "$LATEST"
