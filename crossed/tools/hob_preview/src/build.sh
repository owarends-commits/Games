#!/bin/sh
# Assembles the Hob animation preview into one page: ../index.html
# Run from anywhere:  sh crossed/tools/hob_preview/src/build.sh
D=$(cd "$(dirname "$0")" && pwd)
{
  printf '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
  cat "$D/head.html"
  cat "$D/scene.js" "$D/engine.js" "$D/hob.js" "$D/run.js"
  printf '\n</script>\n</body></html>\n'
} > "$D/../index.html"
echo "wrote $D/../index.html"
