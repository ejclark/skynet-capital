# Graphify playbook — navigate & de-risk fast

Graphify turns the repo into a queryable knowledge graph so we answer "where / what-connects / what-
breaks" **without loading files into context**. It's installed in the working env (PyPI `graphifyy`);
the map lives in `graphify-out/` (git-ignored) with a committed snapshot in
[`STRUCTURE-graph.md`](STRUCTURE-graph.md). Code extraction is local (tree-sitter), free, no API key.

## Commands we actually use

| Command | Use it to… | When |
| --- | --- | --- |
| `graphify explain "<Node>"` | see a symbol's neighbors (who calls it, what it calls) | understand one thing fast |
| `graphify affected "<Node>"` | **reverse blast-radius** — what breaks if you change X | **before any refactor/rename** |
| `graphify path "A" "B"` | shortest dependency route between two symbols | "does A actually reach B?" before a cross-cutting feature |
| `graphify query "<question>"` | BFS over the graph for a broad question (use `--budget N`) | map a whole flow (signal→trade) |
| `graphify god-nodes --top N` | the architectural hubs | orient in an unfamiliar area |
| `graphify update .` | re-extract after code changes (free, no API) | **after material changes** — keep the map fresh |
| `graphify watch .` | rebuild on save | long editing sessions |
| `graphify diagnose multigraph` | edge-collapse / quality issues | graph health |

Node names are symbols (`renderIndividualBody()`, `Persona`) or files (`dashboard-server.ts`).

## The workflow (bake this into the ship loop)

1. **Before a cross-cutting change**, `path` or `query` to confirm the data actually flows how you
   assume — cheaper than reading five files and often corrects the plan.
2. **Before a refactor/rename**, `affected "<X>"` to get the exact change surface; verify each.
3. **After the change**, `graphify update .` (free) so the map stays true; refresh
   `STRUCTURE-graph.md` when it's materially different.
4. Prefer a **scoped shell query** (e.g. `python`/`jq` over `graph.json`) or a **subagent** for heavy
   analysis, so intermediate detail never pollutes the working context.

## Worked wins (real, this repo)

- **`affected "Persona"`** → the precise blast radius for the lore work (#79): every persona file +
  `trading-engine` + `bot-registry` + `autonomous-trader` + `load-participants`. No hunting.
- **`path "SauronPersona" "renderIndividual"`** → revealed the `/u/:id` renderer consumes
  `ParticipantSnapshot`, **not** `Persona`. So lore cards must thread persona identity into the data
  model / look it up by `personaId` — the correct approach, found before writing code.
- **`god-nodes`** → the structural core is the trading domain model (`MarketContext`, `OrderIntent`,
  `Persona`, `Portfolio`), which — crucially — are *not* the brand's identity anchors. See
  [`BCP-GRAPHIFY.md`](BCP-GRAPHIFY.md).

## Not used unattended

- **Community naming** via `label`/`cluster-only` calls an external LLM (paid). We name communities
  in-session from membership instead (no key, no spend) — see `STRUCTURE-graph.md`.
- Any `--backend` LLM step (docs/PDF semantic extraction, labeling) needs an API key + spend
  authorization. Code-only work never does.
