# ADR-0008: Spec surfaces, three-way system parity, and architecture fitness evals

- **Status:** Proposed
- **Date:** 2026-07-27

## Context

Two problems have surfaced as the project grew, and they're related.

**1. Organizational artifacts overlap and drift.** We accumulated a ToC/system map, ADRs, several
roadmaps (README, `BACKLOG.md`, `AUTONOMY-PLAN.md`, `GAMEBOARD-PLAN.md`, `IDEAS.md`, and a "where to
aim" section), and a Graphify code graph. Their boundaries were never defined, so "what to build next"
lives in six places and the Graphify snapshot silently drifted **170 commits** before anyone noticed.

**2. Systems grow monolithically with no forcing function to decompose.** `authenticator.ts` is a
~2,700-line god-file; Graphify already flags low-cohesion communities as "split candidates." Nothing
turns those signals into pressure to actually decompose, so the marginal cost of every change to a
tangled system keeps rising ("deepening a persona ripples wide" — `STRUCTURE-graph.md`).

**The operating-model insight that ties them together (Eric):** the **ToC, roadmaps, and system-level
diagrams are Eric's *spec surface*** — the layer where he authors intent, which then hands off to Claude
to build. In Theory-of-Constraints terms the binding constraint is Eric's attention (`CLAUDE.md`); this
model *exploits* it by concentrating his work at the systems/spec level and *subordinating* execution to
Claude. That only works if the spec surface stays **true to the built reality** — you cannot spec against
a fiction. So the drift problem isn't cosmetic: it corrupts the control surface Eric steers with.

## Decision

Adopt a small, mostly-automated **project-memory system** with three parts.

### A. Every artifact owns one question and one lifecycle stage

| Artifact | The one question | Stage | Owner / upkeep |
|---|---|---|---|
| `CLAUDE.md` | *How do we work?* | the constitution | Eric (manual) |
| `IDEAS.md` | *What might we do?* | capture (inbox) | append-only |
| **`ROADMAP.md`** (new; consolidates the scattered ones) | *What's committed & in what order?* | plan | **Eric's spec surface** |
| **System ToC** (`SYSTEM-MAP.md`) | *What systems exist & how mature?* | shipped-state | **Eric's spec surface**, Claude-synced |
| **System diagrams** (Mermaid) | *How do the systems relate?* | shipped-state | **Eric's spec surface**, Claude-synced |
| `docs/adr/*` | *Why did we choose X?* | decision | immutable log |
| **Graphify** (`STRUCTURE-graph.md`) | *How is the code wired?* | structure (ground truth) | **auto** (ADR-driven; workflow) |
| per-area plan docs | deep dives | transient | fold up when shipped |

An idea **flows**: `IDEAS` → `ROADMAP` → build → ToC status flips + diagram updates + ADR if
load-bearing → Graphify auto-updates. Overlap is eliminated because each artifact is a different
*stage* or *lens*, not a copy. A new `docs/README.md` index states this table so routing is obvious.

### B. Three representations of "systems," kept in parity

The same system set is expressed three ways, and they must agree:

- **ToC** (`SYSTEM-MAP.md`) — the curated list with **maturity + aim** (judgment; Eric's).
- **Mermaid diagrams** — the **relationships** between systems, human-readable when rendered and
  **AI-writable/diffable** as text (chosen for exactly that dual property). One top-level system graph
  plus per-system flow diagrams (e.g. the autonomy pipeline `decide → guard → trade → safety`).
- **Graphify** — the **code** those systems compile to (auto, ground truth).

**Parity rule:** every ToC/diagram system maps to real code in Graphify, and every significant Graphify
community maps to a named system in the ToC. A **parity check** (script, from Graphify's `graph.json` +
the ToC's system list) reports mismatches: a ToC system with no code presence, or a code community not
named in the ToC.

**Sync loop (autonomous, with escalation):** Claude keeps the ToC + diagrams in step with built reality
after each change; it **updates mechanically** where the answer is unambiguous (status flips, a new
community that clearly belongs to an existing system) and **asks Eric only on genuine spec questions** —
"is this new community its own system? what's its name / maturity / aim? should this god-file be
decomposed?" This is the hand-off in reverse: reality informs the spec surface, Eric adjudicates the
judgment calls, and specs then drive the next build.

### C. Architecture fitness evals (the decomposition forcing function)

Borrowing the *evolutionary-architecture* idea of a **fitness function** — an automated check that
guards a desired architectural property — add an **architecture eval** that reads Graphify's metrics and
flags systems that should decompose, so growth doesn't silently produce monoliths.

Concretely (this answers "I don't know how to build these"): Graphify already emits, per community and
node, the numbers we need — node/edge counts, cohesion, betweenness (hub-ness), and cycle reports. The
eval is a small script that:

1. Reads `graphify-out/graph.json` / `.graphify_analysis.json`.
2. Applies **thresholds**: a file/community over N nodes or lines (god-file — `authenticator.ts` today);
   a community below a cohesion floor (Graphify's own "split candidate"); a node whose fan-in/betweenness
   crosses a ceiling (a hub becoming a bottleneck); any import cycle.
3. Emits an **actionable report** ("`authenticator.ts` — 2.7k lines / X nodes → extract the login-canvas
   engine; Graphify flags community C4 low-cohesion → split") and, in CI, **warns** (not a hard gate at
   first — per `CLAUDE.md`, don't tax flow; ratchet thresholds down over time, Boy-Scout style).

This makes decomposition a visible, measured pressure instead of a thing we hope to remember, and it
protects the property Eric's spec surface depends on: **systems small enough to spec against.**

## Alternatives considered

- **Leave it as convention in `CLAUDE.md`.** Already tried; 170 commits of Graphify drift is the proof
  that unenforced conventions rot. Rejected for anything mechanizable.
- **One giant generated doc.** Tempting, but maturity/aim/relationships are *judgment*, not derivable
  from code — a pure generator would fabricate the very things Eric needs to author. Rejected: keep the
  curated spec surface human-authored, auto-*check* it against ground truth.
- **Hard-gate architecture thresholds in CI.** Would tax flow and provoke gaming. Rejected in favor of
  **warn-then-ratchet** — the report creates pressure without blocking green PRs.
- **A heavier docs framework (wiki, Backstage, etc.).** Over-process for a friends-and-family repo;
  violates the `CLAUDE.md` "don't force ceremony that taxes flow" rule. Rejected.

## Consequences

- **Eric gets a trustworthy control surface.** He authors at ToC / roadmap / diagram; Claude builds and
  keeps those surfaces honest against Graphify. The hand-off becomes a clean loop with escalation only on
  real questions — the constraint is exploited, not nickel-and-dimed.
- **Drift becomes visible and mostly self-healing.** Graphify auto-refreshes (already shipping); the
  parity check and architecture eval surface the rest as CI reports rather than silent rot.
- **Decomposition gets a forcing function** grounded in metrics we already produce.
- **New upkeep, kept light:** a `docs/README.md` index, one consolidated `ROADMAP.md` (retire the
  duplicates), Mermaid diagrams to author and sync, and two small scripts (parity check, architecture
  eval). The evals start as warnings; nothing here hard-blocks a PR at first.
- **Follow-ups (phased, each its own PR):**
  1. `docs/README.md` index + consolidate roadmaps into `docs/ROADMAP.md` (retire the scattered ones).
  2. Mermaid system diagrams in `SYSTEM-MAP.md` (top-level + per-system).
  3. Parity check script (ToC ⇄ Graphify) + a CI report.
  4. Architecture fitness eval (Graphify metrics → thresholds → CI warning), warn-then-ratchet.
  5. A `CLAUDE.md` "definition of done" line: on ship, sync the ToC/diagram, update the roadmap, ADR if
     load-bearing — the discipline stated once (Eric's edit).
