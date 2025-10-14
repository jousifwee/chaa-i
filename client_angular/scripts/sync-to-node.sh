#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLIENT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$CLIENT_ROOT/.." && pwd)"

DIST_PATH="$CLIENT_ROOT/dist/chaa-i-client-angular"
TARGET_PATH="$REPO_ROOT/server/public/app/angular"

if [[ ! -d "$DIST_PATH" ]]; then
  echo "Build-Verzeichnis '$DIST_PATH' nicht gefunden. Bitte zuerst 'npm run build' ausführen." >&2
  exit 1
fi

rm -rf "$TARGET_PATH"
mkdir -p "$TARGET_PATH"
cp -R "$DIST_PATH"/. "$TARGET_PATH"

echo "Angular-Build nach $TARGET_PATH kopiert."
