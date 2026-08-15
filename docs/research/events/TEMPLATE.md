# <title> — <event-id>

**Kind:** <kind> · **Date:** <YYYY-MM-DD> (<confirmed|estimate>, <source>) · **Impact:** <tier>
**Last assessed:** <YYYY-MM-DD>

<!-- The `**Last assessed:**` line is scripts/event-scan.mjs's machine contract — update it with
     every assessment, or the scanner will keep marking this event due. Process:
     docs/process/EVENT-RESEARCH.md. Delete the comments when instantiating. -->

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
