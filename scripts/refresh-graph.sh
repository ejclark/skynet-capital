#!/usr/bin/env bash
# Refresh the committed Graphify structural map from the current code.
#
# Graphify's live outputs live in graphify-out/ (git-ignored); this script regenerates them from the
# AST (free, no LLM / no API key) and copies the report into the committed docs/STRUCTURE-graph.md with
# a stable header. Refresh is MANUAL (`npm run graph:refresh`) — no auto-refresh workflow exists:
# CI cannot push to protected `main` (GH006, see docs/ENGINEERING.md → Releases), so the header's
# old claim of a graph-refresh.yml was aspirational and false (caught 2026-08-28 when the map had
# silently drifted 149→193 communities). The doc-rot gate watches the snapshot's age instead.
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
     Regenerate: `npm run graph:refresh` (free, no API). Refresh is MANUAL — run it after material
     code changes; the doc-rot gate watches this snapshot's age. The live graph lives in
     graphify-out/ (git-ignored). -->

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
