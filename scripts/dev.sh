#!/usr/bin/env bash
set -euo pipefail

# Find the lowest free TCP port starting at 3000.
PORT=3000
while lsof -iTCP:"$PORT" -sTCP:LISTEN -nP >/dev/null 2>&1; do
  PORT=$((PORT + 1))
done

ENV_FILE=".env.local"

# Update or append PORT=<port> in .env.local, preserving other variables.
if [ -f "$ENV_FILE" ]; then
  TMP="$(mktemp)"
  grep -v '^PORT=' "$ENV_FILE" > "$TMP" || true
  printf 'PORT=%s\n' "$PORT" >> "$TMP"
  mv "$TMP" "$ENV_FILE"
else
  printf 'PORT=%s\n' "$PORT" > "$ENV_FILE"
fi

echo "🚀 Starting dev server on port $PORT"

export PORT
exec npm run dev
