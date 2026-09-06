# <title> — <event-id>

**Kind:** <kind> · **Date:** <YYYY-MM-DD> (<confirmed|estimate>, <source>) · **Impact:** <tier>
**Last assessed:** <YYYY-MM-DD>
<!-- probe-ref: {"symbols":{"<SYM>":<price>},"vix":<vix>,"daysBand":"<tier>:<minDaysOut>+","adjacentIds":[],"screenStreak":0,"blocked":[]} -->

<!-- The `**Last assessed:**` line is scripts/event-scan.mjs's machine contract — update it with
     every assessment, or the scanner will keep marking this event due. Process:
     docs/process/EVENT-RESEARCH.md.

     The `<!-- probe-ref: {...} -->` line right after it is scripts/event-material-scan.mjs's
     contract (issue #724) — the deterministic screen's reference state for THIS event: the last
     recorded price for each symbol in the table row, the last VIX reading, the cadence band label,
     the adjacent-event ids known at the time, and how many consecutive pulses have been screened
     (not researched) in a row. Populate it with today's real readings when writing THIS initial
     research (it is what lets the event's very next `interval-elapsed` pulse be screenable instead
     of automatically material) — never hand-invent numbers, pull today's actual price/VIX the same
     way the adjacency sweep already does. Every later pulse (screened or full-session) REPLACES
     this line in place with fresh readings; it is free-standing current state, not an append-only
     row like the ledger table below. A screen writes it mechanically; a full session should refresh
     it too when appending its own row, so the streak resets and the baseline stays current. See
     docs/process/EVENT-RESEARCH.md's "Deterministic screening" section for the full contract.

     `blocked` (issue #1711) records every failed fetch of a cited source this event's research has
     hit — egress block, 403, 5xx, whatever the tool reported — as
     `{"url": "...", "status": "EGRESS_BLOCKED" | "403" | "503" | ..., "at": "YYYY-MM-DD"}`. Every
     failed fetch of a cited source is recorded here, the ledger's source prefix downgrades to the
     secondary's actually used (`NYSE:` → `NEWS:`), and a blocked source is never silently replaced
     — see docs/process/EVENT-RESEARCH.md's "Honesty rules" for the full rule.

     Delete the intro comments (not the probe-ref line) when instantiating. -->

## At a glance

<!-- The decision header the /research page promotes above the document (research-service extracts
     this exact section). A FAITHFUL surfacing of the stance below — never a new claim, and every
     trading-adjacent line still carries the event's confirmed/estimate label. Gated by
     `npm run research:lint`. Three parts:
       1. **TL;DR.** one plain-language paragraph — the verdict a non-expert can act on.
       2. The five-column horizon table below. Today / This week / This month / This quarter,
          each with an honest `Call` (stand aside · watch · flat the print · accumulate small ·
          avoid — never a directional "buy" the evidence doesn't support), a stated `Confidence`,
          a one-line Why, and the dated observation that would prove the call wrong.
       3. **Signals & conditions** — the buy/sell/hold triggers, drawn from the stance's kill
          switches and dated watch-list. Keep it to what the body already justifies; one short
          line each. -->

**TL;DR.** <one plain-language paragraph — what to do, and why, for someone who reads nothing else>

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | <call> | <high/medium/low> | <one line> | <the dated observation that kills it> |
| This week | <call> | <high/medium/low> | <one line> | <dated> |
| This month | <call> | <high/medium/low> | <one line> | <dated> |
| This quarter | <call> | <high/medium/low> | <one line> | <dated> |

<!-- The three rules that keep calls honest rather than merely confident (CLAUDE.md):
     · Confidence is stated and DRIVES SIZE — a low-confidence call is a stand-aside, never a small
       version of a high-confidence one.
     · Every call carries its falsifier WITH A DATE, so the tape adjudicates instead of the story.
     · "Don't" is a first-class call — an honest sheet is often mostly refusals, and in a
       compounding book refusals are P&L. -->

**Signals & conditions** — the buy/sell/hold triggers:

- <trigger, one short line>

## Initial research

<!-- Genre: docs/research/nvda-aug-2026-print.md — the question plainly → one-line verdict →
     method → each conviction leg tested to SUPPORTED / MIXED / REFUTED with sources and dates →
     what plays the conditions support → honest limits.

     This section is FOLDED on the /research page — the reader lands on the decision header and
     opens the method only if they want it. That is a presentation guarantee, not a licence to
     ramble: use `###` subheads so the opened fold is navigable, and keep a paragraph a paragraph.
     Nothing here is hidden from the next assessment session, which reads the raw markdown. -->

## Stance & kill switches

<!-- The current position on this event, each trading-adjacent statement carrying the event's
     confirmed/estimate label. Every stance names the observation that would kill it. Predictions
     with a score-by date also register as a row in docs/research/forward-tests/<event-id>.md —
     THIS event's own fragment, id FT-<event-id>-<n> (docs/research/forward-tests.md → "How to
     register"); never in the index itself, never in another event's file. -->

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-<this-event-id>.json` (`status: "estimate"`) in the
same PR — your own file, never another event's canonical one (#1717). Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
