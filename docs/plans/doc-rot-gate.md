# Plan: doc-rot gate — detect docs that no longer describe reality

**Status:** draft <!-- awaiting Eric's ready flip — this plan doubles as the PM-mode worked example -->
**Author:** Claude (proposing) · **Date:** 2026-08-10

## Intent & end-state

Docs are the intent layer every fresh session loads; when they drift from reality they poison
alignment silently (two live instances just fixed in PR #284 — a stale persona-lore claim and a
renamed-heading ghost in the structural map). End-state: a deterministic gate in the COACHES roster
(`scripts/doc-rot-scan.mjs`) that catches the *mechanically detectable* classes of doc rot on every
test run, with the grandfather-then-ratchet budget pattern the other gates use. The doc-rot the gate
can't see (semantic claims like "only Sauron carries lore") stays the self-correcting loop's job —
the gate shrinks the surface, honestly.

## Acceptance criteria (EARS)

- [ ] WHEN the scan runs, the gate shall flag repo-relative file paths referenced in `docs/*.md` and
      `CLAUDE.md` that no longer exist. — *verify: unit spec + a seeded fixture; exit status*
- [ ] WHEN the scan runs, the gate shall flag named `npm run` scripts referenced in docs that are
      absent from `package.json`. — *verify: unit spec*
- [ ] WHEN the scan runs, the gate shall flag `STRUCTURE-graph.md` when its embedded built-from commit
      is older than a threshold (default 30 days) behind `HEAD`. — *verify: unit spec*
- [ ] IF findings exceed the ratchet budget, THEN `npm test` shall fail with the finding list. —
      *verify: gate wired into the suite like arch/dupe scans; red run on seeded rot*
- [ ] WHEN the gate lands, existing findings shall be grandfathered into the initial budget (no
      big-bang cleanup PR). — *verify: green `npm test` on main at merge*

## Constraints & non-goals

- Deterministic only — no LLM calls, no API cost (COACHES doctrine: free per run, can't drift).
- Non-goal: semantic claim checking ("X is the only Y") — undetectable without a model; stays with
  the config-audit/self-correcting loop.
- Non-goal: prose style/quality — `/linguist` territory.

## Pre-settled forks (proposed — confirm at ready-flip)

- **Scan surface** → `docs/**/*.md` + `CLAUDE.md` + `README.md`; skip `docs/JOURNEYS/` and
  `docs/plans/` (historical records rot honestly — they describe their moment, not the present).
- **Budget style** → grandfather-then-ratchet, same as arch/dupe gates.
- **Roster placement** → a gate + corrective runs in-session; no new background agent (charter step 2:
  the mortician/decomposer pattern only earns an agent once recurrence is proven).

## Autonomy envelope

- Default merge policy: gate + specs are structural → auto-merge on green.

## Open questions (Q&A queue)

_(none)_

## Decision log

_(none yet)_
