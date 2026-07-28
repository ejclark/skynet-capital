#!/usr/bin/env bash
# Provision the Babylon.js MCP server (https://github.com/immersiveidea/babylon-mcp).
# It serves semantic search over Babylon.js docs / API / source on http://localhost:4000/mcp,
# which the repo's .mcp.json points Claude at — so scene work (the /tower Eye, lego pieces)
# is written against accurate Babylon knowledge instead of guesses.
#
# Because MCP servers are loaded at Claude session START and the remote container is ephemeral,
# this is meant to run from the environment's setup-script config (so every fresh session has it),
# or once on a persistent host. It is idempotent: re-running refreshes rather than duplicates.
#
# Usage:  bash scripts/setup-babylon-mcp.sh   [then start a NEW Claude session]
set -euo pipefail

DIR="${BABYLON_MCP_DIR:-$HOME/.babylon-mcp}"
REPO="https://github.com/immersiveidea/babylon-mcp.git"

echo "▸ babylon-mcp → $DIR"
if [ -d "$DIR/.git" ]; then
  git -C "$DIR" pull --ff-only
else
  git clone --depth 1 "$REPO" "$DIR"
fi

cd "$DIR"
npm install
npm run build

# One-time (and refresh) index of the Babylon repos the server searches over.
# Heavy: clones Babylon.js source and builds the local vector index. Safe to re-run.
npm run clone:repos
npm run index:all

# Start the server on :4000 in the background if it isn't already serving.
if curl -sf http://localhost:4000/mcp >/dev/null 2>&1; then
  echo "▸ babylon-mcp already serving on :4000"
else
  echo "▸ starting babylon-mcp on :4000 (logs: $DIR/babylon-mcp.log)"
  nohup npm start >"$DIR/babylon-mcp.log" 2>&1 &
  # give it a moment, then confirm
  for i in $(seq 1 20); do
    sleep 1
    curl -sf http://localhost:4000/mcp >/dev/null 2>&1 && break
  done
  curl -sf http://localhost:4000/mcp >/dev/null 2>&1 \
    && echo "▸ babylon-mcp up ✓  — start a NEW Claude session to load its tools" \
    || { echo "✗ babylon-mcp did not come up; see $DIR/babylon-mcp.log"; exit 1; }
fi
