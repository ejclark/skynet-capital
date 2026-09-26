# Graphify structural map

**Technology:** graphifyy (PyPI, tree-sitter code extraction, no LLM), bash wrapper

**Responsibility:** Regenerates docs/STRUCTURE-graph.md from graphify-out/ on demand; navigation via graphify explain/affected/path/query; refresh is manual and the doc-rot eye watches the snapshot age

**Code roots:** `scripts/refresh-graph.sh` · `docs/STRUCTURE-graph.md` · `docs/GRAPHIFY.md` · `docs/BCP-GRAPHIFY.md`

**Entrypoints:** `npm run graph:refresh`

**Grounding:** scripts/refresh-graph.sh; docs/GRAPHIFY.md 'The committed snapshot is refreshed by hand'

**Refuter's verdict:** grounded — Optional wording tweaks: - Say "re-extracts the repo into graphify-out/ (git-ignored), then copies GRAPH_REPORT.md into docs/STRUCTURE-graph.md". - Name the entry point: `npm run graph:refresh`. - Name the watcher: scrip

## Where it sits

| From | To | What | How | Refuter |
|---|---|---|---|---|
| session | graphify | Refreshes the structural map | npm run graph:refresh | grounded — Suggest the label "Refreshes structural map manually (npm run graph:refresh → graphify extract/cluster-only, AST-only, writes docs/STRUCTURE-graph.md)". Do not draw an automated or CI edge. No auto-refresh workflow exist |
