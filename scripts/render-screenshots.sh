#!/bin/sh
# Скриншоты для каталогов из dev/store-shot*.html через headless Chrome.
# Нужен запущенный сервер превью: npm run preview (порт 8765).
#   scripts/render-screenshots.sh          — Opera Add-ons, 612×408 → store/screenshots/
#   scripts/render-screenshots.sh chrome   — Chrome Web Store, 1280×800, русские и английские → store/chrome/screenshots/{ru,en}/
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
HOST="${HOST:-http://localhost:8765/dev}"

shot() { # page query width height out
  tmp="$(mktemp -d)"
  rm -f "$5"
  "$CHROME" --headless --disable-gpu --hide-scrollbars --no-first-run --user-data-dir="$tmp/profile" \
    --force-device-scale-factor=1 --window-size="$3,$4" --virtual-time-budget=4000 \
    --screenshot="$5" "$HOST/$1?$2" >/dev/null 2>&1 &
  pid=$!
  i=0
  while [ ! -s "$5" ] && [ $i -lt 40 ]; do sleep 0.5; i=$((i + 1)); done
  sleep 0.5
  kill $pid 2>/dev/null || true
  wait $pid 2>/dev/null || true
  rm -rf "$tmp" 2>/dev/null || true
  [ -s "$5" ] || { echo "не удалось снять $5" >&2; exit 1; }
}

if [ "${1:-opera}" = "chrome" ]; then
  for lang in ru en; do
    OUT="$ROOT/store/chrome/screenshots/$lang"
    mkdir -p "$OUT"
    shot store-shot-chrome.html "shot=1&lang=$lang" 1280 800 "$OUT/1-search.png"
    shot store-shot-chrome.html "shot=2&lang=$lang" 1280 800 "$OUT/2-recent-first.png"
    shot store-shot-chrome.html "shot=3&lang=$lang" 1280 800 "$OUT/3-same-titles.png"
    shot store-shot-chrome.html "shot=4&lang=$lang" 1280 800 "$OUT/4-go-back.png"
    shot store-shot-chrome.html "shot=5&lang=$lang" 1280 800 "$OUT/5-private.png"
    ls -l "$OUT"
  done
else
  OUT="$ROOT/store/screenshots"
  shot store-shot.html "back=4" 612 408 "$OUT/1-current-group.png"
  shot store-shot.html "q=github" 612 408 "$OUT/2-search-all-groups.png"
  ls -l "$OUT"
fi
