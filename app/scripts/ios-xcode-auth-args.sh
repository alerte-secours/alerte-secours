#!/bin/bash
# Sourced by ios-archive.sh and ios-export.sh, from the app root, once .env.prod is loaded.
#
# Sets XCODE_AUTH_ARGS to the xcodebuild options that authenticate with the App Store
# Connect API key, so signing assets can be managed on a machine with no Apple ID signed
# in to Xcode (CI included). Left empty when no key is configured: signing then relies on
# the local Xcode account, as before.

XCODE_AUTH_ARGS=()

if [ -n "$ASC_API_KEY_ID" ] && [ -n "$ASC_API_ISSUER_ID" ] && [ -n "$ASC_API_KEY_PATH" ]; then
  # Resolve the path here: the callers `cd ios` before running xcodebuild.
  asc_api_key_file="$ASC_API_KEY_PATH"
  case "$asc_api_key_file" in
    "~/"*) asc_api_key_file="$HOME/${asc_api_key_file#\~/}" ;;
  esac
  case "$asc_api_key_file" in
    /*) ;;
    *) asc_api_key_file="$PWD/$asc_api_key_file" ;;
  esac

  if [ -f "$asc_api_key_file" ]; then
    echo "Using App Store Connect API key $ASC_API_KEY_ID for provisioning"
    XCODE_AUTH_ARGS=(
      -authenticationKeyPath "$asc_api_key_file"
      -authenticationKeyID "$ASC_API_KEY_ID"
      -authenticationKeyIssuerID "$ASC_API_ISSUER_ID"
    )
  else
    echo "Warning: ASC_API_KEY_PATH does not point to a file ($ASC_API_KEY_PATH)." >&2
    echo "Warning: signing falls back to the identities of the local Xcode account." >&2
  fi
fi
