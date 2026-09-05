# Forward-test register — predictions logged before outcomes

<!-- NO ROWS LIVE IN THIS FILE. Every registration is a row in docs/research/forward-tests/<event-id>.md,
     the fragment owned by the lane researching that event (issue #1449). A row added here fails
     `npm test` (tests/arch/forward-tests-fragments.spec.ts) with the path it belongs in. The
     /research page composes this index plus every fragment into the one register a reader wants. -->

Pre-registration ledger: every shelved hypothesis gets its prediction, kill switch, and score-by
date written down **before** the outcome exists — so the next sweep tests hypotheses instead of
retrofitting them. Zero capital by design; these exist to generate the out-of-sample n every red
team demanded. Source: [`multi-symbol-sweep.md`](multi-symbol-sweep.md) deployment rank #4.

## Where the rows live

- **One fragment per event:** [`forward-tests/<event-id>.md`](forward-tests/) — written only by
  the event-research lane that owns `events/<event-id>.md`, never by a sibling lane. That is the
  whole mechanism that lets concurrent research PRs merge without touching a shared file; the old
  single table produced a merge conflict for every pair of open research PRs, and three merge-side
  fixes in one day could not reach GitHub's own merge (2026-09-05, `docs/LESSONS.md`).
- **Legacy rows:** [`forward-tests/legacy.md`](forward-tests/legacy.md) — the bare-number
  `FT-1 … FT-N` registrations from the multi-symbol sweep and the first weeks of event research,
  plus the hybrid ids that never fit the scheme. Frozen except for scoring.
- **On the live `/research/forward-tests` page** the index and every fragment render as one
  document, each event's table folded under its own heading.

## How to register

1. **Id:** `FT-<event-id>-<n>` — `<event-id>` is the exact slug of your own
   `events/<event-id>.md`, `<n>` counts up within your own fragment (`grep -c '^| FT-'
   docs/research/forward-tests/<event-id>.md` + 1; a missing file means start at 1). Never a bare
   number, never a read of anyone else's file.
2. **File:** append one table row to `docs/research/forward-tests/<event-id>.md`. If the file does
   not exist yet, create it with an H1 (`# Forward tests — <event-id>`) and the header
   `| # | Hypothesis | Prediction | Kill switch | Score by | Outcome |`.
3. **Links from a row** are relative to the fragment: `../events/<id>.md`, `../multi-symbol-sweep.md`.
4. **One row per line.** The scan (`scripts/forward-test-id-scan.mjs`) reads rows by line.

**Rules.** An outcome is scored from the cached instrument data (re-run the study script after the
score-by date), never from memory of the tape. A scored `kill` moves the hypothesis to the sweep
doc's kill list. A scored `pass` is one observation, not a promotion — promotion needs the
pre-stated count (2–3 prints). New registrations append to the event's own fragment with their
date; editing a registered prediction after the fact is falsification and never happens. The
Outcome cell is the one cell a close-out fills.
