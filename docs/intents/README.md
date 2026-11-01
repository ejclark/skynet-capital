# Declared intents — what Eric wants by when, where a lane can read it

A declared intent is an outcome with a date, an event or a window. One file per intent, so the
autonomous lanes can read it with no API call and it lapses on its own. The dial (#4153) stays the
one state that flips in seconds; a record holds for days, so it lives in the repo with git history
in front of it.

**Route.** A session that hears an outcome plus a date, an event id, a window or a reservation
writes one record here, opens it as a one-file PR, and echoes one line back in its reply:
`Declared → <slug>: <outcome> · until <date> · check: <command> · steers: <…>`, so he can correct it
there. An outcome with no date is not an intent; it routes as it did before (a brain-dump to a plan
issue, a build ask to `/issue`).

**Reader.** `node scripts/intents.mjs [--json] [--today=YYYY-MM-DD] [--event=<event-id>]
[--issue=<n>] [--reserve]`. It is pure and reads this folder; no other code parses these files.
Only what imports it acts on a record (`grep -l intents.mjs scripts/*.mjs`), and a record with no
reader yet still lapses and still prints.

## The public half only

This repo is public.

- A record states a study goal naming events and symbols, a reservation, or an objective. It never
  says he holds a position, and never carries a size, a strike, a dollar amount, an account, or the
  words "my" or "primary position".
- **His words from a private chat are paraphrased, with the date. Verbatim is allowed only from a
  public surface, such as an issue, and the record names which one.**
- Paper trading and education only. Nothing here reads as advice or places a trade.

## One record

```
# <slug> — <one line: what he wants>

**Kind:** study | reservation | objective · **Stated:** YYYY-MM-DD · **Until:** YYYY-MM-DD
**Said:** paraphrased YYYY-MM-DD: <what he asked for, in our words>

| | |
|---|---|
| **Outcome** | what should be true by Until |
| **Check** | the commands that pass or fail it, each one run when the record was written |
| **Steers** | event ids, issue numbers (`#123`), `reserve:<points>`, separated by `·` |

## Outcome
(left empty until it closes: what happened, dated)
```

`**Said:**` opens with `paraphrased YYYY-MM-DD:` or `verbatim from #<n>:`.

Rules, enforced by `tests/scripts/intents.spec.ts`, which reads every record on disk:

- **`Until` is required.** A record with none fails `npm test`, and the reader throws rather than
  printing `[]`. It holds through the end of that day in UTC and lapses the next instant, the dial's
  own rule (`expiryEnd`, `scripts/moneypenny/work-mode.mjs`).
- **A lapsed record is ignored by readers and never deleted.** To extend one, change its `Until` in
  a PR. To close one early, write under `## Outcome`.
- **A steer the reader cannot sort is an error,** and an active record's events must be real, so a
  typo cannot quietly reach no lane.
- **The public half is checked by shape** (`publicHalfProblems`). The check catches slips; it does
  not replace reading the record before it merges.

A record never outranks what he says now. A later instruction in his own words wins, and the session
that hears it updates the record.
