#!/usr/bin/env bash
# Render the 2.5D morphs of the flat DLS avatar with the Codex CLI (image_gen), for the
# briefs in docs/card-icon-morph.md. Per style × glyph: a day render on pure white with the
# flat avatar as Image 1, then the same object relit on pure black, then each ground keyed
# out and the square resized to 256 → public/return-exp1/ambient/variants/gen_morph-<style>-<glyph>[-dark].png
#
#   scripts/icon-morph/run.sh clay gel            # styles (default: every brief)
#   GLYPHS="flight food" scripts/icon-morph/run.sh   # glyphs (default: flight food — the two live holes)
#   JOBS=4 scripts/icon-morph/run.sh                 # parallel codex jobs
#
# Needs: codex logged in WITH credit (2026-09-24 the workspace was out — a job then fails
# with "Your workspace is out of credits" and still burns ~20k tokens), and an unsandboxed
# shell (codex writes ~/.codex and needs the network). ~2–3 min per render.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(cd "$HERE/../.." && pwd)"
OUT="${OUT:-$HERE/out}"; REF="$HERE/ref"; DEST="$ROOT/public/return-exp1/ambient/variants"
GLYPHS="${GLYPHS:-flight food}"; JOBS="${JOBS:-4}"
STYLES=("$@"); [ ${#STYLES[@]} -gt 0 ] || IFS=$'\n' read -r -d '' -a STYLES < <(node "$HERE/briefs.cjs" list; printf '\0')
mkdir -p "$OUT/out" "$OUT/p"
node "$HERE/refs.cjs" "$REF" >/dev/null
tone() { node -e "const r=require('$HERE/refs.cjs');process.stdout.write(r.TONES['$1']??r.DEFAULT_TONE)"; }

render() { # <name> <image1> <promptfile>  — one codex exec, output at $OUT/out/<name>.png
  local name="$1" img="$2" prompt="$3"
  if [ -s "$OUT/out/$name.png" ]; then echo "have  $name"; return; fi
  echo "start $name"
  codex exec --skip-git-repo-check -C "$OUT" -s workspace-write -i "$img" -o "$OUT/out/$name.last.txt" - < "$prompt" >"$OUT/out/$name.log" 2>&1 || true
  if grep -q "out of credits" "$OUT/out/$name.log"; then echo "CREDIT $name — codex workspace is out of credits"; return 1; fi
  [ -s "$OUT/out/$name.png" ] && echo "done  $name" || { echo "FAIL  $name (see $OUT/out/$name.log)"; return 1; }
}
export -f render; export OUT

# day renders, in parallel
: > "$OUT/day.jobs"
for s in "${STYLES[@]}"; do for g in $GLYPHS; do
  n="morph-$s-$g"; node "$HERE/briefs.cjs" "$s" "$(tone "$g")" "white #FFFFFF" "$n" > "$OUT/p/$n.txt"
  echo "$n $REF/avatar-$g.png $OUT/p/$n.txt" >> "$OUT/day.jobs"
done; done
xargs -P "$JOBS" -L 1 bash -c 'render "$0" "$1" "$2"' < "$OUT/day.jobs"

# night relights, Image 1 = the day render
: > "$OUT/night.jobs"
for s in "${STYLES[@]}"; do for g in $GLYPHS; do
  n="morph-$s-$g"; [ -s "$OUT/out/$n.png" ] || continue
  node "$HERE/briefs.cjs" night "$n-dark" > "$OUT/p/$n-dark.txt"
  echo "$n-dark $OUT/out/$n.png $OUT/p/$n-dark.txt" >> "$OUT/night.jobs"
done; done
xargs -P "$JOBS" -L 1 bash -c 'render "$0" "$1" "$2"' < "$OUT/night.jobs"

# key the grounds out, 256², into the proto
for s in "${STYLES[@]}"; do for g in $GLYPHS; do
  n="morph-$s-$g"
  [ -s "$OUT/out/$n.png" ] && node "$HERE/key.cjs" "$OUT/out/$n.png" "$DEST/gen_$n.png" 255 256
  [ -s "$OUT/out/$n-dark.png" ] && node "$HERE/key.cjs" "$OUT/out/$n-dark.png" "$DEST/gen_$n-dark.png" 0 256
done; done
echo "now: look at every gen_morph-*.png at full size, then add a row per file to GENERATED_ASSETS.md"
