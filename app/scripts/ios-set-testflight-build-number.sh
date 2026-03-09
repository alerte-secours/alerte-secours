#!/usr/bin/env bash

set -euo pipefail

# Backward compatible wrapper.
# Historically this script was TestFlight-specific, but iOS builds now use the same
# timestamp versioning for all distribution bundles.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

exec "$SCRIPT_DIR/ios-set-timestamp-build-number.sh"
