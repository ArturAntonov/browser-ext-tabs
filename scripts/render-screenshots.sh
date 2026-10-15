#!/bin/sh
# Скриншоты 612×408 для Opera Add-ons из dev/store-shot.html через headless Chrome.
# Нужен запущенный сервер превью: npm run preview (порт 8765).
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
BASE="${BASE:-http://localhost:8765/dev/store-shot.html}"

shot() { # query out
  tmp="$(mktemp -d)"
  rm -f "$2"
  "$CHROME" --headless --disable-gpu --hide-scrollbars --no-first-run --user-data-dir="$tmp/profile" \
    --force-device-scale-factor=1 --window-size=612,408 --virtual-time-budget=4000 \
    --screenshot="$2" "$BASE?$1" >/dev/null 2>&1 &
  pid=$!
  i=0
  while [ ! -s "$2" ] && [ $i -lt 40 ]; do sleep 0.5; i=$((i + 1)); done
  sleep 0.5
  kill $pid 2>/dev/null || true
  wait $pid 2>/dev/null || true
  rm -rf "$tmp"
  [ -s "$2" ] || { echo "не удалось снять $2" >&2; exit 1; }
}

shot "back=4" "$ROOT/store/screenshots/1-current-group.png"
shot "q=github" "$ROOT/store/screenshots/2-search-all-groups.png"
ls -l "$ROOT/store/screenshots"
