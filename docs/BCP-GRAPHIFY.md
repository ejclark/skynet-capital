# BCP × Structural Map — integration spec

How a **structural map** of a repo concretely feeds the [Brand Cohesion Protocol](OPERATING-MODEL.md#brand-cohesion-protocol-bcp)
(BCP). Written vendor-neutral: it applies to any code-knowledge-graph tool that emits communities and
centrality; [Graphify](https://github.com/Graphify-Labs/graphify) is the reference implementation.

> **Confidence note.** The Graphify specifics below are read from its public README (communities via
> Leiden, god-nodes = highest-degree hubs, `graph.json` full dataset, edge confidence tags
> `EXTRACTED`/`INFERRED`, ~40-language tree-sitter extraction). The exact `graph.json` schema is not
> verified here — treat field names as *roles to bind*, not literal keys, until confirmed against the
> tool. This spec ideally lives in the mapper's repo eventually; it sits here now because that's the
> session we're in.

## The pipeline

```
map (Graphify)  →  codify identity (BCP → BRAND.md)  →  operate (operating model)
   structure              identity                          process
```

The mapper answers *"what are the structural hubs and subsystems?"* It has **no identity layer**. BCP
adds identity, consuming the map as one input. The operating model applies both.

## What BCP consumes from the map

| Map concept (role) | BCP use | Step |
| --- | --- | --- |
| **god-nodes** (highest-degree hubs) | ranked **identity-anchor candidates** | Anchor |
| **communities** (subsystems) | **cohesion scopes** (units of internal consistency) | Enforce |
| **nodes + edges** (entities, relations) | one **Sense** signal (structure) among assets, character, metaphors | Sense |
| **confidence tags** (`EXTRACTED`/`INFERRED`) | trust weighting — `INFERRED` inputs get flagged for human confirmation | Sense/Anchor |

## Mapping rules

1. **Anchor candidacy ≠ anchor.** Rank god-nodes by centrality; each is a *candidate*. A human (or BCP
   with the owner's confirmation) selects which actually **carry identity** — a high-degree *utility*
   hub (a logger, a config module) is central but brand-inert; a high-degree *experience* hub (the
   login world, the persona system) is where cohesion lives. Only the latter become `BRAND.md` anchors.
2. **One scope, one voice.** Each community is a scope in which tokens, type registers, voice, and
   motifs must be internally consistent. Cross-scope divergence that isn't a deliberate mode shift
   (e.g. Skynet's fast-preview `/login` vs. calm "study mode" dashboard) is drift → a defect.
3. **Structure is a signal, not the source.** The graph never *defines* identity; it *locates* where
   identity concentrates. Sense still fuses it with existing assets (palette/type/logo/copy), the
   domain's inherent character, and the owner's metaphors.
4. **Weight by confidence.** `INFERRED` relationships (resolved, not explicit in source) are lower
   trust; surface them for confirmation before treating them as cohesion evidence.

## Flow

1. Run the mapper → `graph.json` (+ its report). No identity work yet.
2. **Sense**: read communities + god-nodes; fold in assets, character, metaphors.
3. **Anchor**: from the top god-nodes, confirm 1-3 that carry identity → record in `BRAND.md`, each
   tagged with the community it anchors.
4. **Distill**: write/refresh `BRAND.md` (tokens, voice, motifs, anchors, honesty rules).
5. **Enforce**: check each deliverable against `BRAND.md`, scoped by community; flag drift.
6. **Compound**: refinements flow back into `BRAND.md`; re-run the map when structure shifts materially
   (new god-nodes/communities = new anchor candidates + scopes).

## Worked example (real — Graphify run 2026-07-26)

Graphify actually ran on this repo (701 nodes, 1835 edges, 19 communities — see
[`STRUCTURE-graph.md`](STRUCTURE-graph.md)). The result **corrected my hypothesis and proved the core
rule:**

- **Real god-nodes are the trading domain model:** `MarketContext` (38), `OrderIntent` (36), `Persona`
  (32), `Portfolio` (30) — the *engine*. I had guessed the UI files (`authenticator.ts`,
  `render-dashboard.ts`) would top the list. They did **not**.
- **Why the guess was wrong is the lesson.** `authenticator.ts` is the most *brand-dense* file (the
  entire `/login` world) yet structurally *light* — it's one giant inline canvas template, so
  tree-sitter sees few nodes. **Structural centrality and identity density are near-inverse here.**
- **So structure ≠ identity, empirically.** The engine's god-nodes are the structural core; the brand
  anchors in [`BRAND.md`](BRAND.md) (the Eye, the `/login` world, the playbook) are *experience* hubs
  the graph ranks low. This is exactly rule #1 ("candidacy ≠ anchor") — validated on real data, not
  asserted. **Never read anchors straight off centrality; centrality gives *candidates*, and the
  experience-vs-utility judgment selects the anchors.**
- **`Persona` is the domain heart** — highest betweenness (0.033), bridging market data ↔ the
  autonomous engine, with every persona (incl. `sauron.ts`) hanging off it. Fitting that the lore
  layer attaches exactly where the structural bridge is.
- **Communities → cohesion scopes** landed cleanly (auth/session, personas, observatory renderer,
  server) and the low-cohesion ones (`MarketContext`, `dashboard-data.ts`) are surfaced as refactor
  candidates, not drift.

## Open questions (for a Graphify-scoped session)

- Confirm `graph.json`'s real schema and bind the roles above to concrete fields.
- Does the mapper expose per-node centrality scores (to rank anchor candidates) and community
  membership directly, or must BCP derive them?
- Should BCP emit a machine-readable `brand.json` (tokens + anchor→node bindings + scope rules) so
  *Enforce* can be partly automated (lint deliverables against the brand per scope)?
- Where should this spec live long-term — here, in Graphify, or a shared meta-repo?
