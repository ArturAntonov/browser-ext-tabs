#!/bin/sh
# Отрисовка PNG-иконок из SVG через headless Chrome. Каждый рендер — в своём временном профиле,
# чтобы не трогать основной профиль и не ждать зависший процесс.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"

render() { # svg size out
  tmp="$(mktemp -d)"
  html="$tmp/icon.html"
  rm -f "$3"
  printf '<html><body style="margin:0;background:transparent"><img src="file://%s" width="%s" height="%s"></body></html>' "$1" "$2" "$2" > "$html"
  "$CHROME" --headless --disable-gpu --hide-scrollbars --no-first-run --user-data-dir="$tmp/profile" \
    --default-background-color=00000000 --window-size="$2,$2" --screenshot="$3" "file://$html" >/dev/null 2>&1 &
  pid=$!
  i=0
  while [ ! -s "$3" ] && [ $i -lt 30 ]; do sleep 0.5; i=$((i + 1)); done
  sleep 0.5
  kill $pid 2>/dev/null || true
  wait $pid 2>/dev/null || true
  rm -rf "$tmp"
  [ -s "$3" ] || { echo "не удалось отрисовать $3" >&2; exit 1; }
}

for s in 16 32; do render "$ROOT/assets/icon-small.svg" $s "$ROOT/extension/icons/icon-$s.png"; done
for s in 48 128; do render "$ROOT/assets/icon.svg" $s "$ROOT/extension/icons/icon-$s.png"; done
# Иконки для карточки в каталоге — вне папки расширения (Opera не принимает неиспользуемые файлы).
render "$ROOT/assets/icon.svg" 64 "$ROOT/store/icon-64.png"
cp "$ROOT/extension/icons/icon-128.png" "$ROOT/store/icon-128.png"
ls -l "$ROOT/extension/icons" "$ROOT/store"
