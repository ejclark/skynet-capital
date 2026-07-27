#!/usr/bin/env bash
# Refresh the committed Graphify structural map from the current code.
#
# Graphify's live outputs live in graphify-out/ (git-ignored); this script regenerates them from the
# AST (free, no LLM / no API key) and copies the report into the committed docs/STRUCTURE-graph.md with
# a stable header. Run manually via `npm run graph:refresh`, or automatically on push to main via
# .github/workflows/graph-refresh.yml — so the map stops drifting from the code.
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v graphify >/dev/null 2>&1; then
  echo "graphify not found — install with: uv tool install graphifyy  (or: pipx install graphifyy)" >&2
  exit 1
fi

echo "[graph:refresh] extracting (code-only, no LLM)…"
graphify extract . --code-only
echo "[graph:refresh] clustering…"
graphify cluster-only .

OUT="docs/STRUCTURE-graph.md"
{
  cat <<'HEADER'
<!-- AUTO-GENERATED — do not hand-edit below the marker.
     Regenerate: `npm run graph:refresh` (free, no API). Kept fresh automatically on push to main
     by .github/workflows/graph-refresh.yml. The live graph lives in graphify-out/ (git-ignored). -->

# Structural map (Graphify)

The repo's **code** as a knowledge graph — the durable, navigable structure view, generated from the
AST. This is the *code-dependency* lens ("how is it wired / what breaks if I change X"), distinct from
the *product/systems* lens ("what exists, how mature, where to aim"). To navigate live, use
`graphify explain/path/query` — see the playbook in [`GRAPHIFY.md`](GRAPHIFY.md).

<!-- BEGIN GENERATED REPORT -->

HEADER
  cat graphify-out/GRAPH_REPORT.md
} > "$OUT"

echo "[graph:refresh] wrote $OUT"
