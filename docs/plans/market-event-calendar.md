# Plan: Market-event calendar + adaptive research routines

**Status:** draft <!-- draft | ready | executing | review | done — only Eric flips draft→ready -->
**Author:** Eric (direction) · Claude (design & build) · **Date:** 2026-08-15
**Provenance:** Eric's ask 2026-08-15 ("a calendar where we can mark important events… trigger a
routine to research… periodic assessments adjusted by impact and time window"), activating the
banked "Special-events calendar" idea (docs/IDEAS.md, 2026-08-12). Eric approved the design and
the machinery build interactively 2026-08-15; **the `ready` flip below is specifically the
authorization to ARM the daily Routine** (docs/ROUTINES.md), which is the one step that makes
the system run unattended.

## Intent & end-state

Foresight as an edge: every dated thing that can move the names we trade lives in one reviewable
calendar; adding an event automatically produces initial research ("what's likely to happen, how
will the market react"), then pulse checks that ramp from weekly (two months out) to daily (final
week) for the biggest events, each pulse sweeping for adjacent triggers (peer prints, CPI/FOMC,
VIX regime, geopolitics) — until the event passes and gets one honest outcome score. Eric marks a
date; the system does the watching. Slice 2 (later): the observatory renders the same feed
(morning brief horizon; LIVING-UNIVERSE phase-3 event→phenomenon vocabulary).

## Acceptance criteria (EARS)

- [x] WHEN an event exists in `MARKET_EVENTS` (or a print in `UPCOMING_PRINTS`) with no ledger
  doc, `event-scan.mjs --due` shall list it with reason `never-assessed`. — *verify:
  tests/domain/assessment-cadence.spec.ts*
- [x] WHEN a critical event is 21–60 days out and its last assessment is ≥3 days old, `--due`
  shall list it (weekly→3-day→2-day→daily ramp per `assessment-cadence.json`). — *verify:
  tests/domain/assessment-cadence.spec.ts (band boundaries 61/60, 8/7, day-0)*
- [x] WHEN an event date passes without a scored `## Outcome`, `--due` shall list it once with
  reason `event-passed-unscored` within `closeOutWithinDays`, then never again. — *verify: same
  spec (passed-unscored / passed-scored / passed-old)*
- [x] WHEN any committed event or ledger violates the contract (bad id/date/enum, a `confirmed`
  status without a trusted source prefix, a hand-entered earnings row), `--validate` shall exit
  1. — *verify: tests/arch/event-scan.spec.ts + CI*
- [x] WHILE the scanner reads the TS tables by marker extraction, its view shall deep-equal the
  real module exports. — *verify: the drift gate in tests/arch/event-scan.spec.ts*
- [x] WHEN a new event lands on `main`, the detect workflow shall open one idempotent
  `[event-research] <id>` issue. — *verify: .github/workflows/event-detect.yml (dedup by title;
  same pattern as handoff-detect)*
- [ ] WHILE the daily Routine is armed and `--due` returns `[]`, the session shall end without
  commits. — *verify: Routine transcript digest after arming*
- [ ] WHEN the Routine assesses an event, it shall ship the ledger update as an ordinary PR and
  nothing else (no trades, no playbook/guard edits, no estimate→confirmed without a primary
  source). — *verify: review of the first cycles' PRs*

## Constraints & non-goals

- **Earnings dates keep ONE source of truth** — `earnings-calendar.ts`, adapter-derived into the
  event model; `confirm-print-dates.ts` and every guard/playbook consumer untouched.
- **Date policy preserved and lintable**: estimates only widen caution; `confirmed` requires a
  trusted source prefix (IR/CAL/BLS/FED/PJM/SEC), enforced by `--validate` in CI. Research is
  not action — estimate events still get researched, labeled honestly.
- **One Routine, ever** — adaptive frequency lives in the scanner's pure function, never in cron
  sprawl. No Routine exists outside `docs/ROUTINES.md`.
- Non-goals (v1): realtime/event-driven wake-ups; a VIX-regime event kind (no date → adjacency
  checklist; a threshold-triggered condition-watch is a banked follow-up); automated macro-date
  confirmation (`confirm:macro-dates` mirroring confirm-print-dates — follow-up); the app
  surface (slice 2).

## Pre-settled forks

- **Widen `EarningsPrint` vs parallel model** → parallel `market-events.ts` + adapter (the
  rewriter and safety consumers key on the earnings type; leakage impossible by construction).
- **Ledger format: JSONL vs markdown** → per-event markdown under `docs/research/events/`
  (stances and kill switches must be PR-diff-reviewable; volume is rows/week, not telemetry).
- **Cadence in code vs data** → `assessment-cadence.json`, bands validated in CI.
- **Per-event Routines vs one scanner-driven Routine** → one; the scan is the contract.
- **Detect workflow** → shipped, but explicitly a latency optimization; the Routine's
  `never-assessed` rule is the guarantee.

## Autonomy envelope

- Default merge policy applies to the machinery (structural/tests/docs auto-merge). **Carve-outs
  honored:** the workflow file rides a PR held for Eric; **arming the Routine is Eric's flip,
  always** — the system is inert (manual `npm run event:scan` + detect issues only) until then.
- The armed Routine's ceiling: notification + PR (its verbatim prompt and hard limits live in
  docs/ROUTINES.md and are part of this plan's contract).

## Open questions (Q&A queue)

_(none)_

## Decision log

- 2026-08-15 — BLS CPI seed dates hand-verified against bls.gov/schedule after an aggregator
  published a wrong Dec date (Dec 18 vs the real Dec 10) — the source-prefix discipline caught
  its first real error before the table ever shipped.
