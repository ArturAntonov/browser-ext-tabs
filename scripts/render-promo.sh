#!/bin/sh
# Промо-картинка для каталога из assets/promo.html через headless Chrome.
# Использование: scripts/render-promo.sh [ширина] [высота]  (по умолчанию 300 188)
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
W="${1:-300}"; H="${2:-188}"
OUT="$ROOT/store/promo-${W}x${H}.png"
tmp="$(mktemp -d)"
rm -f "$OUT"
"$CHROME" --headless --disable-gpu --hide-scrollbars --no-first-run --user-data-dir="$tmp/profile" \
  --allow-file-access-from-files --force-device-scale-factor=1 --window-size="$W,$H" \
  --virtual-time-budget=2000 --screenshot="$OUT" "file://$ROOT/assets/promo.html?w=$W&h=$H" >/dev/null 2>&1 &
pid=$!
i=0
while [ ! -s "$OUT" ] && [ $i -lt 30 ]; do sleep 0.5; i=$((i + 1)); done
sleep 0.5
kill $pid 2>/dev/null || true
wait $pid 2>/dev/null || true
rm -rf "$tmp" 2>/dev/null || true
[ -s "$OUT" ] || { echo "не удалось отрисовать $OUT" >&2; exit 1; }
file "$OUT"
