# Weekly studies — one call sheet per market week

One file per ISO week, `<ISO-week>.md`, composed from the event ledgers dated inside it. The genre's
contract lives in [`docs/process/EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) → *The weekly
study genre*; this note is the operating card.

```
npm run research:week                     # the market week of today (a Sunday resolves forward)
npm run research:week -- --week 2026-W37  # a named ISO week
npm run research:week -- --stdout         # print it, write nothing
npm run research:week -- --min 0          # compose a thin week too (the floor is 3 in-range ledgers)
npm run research:week -- --force          # rewrite a CLOSED week (append-only without this)
```

**It aggregates; it never generates.** Every Call, Confidence, Why and falsifier in a week study is
copied verbatim from a ledger's own `This week` row, with that ledger cited. The only numbers the
composer computes are counts of documents it can point at: how many ledgers fall in range, the tally
of authored confidence grades, and the corridor degrees behind the hub table. No model writes a mood
here — the four-class call *mix* stays on the `/research` board (`app/src/live/call-mix.ts`), which
already reads the same rows through its week lens.

**A name with no ledger in range says so.** "No researched event this week" is the honest answer and
the one the genre requires; inferring a call for an unresearched name would be exactly the thing this
document exists not to do.

**A thin week gets no document.** Under three researched events in range, the composer writes nothing
and says why on stdout. A quiet week is an answer, not a failure.

`README.md` and any `TEMPLATE.md` here are skipped by both `npm run research:lint` and the `/research`
shelf listing — same convention as `docs/research/events/`.
