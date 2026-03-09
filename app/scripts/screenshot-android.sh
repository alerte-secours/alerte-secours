#!/usr/bin/env bash
if [ -z "$DEVICE" ]; then
  echo "Error: DEVICE environment variable is not set."
  echo "Usage: DEVICE=emulator-5554 ./screenshot-android.sh"
  exit 1
fi
exec adb -s $DEVICE exec-out screencap -p > screenshot-emulator-$(date +%s).png