#!/bin/bash
# Ensure useful-places.db exists and is less than 24 hours old.
# If missing, empty, or stale → rebuild via the useful-places pipeline.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DB_FILE="$APP_DIR/src/assets/db/useful-places.db"

MAX_AGE_MIN=1440 # 24 hours

if [ -s "$DB_FILE" ] && [ -n "$(find "$DB_FILE" -mmin -$MAX_AGE_MIN 2>/dev/null)" ]; then
  echo "[useful-places] DB is fresh (< 24h old), skipping rebuild."
  exit 0
fi

if [ ! -f "$DB_FILE" ]; then
  echo "[useful-places] DB not found, building..."
elif [ ! -s "$DB_FILE" ]; then
  echo "[useful-places] DB is empty, rebuilding..."
else
  echo "[useful-places] DB is stale (> 24h old), rebuilding..."
fi

cd "$APP_DIR"
yarn useful-places:build
