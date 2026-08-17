# Event research — the assessment discipline behind the market-event calendar

The foresight loop: an event lands in the calendar (`src/domain/market-events.ts`, or a print in
`src/domain/earnings-calendar.ts`) → initial research asks *what is likely to happen and how will
the market react* → periodic reassessments hunt new information and adjust the stance — at a
frequency that ramps with impact × time-to-event (`assessment-cadence.json`) — until the
event passes and gets one closing outcome assessment. `scripts/event-scan.mjs` decides *when*;
this doc defines *what* each assessment does. The daily event-scan Routine (docs/ROUTINES.md)
executes it; a human session following this doc by hand is equally valid.

**Adding an event is the trigger.** Ship it as an ordinary PR; the scanner's `never-assessed`
rule makes it due on the next cycle (and `.github/workflows/postmaster.yml` opens an
`[event-research] <id>` issue within seconds of the merge). No other ceremony.

## The three assessment modes (keyed to the scanner's `reason` field)

### `never-assessed` → initial research

Produce `docs/research/events/<id>.md` from `docs/research/events/TEMPLATE.md`. The genre is
[`nvda-aug-2026-print.md`](../research/nvda-aug-2026-print.md): the question stated plainly →
one-line verdict → method → each conviction leg tested to SUPPORTED / MIXED / REFUTED with
sources and dates → what plays the conditions support → honest limits. End with a stance, its
kill switches, and the first ledger row. Instruments by kind:

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

### `event-passed-unscored` → close-out

Fill the ledger's `## Outcome` section within the close-out window (`closeOutWithinDays`): what
actually happened vs the stance, scored **from re-run instrument data, never from memory of the
tape**. Score any forward tests this event carried in
[`forward-tests.md`](../research/forward-tests.md) (a scored kill moves to the sweep doc's kill
list). Once `## Outcome` exists the scanner goes silent on the event forever.

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
