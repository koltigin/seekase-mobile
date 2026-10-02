#!/bin/bash
set -euo pipefail
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ADB="${ADB_PATH:-${ANDROID_HOME:-${HOME}/Library/Android/sdk}/platform-tools/adb}"
SERIAL="${ANDROID_SERIAL:?Set ANDROID_SERIAL to the connected physical Android device serial}"
OUT="$PROJECT_ROOT/.mwa-test"
mkdir -p "$OUT"

"$ADB" -s "$SERIAL" devices > "$OUT/devices.txt"
"$ADB" -s "$SERIAL" reverse tcp:8081 tcp:8081 >> "$OUT/devices.txt" 2>&1 || true
"$ADB" -s "$SERIAL" shell dumpsys activity activities | grep -E 'topResumedActivity|mResumedActivity' | head -5 > "$OUT/activity-before.txt" || true
"$ADB" -s "$SERIAL" exec-out screencap -p > "$OUT/before.png" || true
"$ADB" -s "$SERIAL" shell uiautomator dump /sdcard/ui.xml || true
"$ADB" -s "$SERIAL" pull /sdcard/ui.xml "$OUT/ui-before.xml" || true
echo DONE
