# Mermaid reference cards — one per diagram type

Distilled from mermaid.js.org (each page read in full) on 2026-09-25 and validated example by
example. Open ONE card when drawing; the entry page is `../SKILL.md`. GitHub renders Mermaid
11.17.2 — the "validated" columns come from the Mermaid Chart validator, which runs an older
Mermaid than GitHub, so a ✗ on an 11.17 feature can be a false red; `npm run mermaid:lint` is the
oracle.

| Card | Keyword | Status | minimal / rich validated | First fit here |
|---|---|---|---|---|
| [flowchart](flowchart.md) | `flowchart TD` | stable | ✓ / ✓ | PR-body opening picture (the fridge rule) for any dataflow, pipeline or CI change: ship.sh |
| [sequencediagram](sequencediagram.md) | `sequenceDiagram` | stable | ✓ / ✓ | PICTURES.md row 'New route / request path': any PR adding or changing an HTTP/SSE route (s |
| [statediagram](statediagram.md) | `stateDiagram-v2` | stable | ✓ / ✓ | PR landing path (the ship/pipeline scene): verify, then e2e, then a choice between auto-me |
| [classdiagram](classdiagram.md) | `classDiagram` | stable | ✓ / ✓ | Ports-and-adapters seams: BrokerPort (src/ports/broker.ts) and its realizers AlpacaBrokerA |
| [userjourney](userjourney.md) | `journey` | stable (not marked beta or experimental on the docs page or  | ✓ / ✓ | UX friction audits of one member-facing flow on the trading surfaces, scored step by step  |
| [entityrelationshipdiagram](entityrelationshipdiagram.md) | `erDiagram` | stable | ✓ / ✓ | Schema/data-model PRs (the existing docs/PICTURES.md row 'Schema / data model → erDiagram' |
| [gantt](gantt.md) | `gantt` | stable | ✓ / ✓ | Retros (the retro skill and docs/LESSONS.md): 'measure how long detection took' is a durat |
| [pie](pie.md) | `pie` | stable (keyword has no -beta suffix) | ✓ / ✓ | Secretary digests and report-outs showing one snapshot of a whole: e.g. this week's merged |
| [requirementdiagram](requirementdiagram.md) | `requirementDiagram` | stable | ✓ / ✓ | Plan files with EARS acceptance criteria (docs/plans/*.md, e.g. docs/plans/player-trading- |
| [quadrantchart](quadrantchart.md) | `quadrantChart` | stable | ✓ / ✓ | Research call sheets (docs/research/*.md, e.g. multi-symbol-sweep.md): place playbooks or  |
| [gitgraph](gitgraph.md) | `gitGraph` | stable | ✓ / ✓ | Platter PRs (one commit per item): each item is a commit on a `platter` lane, a dropped or |
| [c4](c4.md) | `C4Context` | experimental | ✓ / ✓ | ADR-0008's 'System diagrams' spec surface (docs/adr/0008-spec-surfaces-and-architecture-fi |
| [mindmap](mindmap.md) | `mindmap` | experimental | ✓ / ✓ | Research-doc call sheets (call · confidence · why · falsifier) as a one-glance radial summ |
| [zenuml](zenuml.md) | `zenuml` | Experimental external plugin, not part of core Mermaid | ✗ / ✗ | None of this repo's GitHub-rendered surfaces. It fails on PR bodies, issue capsules, plans |
| [timeline](timeline.md) | `timeline` | experimental | ✓ / ✓ | Budget ratchets over weeks (dead-budget.json, dupe-budget.json, spec-gap-budget.json, comm |
| [sankey](sankey.md) | `sankey-beta` | experimental | ✓ / ✓ | Bot trade funnel, in a PR or digest about the engine or risk guards: decision cycles per p |
| [xychart](xychart.md) | `xychart` | Stable upstream | ✓ / ✓ | Fitness-gate budget ratchets over time: clone-budget.json (clones 9), comment-bloat-budget |
| [packet](packet.md) | `packet` | Stable | ✓ / ✓ | Broker wire formats in src/trading/option-symbols.ts. The OCC symbol ROOT+YYMMDD+C|P+strik |
| [block](block.md) | `block-beta` | Stable since Mermaid v11 | ✓ / ✓ | Deploy/runtime topology where position must stay put: the two Fly apps (dashboard `fly.tom |
| [kanban](kanban.md) | `kanban` | stable | ✓ / ✓ | Backlog snapshot in a /secretary digest (docs/digests): columns Ready to build / Waiting o |
| [architecture](architecture.md) | `architecture-beta` | beta | ✓ / ✓ | Deploy-topology PRs: the fly.toml (skynet-capital web/API) vs fly.bots.toml (skynet-capita |
| [radar](radar.md) | `radar-beta` | beta | ✓ / ✓ | Research call sheets (docs/research/*, symbol-sweep synthesis) where the call is 'which of |
| [treemap](treemap.md) | `treemap-beta` | beta | ✓ / ✓ | 'Where a budget goes' pictures in PR bodies and research docs: an agent session's token or |

## Cross-cutting cards

| Card | What it covers |
|---|---|
| [config-theming](config-theming.md) | Themes can be set for a whole site with mermaid.initialize() or for one diagram with frontmatter `config:` (the `%%{init |
