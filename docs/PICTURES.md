# Pictures — the visual vocabulary for PRs, reports, and journeys

The fridge rule (Eric, 2026-08-20: *"dumb this shit down and draw more pictures"*): every PR and
report-out opens with something judgeable **by eye in ~10 seconds**. This page is the grammar —
which picture fits which change, the mechanics that keep pictures alive, and the honesty rules
that make fast review safe. The PR template points here so its own comments stay short; the
structure is machine-checked by `scripts/ship.sh checkbody`.

Provenance: the 2026-08-20 hat-team communication research (white/red/yellow/blue/black-hat pass
over every feedback surface). Owner: the secretary skill (template codification). The load-bearing
finding, one line: **format compliance tracks enforcement + distribution, never willingness** — so
this guide teaches, the template reminds, and the ship gate enforces existence; taste is never gated.

## The decision table — the story → the picture

Pick by what the picture must *show*, never by habit: a 40-PR census (2026-09-25) found 8 of 11
diagrams were one fan-in/fan-out flowchart whatever the change was — the named anti-pattern is
**one shape for every change** (`PATTERNS.md`). The best frames in that sample made the *causal
argument*: a sequence with Before/After halves (#3737), a flowchart with decision diamonds and
labelled before/after branches (#3710). Each row names the one feature that makes the type read;
the starters below are validated by `npm run mermaid:lint` and the `/mermaid` skill carries the
full card per type.

| The picture must show… | Picture | The feature that makes it read |
|---|---|---|
| A UI change | before/after screenshots, 2-col table of `<img width="49%">` | the one grammar judged in <10s |
| A single new screen | one `<img width="600">` | uncapped 2× shots dominate the fold |
| A behaviour before vs after | `sequenceDiagram` | two `Note over` halves, *Before* / *After*; `autonumber` |
| A new route / request path | `sequenceDiagram` | `alt`/`else` for the error branch; ≤4 participants |
| A lifecycle, gate or mode (`SIM`/`LIVE`, draft→ready→done) | `stateDiagram-v2` | a composite state + guard labels on transitions |
| Branch topology with few branches (a backport, worktrees) | `gitGraph` | vertical (`TB:`) on a phone; plain-word branch names; never for the held PR (below) |
| The held PR for protected changes: the choice, then the record | `flowchart` | at open time the button is the fork; after landing a second picture, generated from the log |
| A dataflow, pipeline or decision path | `flowchart` (`TD` past ~6 nodes) | the delta grammar: `==>` new, `-.->` removed, a diamond per fork |
| A number moving over time (a budget ratchet, latency, counts) | `xychart-beta` | bar + line on one axis, the series named in the title |
| A call sheet or triage (confidence × impact, borrow/adapt/skip) | `quadrantChart` | ≤6 points; never P&L implied (`BRAND.md`) |
| A retro or incident | `timeline` (+ `ishikawa-beta` for the cause) | sections Detect / Respond / Learn; no `:` in periods |
| A brain-dump or the scope of a study | `mindmap` | three branches, one level of leaves |
| A backlog snapshot (a digest) | `kanban` | generated from labels, never hand-kept |
| The system, its containers, its components | `C4Context` → `C4Container` → `C4Component` | boundaries; `Rel` labels carry the technology |
| A schema or a type change | `erDiagram` / `classDiagram` | cardinality glyphs; before/after namespaces |
| A module split (decompose) | `treeView-beta` or `classDiagram` | the tree the PR adds or moves |
| Requirements ↔ specs ↔ PRs | `requirementDiagram` | `satisfies` / `verifies` per EARS line |
| Where tokens, money or requests split | `sankey-beta` | generated from a ledger |
| Layers or regions where position means something | `block-beta` | columns; the region a change touches |
| Config / constants | table: key · before · after · why | scannable left edge (a GFM table counts as media — 2026-08-22) |
| Risk / irreversible touch | `> [!WARNING]` top-level | pre-attentive; see the caution budget |
| Trivial (typo / chore / pure docs) | `Picture: waived — <reason>` | an honest skip beats a decorative diagram |

The waiver is a first-class move, not a loophole: a 3-node flowchart on a typo fix burns the
glance it claims to save and trains the reader to skip the slot. Skips stay visible and auditable.

**The vocabulary card** — the words that turn "make it richer" into a precise request:
*sequence with before/after notes · state diagram · gitGraph · delta flowchart · xychart · quadrant
call sheet · timeline retro · mindmap · kanban snapshot · C4 (context / container / component) ·
hand-drawn look (proposed, not built) · the door (a PR's parse gate) · the button is the fork (a held PR)*.
Each is a row above and a card in `/mermaid`.

**The delta grammar** — how a diagram marks *what changed* for a reader who cannot rely on hue:

| Meaning | Draw it as | Never as |
|---|---|---|
| new in this change | thick edge `==>`, or `subgraph "this PR"` | a green fill |
| removed / the old path | dotted edge `-.->` | a red fill |
| changed | `classDef changed stroke-width:3px` (no colour) | a hue shift |
| a fork | a diamond `{ }` | — |
| a store / a document / a person | `@{ shape: cyl }` / `@{ shape: doc }` / `@{ shape: person }` | — |
| proposed, not built (plan issues) | frontmatter `config: { look: handDrawn }` — the sketch register | — |

## Mermaid that renders on GitHub — any type 11.17.2 draws, and every block is parsed

GitHub renders Mermaid natively in PR bodies, issues and `.md` files — on **Mermaid 11.17.2**
(read from github.com's production renderer bundle, 2026-09-25; upstream is 12.0.0). **The gate is
the parser, not a type list:** `npm run mermaid:lint` parses every ```` ```mermaid ```` block with
that exact pinned version (`scripts/mermaid-lint.mjs`), and `ship.sh checkbody`, `issue:lint` and
the CI corpus scan all run it — so a diagram that passes here draws there, and the fear that
motivated the old "stable types only" rule (a syntax error as the opening frame) is caught before
push. The type menu is therefore everything 11.17.2 draws: `flowchart`, `sequenceDiagram`,
`stateDiagram-v2`, `erDiagram`, `classDiagram`, `gitGraph`, `quadrantChart`, `requirementDiagram`,
`timeline`, `mindmap`, `kanban`, `pie`, `gantt`, and the beta family (`xychart-beta`, `sankey-beta`,
`block-beta`, `architecture-beta`, `radar-beta`, `treemap-beta`, `packet-beta`, `C4Context` and
kin). Pick by the change, per the decision table. Never `usecase-beta` or `agentflow-beta` (12.x
only — GitHub shows an error), never `zenuml` (a plugin), and never the `journey` type for
reasoning journeys — it's a UX-satisfaction chart, the wrong shape entirely; the lint refuses all
four. Known traps the lint catches for you: unquoted parentheses in a label (`A["SPY 450C (weekly)"]`),
a colon inside a `timeline` period (`0931`, not `09:31`), and iconify/Font Awesome icons (GitHub
renders every one as `?` — `architecture-beta` gets only its built-in cloud/database/disk/internet/
server). The GitHub *mobile app* does not render Mermaid at all (open since 2024); a phone browser
does, so the 390px rule below is about the browser.

Copy-paste starters (every one parses under `npm run mermaid:lint`; the `/mermaid` skill carries
the full card per type):

````markdown
```mermaid
---
title: A diagram is parsed before it is pushed
config:
  flowchart:
    nodeSpacing: 24
    rankSpacing: 36
    padding: 10
---
flowchart TD
    body@{ shape: doc, label: "**PR body with a diagram**<br/>any of the 20 types<br/>GitHub draws" }
    body ==> door{"`**parses like GitHub?**<br/>same build, 11.17.2;<br/>theme, icons, colour<br/>checked with it`"}
    door ==> draws@{ shape: dbl-circ, label: "**GitHub draws it**<br/>pushed; light and dark,<br/>phone and desk" }
    door ==x stop["`**push refused**<br/>the line and the<br/>token named, fixed<br/>before anyone reads it`"]
    body -.-> red["`**used to go straight through**<br/>first word checked,<br/>red parse box as<br/>the opening frame`"]
    class body,draws,stop paper
    class door gold
    class red removed
    classDef paper fill:#F4EFE6,color:#141210,stroke:#141210,stroke-width:3px
    classDef gold fill:#E0A33A,color:#1A1300,stroke:#1A1300,stroke-width:3px
    classDef defect fill:#B3261E,color:#FFF4EC,stroke:#FFF4EC,stroke-width:3px
    classDef removed stroke:#5A6B7B,stroke-width:2px,stroke-dasharray:6 4
    classDef default font-size:18px,font-family:Verdana
```
````
_The door, in ink mode with its second layer (rules 18 and 11; both Eric's calls, 2026-09-26): the
new path thick and declared first (it lands left), the old path one dotted lane declared last (it
lands right); the fork asks a question and wears the gold, the cross-head says no, the double circle
says done, the tense lives in the box; every node a bold headline and one line of fact. No edge
labels. Drop the four colour lines for the plain dress; never mix in the teal snippet._

For a page with room, the same door with boxes of detail beside the spine (rule 18, shape A):

````markdown
```mermaid
---
title: A diagram is parsed before it is pushed, and what the door checks
config:
  flowchart:
    nodeSpacing: 20
    rankSpacing: 30
    padding: 8
---
flowchart TD
    body@{ shape: doc, label: "PR body<br/>with a diagram" }
    body ==> door{"parses like<br/>GitHub?"}
    subgraph checks ["what the door checks, in order"]
        direction TB
        v["the same Mermaid<br/>GitHub runs, 11.17.2"] --> ty["a type GitHub<br/>draws, not 12-only"] --> th["no pinned theme,<br/>both canvases"] --> ic["no icon pack,<br/>it draws a ?"] --> hx["every colour from<br/>a checked-in snippet"]
    end
    door -.- checks
    door ==> draws@{ shape: dbl-circ, label: "pushed,<br/>GitHub draws it" }
    door ==x stop["push refused,<br/>the line and<br/>the token named"]
    subgraph was ["what it replaced"]
        direction LR
        first["check the<br/>first word only"] -.-> red["red parse box<br/>as the opening frame"]
    end
    body -.-> was
    classDef removed stroke:#5A6B7B,stroke-width:2px,stroke-dasharray:6 4
    class first,red removed
    classDef default font-size:18px,font-family:Verdana
```
````
_Shape A: the checklist stands as a column beside the door (two boxes per rank still holds, rule 3);
what it replaced sits in its own box. Every added node is a fact the lint enforces._

````markdown
```mermaid
sequenceDiagram
    autonumber
    participant S as ship.sh
    participant G as GitHub
    participant A as arm-auto-merge
    Note over S,A: Before
    S->>G: open PR
    G->>A: opened (no label)
    A->>G: arms and merges
    Note over S,A: After
    S->>G: open as draft, label hold-merge, mark ready
    G->>A: ready_for_review (labelled)
    A-->>G: skips
```
````
_Before/After halves: the same exchange twice, the fix visible in the second half (#3737)._

````markdown
```mermaid
stateDiagram-v2
    [*] --> draft
    draft --> ready: Eric flips
    state executing {
        [*] --> building
        building --> verifying: specs green
    }
    ready --> executing
    executing --> done: PR merges
```
````
_A lifecycle: the composite state holds the sub-steps; every transition carries its guard._

````markdown
```mermaid
---
title: "The held PR: the button decides what reverts"
config:
  flowchart:
    nodeSpacing: 24
    rankSpacing: 36
    padding: 10
---
flowchart TD
    items@{ shape: docs, label: "**three protected changes**<br/>one commit each,<br/>each verified green" }
    pr@{ shape: stadium, label: "**one held PR**<br/>one click by Eric,<br/>never auto-merged" }
    items ==> pr ==> button{"`**which button lands it?**<br/>the click decides<br/>what can be undone`"}
    button ==>|Create a merge commit| merged@{ shape: cyl, label: "**main: three commits**<br/>any one item<br/>reverts alone" }
    button -->|Squash and merge| squashed@{ shape: cyl, label: "**main: one commit**<br/>reverts only as<br/>a block, #3754" }
    class items,pr,merged paper
    class button gold
    class squashed defect
    classDef paper fill:#F4EFE6,color:#141210,stroke:#141210,stroke-width:3px
    classDef gold fill:#E0A33A,color:#1A1300,stroke:#1A1300,stroke-width:3px
    classDef defect fill:#B3261E,color:#FFF4EC,stroke:#FFF4EC,stroke-width:3px
    classDef default font-size:20px,font-family:Verdana
```
````
_The held PR at open time (`scripts/ship.sh platter`): the choice Eric holds and what each button
does to the undo. Thick is the path to take. The edge labels are the buttons themselves, the one
kind of edge label allowed (rule 9). Drawn for the moment the PR is read, before the click._

````markdown
```mermaid
---
title: "PR #3711: no item reverts alone"
config:
  flowchart:
    nodeSpacing: 24
    rankSpacing: 36
    padding: 10
---
flowchart TD
    subgraph held ["the held PR"]
        i1@{ shape: doc, label: "1 update the<br/>review action" }
        i2@{ shape: doc, label: "2 update upload-artifact" }
        i3@{ shape: doc, label: "3 update cache" }
    end
    held ==>|Squash and merge| main@{ shape: cyl, label: "main: 1 + 2 + 3<br/>as one commit,<br/>reverts only<br/>as a block, #3754" }
    classDef default font-size:20px,font-family:Verdana
```
````
_The record after landing, generated from the log and posted as a comment, in whichever ending is
true: the squash above (today, #3754), or `held ==>|Create a merge commit| main["main: one merge
commit, any one item reverts alone"]` once the setting is fixed. A gitGraph was tried for this
story and retired: its commit connectors are a fixed 8 px, it takes no classDef, and plain-word
branch names overlap its labels; it stays in the table for branch topology only._

````markdown
```mermaid
quadrantChart
    title Calls, this week
    x-axis Low edge --> High edge
    y-axis Low confidence --> High confidence
    NVDA guards: [0.8, 0.75]
    TSLA stand aside: [0.3, 0.2]
    SPY straddle: [0.6, 0.5]
```
````
_A call sheet as a picture: confidence × edge; never a P/L claim (`BRAND.md`)._

**The legibility budget:** ≤15 nodes; plain words, not paths (`login canvas`, never
`src/three/pieces/eye-shader.ts`); no SHAs, env vars, or CLI flags in labels; quote labels
containing special characters. The real reading condition is a phone at 390px.

**Rules the design rounds found** (round 2, iterating the five #3778 pairs, and round 3, the
Claude Design handoff on plan #3786; each is rule · tell · fix). A first draft is the right type with
first-draft words; the third draft has fewer nodes, a title that states the claim, the old path drawn
dotted, phone direction, and labels a friend with no context reads without stopping.

1. **A handle is not a word.** Shas, versions and ids stay in the table beside the picture; a label
   says what the handle means · `revert: b0a4c8a` tagged on every commit · `reverts alone`, the
   ledger row keeps the sha.
2. **A fork shape asks a question.** The text in a diamond ends in `?`; the exits carry the
   answers · a hexagon stating "parse it the way GitHub does" · `door{"parses like<br/>GitHub?"}`.
3. **Two boxes per rank on a phone.** In `TD` no rank holds more than two boxes · three side by
   side, the phone shows the drawing at half size · fold the old path into one box beside the
   door, or push it a rank.
4. **Break a long label by hand.** Past about 16 characters a label gets `<br/>` where the sense
   breaks; the renderer's own wrap fails at a fractional browser zoom and clips mid-word · a
   clipped word on a phone · hand-placed breaks; never a `<br/>` in a subgraph title, the box does
   not grow.
5. **Draw the moment the picture is read.** A PR's opening picture draws what is true when the PR
   opens; what landed is a second picture, generated after · "what actually landed" in a body
   written before the merge · two pictures, the choice and the record.
6. **One chart; the old path is one dotted lane on the right.** Declare the new path first (it
   lands left), the old path last (it lands right, where a left-to-right reader drops it) · a
   separate "before" chart forcing a full scan of both · one drawing; a separate before only when
   the old path shares no node with the new.
7. **A house noun never enters a label.** Platter, boarding, capsule, state block stay in scripts
   and docs; the picture says what the thing does · `branch platter` · `"one commit on the held
   PR"`. This is the no-coined-names rule applied to pictures.
8. **The title is a line of the drawing.** About 40 characters; longer is the widest thing in the
   SVG and shrinks everything under it on a phone · a title that wraps · cut to the claim, the
   rest goes in the caption. Quote it when it contains `#`, which YAML reads as a comment.
9. **The guiding wind: no overlay, the world points.** An edge label is allowed only when it is
   the choice itself (a button name), never a hint about the edge · `yes`, `no`, `was` on edges ·
   the tense in the box ("used to go straight through"), the cross-head says no, the double
   circle says done.
10. **One weapon per enemy: the type matches the story.** Flow → flowchart, count → erDiagram,
    lifecycle → stateDiagram-v2, order in time → sequence, containment → a box with boxes inside
    · a gitGraph for a story about a button · the decision table above.
11. **Kurosawa mode: the look is a mode, switched whole.** A picture copies one named snippet
    whole (house teal, or ink mode once promoted); never a hex chosen in flight, never two modes
    in one drawing · a one-off fill · the snippet, copied whole; the lint refuses a `classDef` hex
    outside a checked-in snippet.
12. **The glint: one loud thing, and it is the decision.** Exactly one element carries the
    accent, at the point where the reader decides or reacts; the one allowed exception is the
    defect beside the decision · three coloured boxes · the fork gets the accent, the rest is paper.
13. **Narrow the drawing first; then the font.** Text on a phone is 390 ÷ drawing width × font ·
    10.6 px effective on a 720 px drawing · lines of about 16 characters,
    `config: flowchart: { nodeSpacing: 24, rankSpacing: 36, padding: 10 }`, and
    `classDef default font-size:20px,font-family:Verdana`, the one font lever that works on
    flowchart and erDiagram (frontmatter `fontSize` is a no-op for flowchart text).
14. **In a state diagram the removed path is a note, not an edge.** State diagrams cannot dash a
    transition · a before that lives only in the caption · `note left of <new state>` reading
    "was: …"; the note's dashed link is the delta mark.
15. **A C4 context puts the system's boundary in the middle.** Layout follows declaration order ·
    relation labels drawn over other boxes · declare the boundaries left, centre, right in the
    order the edges leave the system; `Rel_L` / `Rel_R` / `Rel_U` / `Rel_D`.
16. **A composite state takes a classDef on 11.17.2.** The docs say it cannot · none · use it;
    `class S5 current` on a composite renders the thick stroke.
17. **A gitGraph is for branch topology, vertical on a phone.** `gitGraph TB:` with
    `rotateCommitLabel: false` · rotated tags overlapping at 390px · vertical; and never for a story
    about a choice (rule 10).
18. **The second layer: a spine that reads in ten seconds, then detail that rewards the second
    look** (Eric, 2026-09-26: "I expected more fine grained elaborate detail"; his pick, "both", by
    surface). On a PR's opening frame every node carries a bold headline and one line of fact
    beneath it, no new boxes, so the phone width holds. On a page with room, boxes of detail sit
    beside the spine (a checklist as a vertical column, what it replaced in its own box). At desk
    width, both. Every line of detail names something true the reader could act on · a spine that
    answers no second look, or detail that shrinks the spine below a phone read · the second line
    first, boxes only where the width allows; a markdown string in a classic label needs the
    backtick form (`["\`**bold**<br/>fact\`"]`), a `@{ label: }` shape takes it bare.

**Dark mode:** the default is NO `theme`, no `themeVariables`, no hex — GitHub picks light or dark
from the page, and a pinned theme freezes one of them (the lint fails `theme:` in frontmatter and
in `%%{init}%%`, which is deprecated upstream anyway). Emphasis that survives both modes and a
colourblind reader is *achromatic*: a thick edge (`==>`) for what is new, a dotted one (`-.->`) for
what is removed, a `subgraph "this PR"`, a diamond for a fork, `@{ shape: cyl }` for a store — never
a colour alone (`BRAND.md` → *Accessibility*). Brand-styled mermaid is allowed only via a
contrast-verified snippet checked in here, never improvised per-PR (hand-picked hex that looks
right in one theme breaks in the other — that exact drift already shipped once).

**The one sanctioned colour snippet** (promised here on 2026-08-20, checked in 2026-09-25 — verified
by `tests/ui/mermaid-classdef.spec.ts` against both of GitHub's canvases with the same formula the
app's tokens pass): the fill and the text are fixed together, so their 7.4:1 never depends on the
theme; the 3px stroke carries the boundary in light mode and the fill carries it in dark; `removed`
and `changed` live in the stroke alone. Copy it whole; never pick a hex in flight.

```mermaid
flowchart LR
    a[existing step] ==> b[new step]:::new
    a -.-> c[old step]:::removed
    b --> d[adjusted step]:::changed
    classDef new fill:#35D0BA,color:#04302B,stroke:#04302B,stroke-width:3px
    classDef removed stroke:#5A6B7B,stroke-width:2px,stroke-dasharray:6 4
    classDef changed stroke:#0E9F8C,stroke-width:3px
```

The colours are `BRAND.md` tokens — `--accent` and `--accent-contrast` for *new* (teal is the
machine/system signal), `--muted` (light) for *removed*, `--accent` (light) for *changed* — never
`--pos`/`--neg`, which mean profit and loss and nothing else.

**The second look, promoted: ink mode** (the Claude Design round-3 session, 2026-09-26, plan
#3786; the palette of a sumi-ink frame with one gold; promoted by Eric the same day, "promote.
Phone looks fine"). Paper for what exists, gold for the one decision, seal red for a defect beside
it, the house `removed` unchanged. Every class holds ≥ 4.5:1 text on fill and ≥ 3:1 boundary on
both GitHub canvases (`tests/ui/mermaid-classdef.spec.ts` verifies every snippet on this page); the
seal red's stroke is light because its fill and a dark stroke both sat under 3:1 against GitHub's
dark canvas. **Scope:** decision pictures — a PR's opening frame or a held PR with a fork in it,
where gold marks the one decision and red marks a defect beside it (rule 12); architecture and
flow pictures keep the teal. A look is a mode, switched whole (rule 11): a picture uses the teal
snippet or this one, never both, and the lint refuses any hex outside either. The generated held-PR
pictures (`scripts/platter-picture.mjs`) wear it.

```mermaid
flowchart TD
    a["what exists"]:::paper ==> b{"the decision?"}:::gold
    b ==> c["done"]:::paper
    b --> d["the defect beside it"]:::defect
    a -.-> e["the old path"]:::removed
    classDef paper fill:#F4EFE6,color:#141210,stroke:#141210,stroke-width:3px
    classDef gold fill:#E0A33A,color:#1A1300,stroke:#1A1300,stroke-width:3px
    classDef defect fill:#B3261E,color:#FFF4EC,stroke:#FFF4EC,stroke-width:3px
    classDef removed stroke:#5A6B7B,stroke-width:2px,stroke-dasharray:6 4
```


## Screenshots — mechanics that keep pictures alive

- **≤100KB JPEG**, committed under `docs/shots/pr-<n>/` (the ship gate fails anything larger —
  screenshot weight is permanent git history, the one irreversible cost here).
- **SHA-pinned raw URL only:** `https://raw.githubusercontent.com/<owner>/<repo>/<40-hex-sha>/docs/shots/...`.
  `scripts/ship.sh open` pins this automatically from `HEAD`. Never hand-write a branch-name URL —
  the branch deletes at squash-merge and the picture 404s from the permanent record within a day
  (empirical: PR #446's screenshots, the flagship fridge PR, were dead by 2026-08-20).
- **One representative frame per changed surface**; prefer a before/after composite (one file)
  over a gallery. Side-by-side via a 2-column GFM table of `<img width="49%">`.
- **`docs/shots/` holds only the frames a PR's picture slot needs.** A showcase for humans (a
  before/after gallery, a demo reel for a colleague) goes on the issue or the PR as a comment,
  never into the tree (Eric, 2026-09-26, on #3760: "the before and after don't need baked into
  source code; github issue would've been adequate"). Attach via SHA-pinned raw URLs from the
  commit that carried them, so a revert of the tree copy leaves the comment intact.
- **Trading surfaces shoot the phone frame first** (the ticket, the options chain, the milestone
  strip — CLAUDE.md → *Mobile-first on the trading surfaces*, Eric 2026-09-05): pass
  `viewport: { width: 390, height: 844 }` to the harness for the first frame and the default
  desktop viewport for the second. The phone frame is the one that proves the curation; the
  desktop frame proves it expanded instead of floating.
- The shoot scripts live in [`scripts/shoot/`](../scripts/shoot/) — one per surface (`npm run
  shoot:login`, `shoot:feedback`, `shoot:onboarding`, …), each just fixtures and frames over the
  shared harness in `scripts/shoot/lib.mjs` + `shell.mjs`. The harness carries the JPEG quality
  ceiling, so fix size problems there, not by hand-recompressing.
- **A new `/app/*` surface needs a script, not a waiver.** Copy the shortest existing one
  (`scripts/shoot/feedback.mjs`, ~50 lines), swap the stubs and the frames, add its `shoot:<name>`
  npm script. #1308 and #1312 both shipped with "Picture: waived" because no script existed for the
  surface they changed — that is the cost this harness was built to remove (#1327).
- **Before/after pairs of diagrams: `npm run shoot:mermaid-pairs -- <pairs.json> <outdir>`.** Use
  it when the argument *is* the comparison — a diagram grammar's before and after, a table redrawn
  as the diagram it should have been, a showcase contender for a colleague. It renders each pair
  with the pinned Mermaid (GitHub's version) on GitHub's own light and dark canvases, lints every
  diagram first (a failure is a "Did not render" panel, never an empty box), crops to the frame
  and writes a `<id>.json` sidecar (caption, alt text, bytes, dimensions, lint) to build the
  gallery comment from. Scale 1 fits the 100KB budget; `--scale 1.5` is the crisp shareable set;
  `--layout stacked` is the phone read. **The pairs file for a showcase lives on its issue, not in
  the tree** — the only committed one is the spec fixture, `tests/fixtures/mermaid-pairs/example.json`.

**The fold is not guaranteed to survive even through `ship.sh`/REST — always re-fetch and check.**
The GitHub **MCP** write tools strip `<details>`/`<summary>` outright while leaving `<img>` and
tables intact, and still report success (`LESSONS.md`, 2026-08-25) — ship through `/ship`, not
those, as the first line of defense. But `LESSONS.md` (2026-08-26) found the fold ALSO stripped
twice through `ship.sh`'s own plain REST path, on a real full-size PR body — the trigger isn't
characterized (a short isolated test body kept its fold; the real PR body didn't, both times), so
"REST preserves it" is necessary but not proven sufficient. `ship.sh checkbody` cannot catch either
case: it lints the body *file*, not what GitHub stored. After ANY automated body write, re-fetch and
check for the literal `<details>` tag; if it's gone, flatten to plain sections rather than retrying
the same call.

**A screenshot embed can vanish even through `ship.sh` — a session-side content-safety layer, not a
repo bug.** Confirmed 2026-08-26: `![alt](url)` and even a plain `[text](url)` pointing at anything
that reads as a media file gets neutralized in flight — the `!` sometimes dropped, the URL wrapped in
backticks — for BOTH `raw.githubusercontent.com` and `github.com/.../blob/...` hosts, verified via
direct REST probes (a bare-text mention of the same URL, no markdown link syntax, survives
untouched). This is outside repo control — don't try to out-clever it (URL tricks, alternate syntax).
When an embed comes back mangled after a re-fetch: use the waiver line instead
(`Picture: waived — <reason>`), name the committed `docs/shots/...` path in prose so a reader can
open it from the PR's own Files-changed tab (a native diff render, unaffected by this), and send the
image directly to the user in-session (`SendUserFile`) so the fridge rule is still met live, even
though the PR body itself can't carry it.

## Alerts — the caution budget

GitHub renders `> [!NOTE]` `> [!TIP]` `> [!IMPORTANT]` `> [!WARNING]` `> [!CAUTION]` as colored
callouts. They break when indented or nested inside `<details>` — always top-level. Budget: **one
per PR**, and `WARNING`/`CAUTION` are *reserved* for the irreversible class (workflow files,
credentials, spend, outward-facing). On a carve-out PR the WARNING comes **before** any
accomplishment framing — blast radius first is the honest inversion of fanfare-first.

## The honesty rules — what no gate can replace

The repo's hard invariant — *never let a flourish imply something false* — applied to pictures:

1. **Grounding:** every node, edge, and label names a real file, route, event, or behavior present
   in this diff. A diagram is a claim; an ungrounded diagram is a lie with good kerning.
2. **No verdicts:** the picture states *what changed*, never how good it is. Judgment belongs to
   the reader (and the telestrator).
3. **Provenance in the caption:** every picture carries a one-line plain-language caption naming
   what it shows and where it came from — e.g. `_Caption — before/after of /login, from npm run
   shoot:login output_`. The caption is also the degradation story — it's the only element that
   survives email, mobile notifications, and raw-text renderers.
4. **Proportionality:** gold-standard treatment on a 5-line config change implies something false
   about the diff. Match picture weight to change weight — or waive.
5. **What lands, at the moment it is read:** a picture of a mechanism draws what the code and
   the platform actually do, as of when the reader sees it. A PR's opening picture draws the
   choice; what landed is a second picture, generated after, in whichever ending is true. The
   held-PR starter drew a merge commit for platters that squashed (#3754) until the design rounds
   redrew it as the choice at open time and the record after landing; where a picture is
   generated from the data beside it, it cannot drift.

## Where else this grammar applies

- **Digests** (`docs/digests/`): a picture slot ratchets in only after the digest loop itself is
  proven live — never decorate a dead instrument.
- **Journeys** (`docs/JOURNEYS/`): pictures are *offered, never required* — the open-forks map and
  spine scoreboard snippets live in `docs/JOURNEYS/TEMPLATE.md`. A journey that fires beats a
  journey that's pretty.
- **Plans / handoffs / issues:** same decision table, same honesty rules, same waiver right — plus
  the issue-specific rules (a proposed diagram is captioned as proposed; GitHub hosts issue
  screenshots, so the ≤100KB git-history rule does not apply) in [`ISSUES.md`](ISSUES.md).
- **Research** (`docs/research/`, `docs/research/events/`): the fridge rule reaches here too, and
  arrived last (2026-08-25 — Eric: *"the researched events present walls of text that are difficult
  to read"*). A research document's picture slot is its **decision header**: the TL;DR plus the
  five-column call sheet — call · confidence · why · dated falsifier — which the `hasPicture` rule
  already counts as media, because a table is scanned where the same content as prose is skipped.
  A mermaid map earns its place when the argument is a *structure* (a constraint chain, a reaction
  function); [`research/ai-hardware-constraints-aug-2026.md`](research/ai-hardware-constraints-aug-2026.md)
  is the worked example. Everything downstream of
  the decision — method, instrument runs, the append-only assessment ledger — is **folded by the
  renderer**, not by the author: `/research` collapses those sections automatically, so a document
  nobody rewrote still opens on its call. Gated by `npm run research:lint`; contract in
  [`process/EVENT-RESEARCH.md`](process/EVENT-RESEARCH.md).
