# Handoff: Morning brief reads the full event horizon

**Status:** review <!-- draft | ready | executing | review | done — only Eric flips draft→ready -->
**Author:** Claude Code · **Date:** 2026-08-17
**Provenance:** parked in `docs/IDEAS.md` during the calendar-view work (2026-08-16), promoted here
to serve as the **pipeline canary** — the first handoff the build machinery has ever executed.

## Intent & end-state

The morning brief's calendar section shows earnings prints only, even though `eventsWithin` was
built as its seam and the market-event calendar already carries CPI, FOMC and sector dates. After
this, `npm run brief:morning` shows the whole horizon — a trader reading the brief sees the FOMC
meeting that lands on a print date, not just the print.

**This handoff is deliberately small.** It is the canary: its job is to prove the pickup chain
(detect → claim → `ready`→`executing` lock → build → verify → PR → `review`) on a change whose
blast radius is one text section and whose correctness is decidable by a spec assertion. Ship it,
then the real bundles ride proven machinery.

## Acceptance criteria (EARS)

- [ ] WHEN the morning brief renders its calendar section, it shall include upcoming market events
  (CPI/FOMC/sector) inside the horizon window, not only earnings prints. — *verify: a spec in
  `tests/observatory/morning-brief.spec.ts` asserting a macro event id appears for a fixed as-of date*
- [ ] WHILE rendering, each entry shall carry its confirmed/estimate label honestly, unchanged from
  the domain record. — *verify: same spec, asserting the estimate label survives*
- [ ] WHEN the brief runs offline, it shall still render (no new network dependency). — *verify:
  `npm run brief:morning` exits 0 with `SKYNET_DATA_SOURCE=offline`*
- [ ] WHEN the change ships, `npm run verify` shall stay green. — *verify: exit status*

## Design bundle

**There is no visual bundle — this is a behavior handoff, and saying so is the honest version of
this table.** The spec above is authoritative; nothing here is a mock.

| File | Authoritative for | Notes |
|---|---|---|
| this README | the behavior contract | no `.dc.html`, no tokens, no screenshots |

**Coverage note (what this canary does NOT exercise):** the "reconcile bundle tokens against
`docs/BRAND.md` before writing code" step, because there are no tokens to reconcile. That step
first runs for real on `trailer-debut`.

## Contract rulings

- **Existing earnings rows stay.** This widens the section; it does not replace prints with macros.
- **Section header** may change from `EARNINGS CALENDAR` to something truthful about its new
  contents — builder's call, one line, no ceremony.
- **Reuse `eventsWithin`** (`src/domain/market-events.ts`) — it exists for exactly this and is
  already specced. Do not add a parallel query.

## Constraints & non-goals

- Do not touch `src/observatory/calendar-view.ts` or the `/calendar` route — the brief is the only
  surface in scope.
- No new event kinds (OPEX/VIX/holidays stay parked in `docs/IDEAS.md`).
- No network calls: the brief's calendar half is pure/offline-correct and must stay that way.

## Autonomy envelope

- Non-visual and small, but **open the PR without auto-merge** — Eric merges it, so the chain's
  final hop is visible rather than silent.
- Standard gates are the floor: `npm run typecheck`, `npm run lint`, `npm test` by exit status.
- Bank anything ambiguous in the Q&A queue below rather than guessing.

## Open questions (Q&A queue)

_(none — that is the point of a canary)_

## Decision log

- 2026-08-17 — staged as the canary rather than flipping `trailer-debut` first: the build machinery
  has never run, and three defects surfaced on 2026-08-16 in code that looked fine, so the first
  execution should carry trivial blast radius (Eric's call).
- 2026-08-17 — `npm test` (and `npm run verify`) fail on `tests/arch/lessons.spec.ts` — the
  incident-scan learning gate reports 17 un-retro'd incidents on `main` from GitHub Actions run
  history. Confirmed by diffing against `origin/main` directly: identical failure, pre-existing,
  and unrelated to this diff (it queries live Actions history, not local files). Out of scope for
  a deliberately-small canary — a `/retro` burn-down is a separate piece of work. `npm run
  typecheck`, `npm run lint`, and every spec touched by this change are green; that pre-existing
  gate is the one exception, flagged here rather than silently ignored.
