#!/usr/bin/env bash
set -euo pipefail

# Root of repo
ROOT_DIR="$(cd "$(dirname "$0")/.."; pwd)"

# Allow passing an explicit AAB path as first arg, otherwise auto-detect latest
AAB_PATH="${1:-}"
if [ -z "$AAB_PATH" ]; then
  AAB_PATH="$("$ROOT_DIR/scripts/find-latest-aab.sh")"
fi

if [ ! -f "$AAB_PATH" ]; then
  echo "AAB not found: $AAB_PATH" >&2
  exit 1
fi

# Configurable via env, with sensible defaults
JSON_KEY_PATH="${GOOGLE_JSON_KEY_PATH:-keys/alerte-secours-449609-469f820e5960.json}"
PACKAGE_NAME="${PACKAGE_NAME:-com.alertesecours}"
TRACK="${TRACK:-internal}"

echo "Uploading AAB:"
echo "  File:          $AAB_PATH"
echo "  Package:       $PACKAGE_NAME"
echo "  Track:         $TRACK"
echo "  Service acct:  $JSON_KEY_PATH"

exec fastlane supply \
  --aab "$AAB_PATH" \
  --track "$TRACK" \
  -j "$JSON_KEY_PATH" \
  -p "$PACKAGE_NAME"
