# Folding the observatory

A data-architecture study of the Skynet Capital observatory: which screens existed, what each
actually rendered, and where elegant folding reduced the surface without raising cognitive load.
Authored as a Claude Design handoff (2026-08-25) and shipped the same day as eight slices
(PRs #549–#555); this is the memo of record — the *why* behind the fold, kept where members can
read it.

## The premise

Elegant design lets us consolidate information into fewer screens without increasing cognitive
load or system complexity. The test applied here: **a fold is legitimate when two views render
the same dataset in different shapes; it is a lie when it papers over views with different
inputs and different reasons to be empty.** The app was already disciplined about the second
half (see `src/observatory/desk-tabs.ts`, `docs/research/trading-desk-ux.md`) — this study kept
that honesty and applied the first half.

## The data architecture

Every observatory surface renders one or more of five datasets. Mapping views to inputs is the
whole argument:

| Dataset | Produced by | Views rendering it before the fold |
| --- | --- | --- |
| **SNAPSHOTS** | one Alpaca account read per participant | **Board, Leaderboard, Bots vs Humans, Compare** — four shapes of the same read: grid, sort, group-by-kind, pick-two |
| **FILL LEDGER** | durable order records → FIFO round trips | **History** (the trips + the raw log), **Analysis** (statistics over the same trips) |
| **EQUITY SAMPLES** | periodic equity recordings | **Metrics** (curve, windows, drawdown, doubling) |
| **MARKET EVENTS** | checked-in, hand-verified event table | **Calendar** |
| **RESEARCH DOCS** | reviewed ledgers & studies in git | **Research** — and every event row already cross-linked a ledger |

Two clusters stood out. Four navigation entries rendered **SNAPSHOTS** alone — the shape
changed, the data never did. And **MARKET EVENTS** ↔ **RESEARCH DOCS** were two halves of one
question ("what's coming, and what do we think about it?") already joined by per-row links in
both directions.

## The folding rule

**One screen per question, one lens per shape.** Same dataset, different shape → a lens on one
URL (a `?by=` sort, a `?a=&b=` pair), never a second nav entry. Different dataset → separate
section with its own honest empty state, on the same screen only when the questions compound.
Different *action* (trading vs. observing) → always a separate surface. Everything stays plain
links — every state shareable, back/forward-friendly, zero JS required, exactly the discipline
the app already followed within its views.

## Before → after

**Before — 9 nav views:** Board (snapshots · grid) · Leaderboard (snapshots · ranked) · Bots vs
Humans (snapshots · cohorts) · Compare (snapshots · pick two) · Calendar (events · agenda +
grid) · Research (docs · shelf) · Trade · You · Learn. **Desk — 5 member tabs:** Overview ·
Active · History (fill ledger · trips + log) · Analysis (fill ledger · statistics) · Metrics
(equity samples).

**After — 5 nav views:**

- **Portfolio** — the member's home, first in the nav: every owned account under a
  combined-equity strip at `/u`, each row opening that desk (`/u/:id`).
- **Standings** (`/`) — match bar + cohorts + the ranked field as rows; compare is a picked
  pair in the URL (`?a=&b=`), the metric a lens (`?by=`).
- **Trade** — acting ≠ observing: kept separate, streamlined for the first play with three
  starter chips (`?starter=` — deliberately its own param, never `?play=`, whose codes are the
  academy's course catalog).
- **Research** (`/research`) — the stance leads, the event horizon follows, a rolling month
  grid navigates: one "what's coming" surface.
- **Learn** — untouched.

**Desk — 3 member tabs:** Overview · Active · **Performance** (curve + measures pinned up top,
round trips below, raw fills folded as receipts — each section still names its own input and
goes empty for its own reason).

## The hard case: Analysis + Metrics

The repo argued the split was load-bearing: Analysis needs **closed round trips**, Metrics
needs **recorded equity samples** — a new member with three open positions has a full metrics
board and an empty analysis board, and "one empty state must not be papered over by the
other's numbers" (`docs/research/trading-desk-ux.md`). The argument was right about *merged
numbers* and wrong about *merged screens*: the failure mode is a single blended scorecard, not
co-presence. The Performance tab keeps the datasets in separate sections that each name their
input and render their own honest empty state — the curve panel goes empty for one reason
while the trades panel goes empty for another, side by side, with neither lying about the
other. What stays deliberately unmerged: no single "score" blending the two (the measures stay
separate and named), and the raw order log stays folded beneath the trips as receipts, not
promoted beside them.

## Deliberately not folded

**Trade.** Acting and observing are different modes with different failure costs; the
ticket → review → confirm flow keeps its own surface, one click from everywhere. **Active.**
The blotter row is the unit of interaction and its actions live on the row — it answers "what
am I in right now," which no other view answers. **Learn, Feedback, account management.**
Different jobs entirely. **What the field dropped.** The ranked field is a ladder of rows, not
a grid of cards — comparison is vertical scanning, and the whole league fits on one screen. A
row carries rank, the metric, and the bar; everything else lives one click away on the desk
the row links to.

## Onboarding: the shortest path to a first trade

Before, a new member reached their first trade through the academy: welcome → connect
account → the founding CTA pointed at **Learn** → find the milestone → its ticket link →
review. Six surfaces, with a curriculum standing between the member and the thing that teaches
best — doing one small trade with a safety net.

Now the **starter plays** are plain links on the ticket itself (`/trade?starter=spy100`),
pre-filling a guided order. The play carries the sizing, the review step carries the lesson,
and the academy stays where it belongs — deepening skills after the first trade, not
gatekeeping it. The one step that was never negotiable (review before send) is the one that
remains.

## Trimmed: the empire skylines on comparison surfaces

The living-universe cityscape used to render on cohort cards and the head-to-head. It spent
the most valuable real estate on those surfaces ahead of its value: it encoded nothing the
rows didn't already say, and at thumbnail size it wasn't readable as data. Trimmed from every
comparison surface — the rows and measures reclaimed the space. The concept isn't dead: the
individual desk keeps its skyline, and the full treatment returns when the world layer earns
it (ceremonies, the login threshold), not as a default row on data views.

## Receipts

| Question | Before | After |
| --- | --- | --- |
| Who's winning, and by how much? | Leaderboard, then Bots vs Humans for the cohort read — 2 views | Standings, one glance: match bar → cohorts → ranks |
| How do these two stack up? | Compare → pick A → pick B — 3 loads on a separate view | two taps on the rows already in front of you |
| Is it safe to hold through next week? | Calendar for dates, Research for the stance — 2 views | Research: the stance and the date share a screen |
| Am I any good, and is the account growing? | Analysis + Metrics + History — 3 tabs | Performance: one scroll, three honest sections |
| New member: first trade placed | welcome → add → Learn → milestone → ticket → review — 6 surfaces | starter chip → guided ticket → review — 3 |

Net: **9 nav views → 5** · **5 member desk tabs → 3** · every fold is a URL state, so nothing
stopped being shareable, and no dataset lost its own empty state. System complexity fell with
the screen count: fewer routes, same renderers, same links-only architecture. Old bookmarks
survive — `/leaderboard`, `/bots-vs-humans`, and `/compare` all 302 to Standings with their
params carried over.

## Grounding

Repo: `src/observatory/desk-tabs.ts` (the split rationale), `docs/research/trading-desk-ux.md`
(the four-surface convergence across tastytrade, Robinhood, thinkorswim, TradeZella,
Tradervue; the Baymard review-step finding; FIFO round trips per the IRS default),
`docs/DASHBOARD.md`, `src/observatory/dashboard-shell.ts` (drawer IA),
`src/observatory/research-view.ts` (the widget-navigates-agenda pattern this study extended to
Research and Standings). Patterns applied: overview-plus-detail and progressive disclosure —
summary first, detail in place, receipts folded — with URL-addressable state standing in for
client-side interactivity.

*Consolidation study · design handoff built in Claude Design, implemented in eight slices ·
all figures SIM.*
