# Event research — the assessment discipline behind the market-event calendar

The foresight loop: an event lands in the calendar (`src/domain/market-events.ts`, or a print in
`src/domain/earnings-calendar.ts`) → initial research asks *what is likely to happen and how will
the market react* → periodic reassessments hunt new information and adjust the stance — at a
frequency that ramps with impact × time-to-event (`assessment-cadence.json`) — until the
event passes and gets one closing outcome assessment. `scripts/event-scan.mjs` decides *when*;
this doc defines *what* each assessment does. The event router's event-research lane
(`.github/workflows/moneypenny-events.yml`, ticked by every merge to main — registered in docs/ROUTINES.md)
executes it; a human session following this doc by hand is equally valid.

**Adding an event is the trigger.** Ship it as an ordinary PR; the scanner's `never-assessed`
rule makes it due on the next cycle (and `.github/workflows/moneypenny-events.yml` opens an
`[event-research] <id>` issue within seconds of the merge). No other ceremony.

**Place the entry by date, not at the end.** `MARKET_EVENTS` is stored in `(date, id)` order and
`node scripts/event-scan.mjs --validate` fails a PR that breaks it (red inside `npm test`). This is
a merge fix, not tidiness: appending every new event to the end of the array put two concurrent
research lanes at the same anchor line — the one case plain git cannot merge, and the reason 22 of
47 PRs touching this file were flagged conflicted at a median 13.4 h to merge (#1324). Date-ordered
entries land at different anchors and merge clean on GitHub's own server-side merge, which never
runs the custom driver. If the gate flags you, `node scripts/sort-market-events.mjs` fixes the file.

## The three assessment modes (keyed to the scanner's `reason` field)

### `never-assessed` → initial research

Produce `docs/research/events/<id>.md` from `docs/research/events/TEMPLATE.md`. The genre is
[`nvda-aug-2026-print.md`](../research/nvda-aug-2026-print.md): the question stated plainly →
one-line verdict → method → each conviction leg tested to SUPPORTED / MIXED / REFUTED with
sources and dates → what plays the conditions support → honest limits. End with a stance, its
kill switches, and the first ledger row. Open with an `## At a glance` decision header (TL;DR +
horizon table + signal conditions) — the `/research` page promotes it above the document; it is a
faithful surfacing of the stance below, never a new claim (see the TEMPLATE). Instruments by kind:

- **earnings / symbol-keyed** — `node scripts/research/earnings-cycle.mjs <SYM> --bench QQQ
  --peers <PEERS>` + `node scripts/research/intraday-edges.mjs <SYM>`, read against the house
  playbooks (S1/S2/E1/S3/S4 + G1) and the kill list in
  [`multi-symbol-sweep.md`](../research/multi-symbol-sweep.md) — never re-propose a killed
  hypothesis without new prints. For a full workup, the `symbol-sweep` workflow adds the
  red-team pass.
- **macro-print / sector / geopolitical** — sourced web research (primary sources over
  aggregators; the seeding of this calendar caught an aggregator publishing a wrong CPI date —
  cite the primary and the check date). Establish: consensus expectation, the whisper if
  findable, the market's recent reaction function to surprises in each direction, and which of
  our tracked names carry the most sensitivity.

### `interval-elapsed` → pulse check

Append **one** row to the ledger table and update the `**Last assessed:**` line. A pulse check
answers: *what changed since the last row, and does the stance survive it?* Every row runs the
**adjacency sweep** — the checklist below — because adjacent events are exactly the new
information Eric's brief calls out. Keep rows terse; a stance *change* earns a sentence in the
Stance section with the row as its receipt.

**Adjacency sweep (mandatory, every pulse):**

1. **Peer prints** — did a peer report or move guidance since the last row? (Measured to matter:
   NVDA-sympathy gaps supplied ~70% of MRVL's pre-print window return.)
2. **Macro surprises** — CPI/FOMC/jobs prints since the last row, and the market's actual
   reaction vs expected.
3. **Volatility regime** — VIX level/term structure vs the last row; a regime shift changes what
   any options-shaped play costs. (No date → not a calendar event; it lives here.)
4. **Geopolitical / policy** — export controls, tariffs, conflicts touching the event's symbols
   or their supply chains.
5. **Event-specific tape** — consensus drift, whisper moves, implied-move changes, unusual
   positioning commentary.

Any adjacent event with a **date** discovered during the sweep is PROPOSED as a new
`market-events.ts` entry **in the same PR**, always `status: "estimate"` (`EST:`/`NEWS:` source)
— never `confirmed` without a primary source. That proposal is how the calendar feeds itself.

**Not every `interval-elapsed` pulse reaches a session** — see "Deterministic screening" below.

### `event-passed-unscored` → close-out

Fill the ledger's `## Outcome` section within the close-out window (`closeOutWithinDays`): what
actually happened vs the stance, scored **from re-run instrument data, never from memory of the
tape**. Score any forward tests this event carried in
[`forward-tests.md`](../research/forward-tests.md) (a scored kill moves to the sweep doc's kill
list). Once `## Outcome` exists the scanner goes silent on the event forever.

## Deterministic screening (issue #724) — not every due pulse spends a session

`scripts/event-scan.mjs` decides **when** a pulse is due; `scripts/event-material-scan.mjs`
decides **whether it needs a Claude session at all**, for `interval-elapsed` pulses only (a
`never-assessed` initial research and an `event-passed-unscored` close-out are never screened —
both always dispatch, same as before this existed). It runs between the two in
`.github/workflows/moneypenny-events.yml`'s `route` job: a screen writes its own ledger row and commits
it directly, without spending a session; anything else falls through to the full pulse-check
protocol above, unchanged.

**The reference block.** Every ledger's header carries a machine-readable line right after
`**Last assessed:**`:

```
<!-- probe-ref: {"symbols":{"NVDA":182.43},"vix":15.2,"daysBand":"critical:8+","adjacentIds":[],"screenStreak":0} -->
```

This is the probe's one source of truth for "what did we see last time" — embedded in the ledger
itself (not a sidecar file), because the ledger is already this system's single source of truth
per event. It is **replaced in place** on every pulse (screen or full session), never appended —
distinct from the assessment ledger table, which stays strictly append-only. `TEMPLATE.md` shows
where it goes; **initial research must populate it with real readings**, or the event's first
`interval-elapsed` pulse has nothing to diff against and is automatically material (the safe
default — see below) rather than a wasted "establish the baseline" session.

**What counts as material** (the defaults `scripts/event-material-decide.mjs` ships with, chosen
because Eric approved "use the proposed defaults" before a concrete one existed — full reasoning
in that file's header):

| Check | Default | Why this number |
|---|---|---|
| Underlying price move | ≥ 5% since the last recorded price, per tracked symbol | past ordinary daily noise for this calendar's names; peers are NOT probed (v1 simplification — a full session's adjacency sweep still checks them by hand) |
| VIX regime | ≥ 3 points absolute since the last recorded reading | this calendar's own ledgers already treat a few-point VIX move as regime-relevant |
| Cadence band transition | any change in the matched `assessment-cadence.json` band | a tightening/loosening interval is itself information worth a real look |
| New adjacent event | any calendar entry within 5 days of this event's date not seen on the last pulse | the same "corridor" framing the adjacency sweep already uses by hand |
| Staleness ceiling | every 3rd consecutive screen is forced material regardless of readings | an event can never coast on screens forever; a real session re-establishes the baseline at least that often |
| No reference block | always material (`no-reference-baseline`) | nothing to diff against — the safe default, never a guess |
| Probe fetch failure | always material (loud failure) | "broken ≠ quiet" — the same doctrine `event-scan.mjs` already enforces |

**The honesty invariant.** A screened row is a mechanical check, never a verdict — it is worded
`**Deterministic screen (no Claude session).**` followed by the raw readings and "nothing tracked
crossed its threshold," and its Stance-change column reads `— (screen; no assessment made)`. It
must never be worded to imply "no change" or any other conclusion an actual assessment would
draw — see CLAUDE.md's domain-accuracy-and-honesty principle. `scripts/event-material-scan.mjs`'s
own header and `tests/scripts/event-material-scan.spec.ts` enforce this wording mechanically.

## The decision header is gated (`npm run research:lint`)

A ledger without a usable call sheet fails the gate. `docs/ISSUES.md` measured why this is needed:
*"the PR surface got a template, a guide and a gate; the issue surface got none of the three, and
the numbers track that difference and nothing else."* Ledgers had the template and this guide, and
15 of 52 still carried no decision header — so the `/research` page had nothing to promote and a
reader landed on the method wall. The gate is the third thing.

What it checks, and what it deliberately does not:

| Gated (fails) | Advisory (a note) |
|---|---|
| the `# `/`**Kind:**`/`**Last assessed:**` header lines | a decision header past ~2,400 chars |
| an `## At a glance` (or study `## The call`) section exists | a signal bullet past 160 chars |
| a **TL;DR.** paragraph and a **Signals & conditions** list | a falsifier naming no date or number |
| a table with `Call` · `Confidence` · `Proves it wrong` columns | an assessment row past ~1,200 chars |
| all four horizons present, each with a graded, non-empty call | |

Structure fails; prose length only informs. That split is on purpose — `docs/IDEAS.md` banks the
caution to *measure whether long entries actually hurt before gating a capture surface, and never
tax the habit*. The habit here is assessment; what gets taxed is a missing decision, not a long one.

`node scripts/research-lint.mjs --candidate` names the single highest-leverage ledger to fix, the
same way the other fitness eyes name their own targets. The budget in `research-budget.json` only
ratchets down.

**Reading is the renderer's job, not the author's.** `/research` folds `## Initial research`, the
`## Assessment ledger` and `## Outcome` into `<details>`, leaving the decision header and the live
stance open. So a document nobody has rewritten still opens on its call — and nothing is hidden from
the next assessment session, which reads the raw markdown where a fold costs it nothing.

## Cache discipline (the stale-data trap)

`earnings-cycle.mjs` and `intraday-edges.mjs` cache **permanently** under `node_modules/.cache/`.
A recurring pulse check that re-runs them without busting the cache reads week-old data and looks
fresh. **Before any assessment-driven instrument re-run:**

```
rm -rf node_modules/.cache/earnings-cycle node_modules/.cache/intraday-edges
```

## Honesty rules (inherited, non-negotiable)

- **Research is not action.** An `estimate` event still gets researched; but every
  trading-adjacent statement in a ledger carries the event's confirmed/estimate label, and
  date-keyed *action* requires `confirmed` (the date policy,
  [`trade-playbooks.md`](../plans/trade-playbooks.md) decision log).
- **Ledger rows are append-only.** Editing a past row or a registered prediction after the fact
  is falsification and never happens (the forward-tests rule, verbatim).
- **Estimates only widen caution.** A cadence estimate may pull an assessment earlier or extend a
  flat window; it never licenses an entry.
- **Source prefixes are the audit trail** — see the header of `market-events.ts`. `--validate`
  enforces them in CI.
