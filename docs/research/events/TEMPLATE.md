# <title> — <event-id>

**Kind:** <kind> · **Date:** <YYYY-MM-DD> (<confirmed|estimate>, <source>) · **Impact:** <tier>
**Last assessed:** <YYYY-MM-DD>

<!-- The `**Last assessed:**` line is scripts/event-scan.mjs's machine contract — update it with
     every assessment, or the scanner will keep marking this event due. Process:
     docs/process/EVENT-RESEARCH.md. Delete the comments when instantiating. -->

## At a glance

<!-- The decision header the /research page promotes above the document (research-service extracts
     this exact section). A FAITHFUL surfacing of the stance below — never a new claim, and every
     trading-adjacent line still carries the event's confirmed/estimate label. Three parts:
       1. **TL;DR.** one plain-language paragraph — the verdict a non-expert can act on.
       2. A horizon table — Today / This week / This month / This quarter, each with an honest
          `Call` (stand aside · watch · flat the print · accumulate small · avoid — never a
          directional "buy" the evidence doesn't support) and a one-line Why.
       3. **Signals & conditions** — the buy/sell/hold triggers, drawn from the stance's kill
          switches and dated watch-list. Keep it to what the body already justifies. -->

## Initial research

<!-- Genre: docs/research/nvda-aug-2026-print.md — the question plainly → one-line verdict →
     method → each conviction leg tested to SUPPORTED / MIXED / REFUTED with sources and dates →
     what plays the conditions support → honest limits. -->

## Stance & kill switches

<!-- The current position on this event, each trading-adjacent statement carrying the event's
     confirmed/estimate label. Every stance names the observation that would kill it. Predictions
     with a score-by date also register in docs/research/forward-tests.md. -->

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
