---
name: mermaid
description: >-
  Draw the right Mermaid diagram for a change, a plan, an architecture page or a reply — and prove
  it renders on GitHub before anyone sees it. Use whenever a mermaid block is being written or
  reviewed: a PR's opening picture, an issue capsule, a plan's lifecycle, a docs/architecture page,
  a digest, a retro, an in-session explanation. Loads the type's reference card on demand; nothing
  here is loaded by default (Eric, 2026-09-25: no standing tax for expertise that isn't needed).
---

# /mermaid — expert on demand

The knowledge lives in `reference/` (one card per diagram type, distilled from mermaid.js.org and
validated), not in any session's memory. Load this page when drawing; open one card, not all.

## The contract in one line

**Pick the type by the story, draw ≤15 nodes in plain words, mark the delta without hue, run the
lint, caption it.** Every step has an owner below.

## 1. Pick by the story — `docs/PICTURES.md` → decision table

| The picture must show… | Type | Card |
|---|---|---|
| a behaviour before vs after | `sequenceDiagram` with two `Note over` halves | `reference/sequencediagram.md` |
| a lifecycle, gate or mode | `stateDiagram-v2` (composite state + guard labels) | `reference/statediagram.md` |
| branch / merge mechanics (platter, backport) | `gitGraph` | `reference/gitgraph.md` |
| a dataflow, pipeline or decision path | `flowchart` (delta grammar below) | `reference/flowchart.md` |
| a number moving over time | `xychart-beta` | `reference/xychart.md` |
| a call sheet / triage (confidence × impact) | `quadrantChart` | `reference/quadrantchart.md` |
| a retro or incident | `timeline` (+ `ishikawa-beta` for root cause) | `reference/timeline.md` |
| a brain-dump or scope | `mindmap` | `reference/mindmap.md` |
| a backlog snapshot | `kanban` | `reference/kanban.md` |
| the system, its containers, its components | `C4Context` → `C4Container` → `C4Component` | `reference/c4.md` |
| a data model / a type change | `erDiagram` / `classDiagram` | `reference/entityrelationshipdiagram.md` / `reference/classdiagram.md` |
| requirements ↔ specs ↔ PRs | `requirementDiagram` | `reference/requirementdiagram.md` |
| where tokens / money / requests split | `sankey-beta` | `reference/sankey.md` |
| layers or regions where position means something | `block-beta` | `reference/block.md` |
| a config, a before/after of values | a GFM table (no diagram) | — |
| a typo, a chore | `Picture: waived — <reason>` | — |

Cross-cutting cards: `reference/config-theming.md` (themes and themeVariables — and why they stay off
on GitHub surfaces). Frontmatter config and directives, layouts and icons, accessibility and the
parse API, the CLI and ecosystem land in the next slice of #3748.

## 2. GitHub is the renderer — what it does and does not draw (11.17.2, read 2026-09-25)

- Draws every type above plus `architecture-beta` (built-in icons only), `radar-beta`, `treemap-beta`,
  `packet-beta`, `swimlane-beta`, `venn-beta`, `ishikawa-beta`, `wardley-beta`, `cynefin-beta`,
  `treeView-beta`, `eventmodeling`. Not `usecase-beta` / `agentflow-beta` (12.x) or `zenuml`.
- Honours YAML frontmatter `config:` (`look: handDrawn` works) — never `theme` (freezes one colour
  mode; the lint fails it). `layout: elk` silently falls back to dagre. Iconify / Font Awesome
  icons render as `?`. `click` is dead. The GitHub *mobile app* renders no Mermaid; a phone browser
  does — design for 390px in a browser: `TD` over `LR` past ~6 nodes, ≤4 sequence participants.
- Drift check: a mermaid block containing only `info` prints the deployed version in any comment.

## 3. The delta grammar — emphasis a colourblind reader sees

| Meaning | Draw it as | Never as |
|---|---|---|
| new in this change | thick edge `==>`, or `subgraph "this PR"` | a green fill |
| removed / the old path | dotted edge `-.->` | a red fill |
| changed | `classDef changed stroke-width:3px` (no colour) | a hue shift |
| a fork / decision | diamond `{ }` | — |
| a store | `@{ shape: cyl }` | — |
| a person | `@{ shape: person }` | — |
| proposed, not built (plan issues) | frontmatter `config: { look: handDrawn }` | — |

Colour is allowed only *paired* with one of these (BRAND.md: hue never carries meaning alone), and
only via the contrast-verified `classDef` snippet in `docs/PICTURES.md` — never a hex picked in-flight.

## 4. Prove it, then caption it

```
npm run mermaid:lint -- <file.md>       # or: node scripts/mermaid-lint.mjs --stdin
```
The lint parses with GitHub's exact Mermaid; `ship.sh checkbody` and `issue:lint` run it for you.
In a session the Mermaid Chart MCP validator renders a preview, but it runs an *older* Mermaid than
GitHub — a red there on an 11.17 feature (`person` shape) can be a false red; the lint is the oracle.
Then the caption: `_Caption — <what it shows>, from <route | script | diff>_`. The caption is the
line that survives email and notifications.

## 5. Traps the cards found (the ones that bite in practice)

- Parentheses, brackets or `:` inside a label → quote the label: `a["SPY 450C (weekly)"]`.
- `timeline` periods cannot contain `:` (`0931`, not `09:31`).
- `end` is a reserved word in flowcharts; `subgraph` titles with spaces need quotes.
- `mindmap` and `treemap` structure comes from indentation — keep it consistent.
- `sankey-beta` rows are CSV at column 0; no indentation.
- A sequence `Note over A,B` needs the comma without spaces on some versions — copy the card's form.

## Who reads this picture — `docs/READERS.md`

Before drawing for Eric, read his section there once per session: phone browser, ~10 seconds, F-pattern,
hue-blind, thinks in lifecycles and mechanics, and reacts to a *change story* — not a module map.
