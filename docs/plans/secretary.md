# Plan: Secretary — regulate feedback to protect the constraint

**Status:** ready <!-- draft | ready | executing | review | done — only Eric flips draft→ready -->
**Author:** Eric (direction) · Claude (charter & build) · **Date:** 2026-08-15 · **Ready:** 2026-08-15 (Eric — "execute to enable"; Routine armed same day: `trig_01KaMC2uR3cFW5XTUL6rzPuS`)
**Provenance:** Eric's sidebar 2026-08-15: "the more autonomously changes are getting in, the
higher altitude of a report out/feedback i need.. the less play by play i can manage" + two
refinements the same day: the template-codification umbrella ("building and refining new
templates… codification of skills/instructions as an example of 'the how'"; "the goal of the
secretary role is to regulate feedback to protect the constraint, me") and team-dispatch
authority ("the secretary has the ability to deploy red team, blue, white, tiger, purple teams").
Chartered via /charter (verdict: build as skill + one Routine; REJECT as a roster agent — the
altitude judgment needs the whole operating model in view). **The `ready` flip below authorizes
ARMING the daily digest Routine** (docs/ROUTINES.md); the /secretary skill is usable manually
regardless.

## Intent & end-state

Eric's attention is the constraint (ToC); the secretary is the subordination step applied to the
feedback channel. End-state: everything flowing toward Eric is batched, tiered, formatted,
verified, or absorbed — he reads tiered digests (needs-you · headlines · noise-absorbed) at a
volume-adaptive cadence, decision items arrive pre-verified by dispatched teams with evidence
attached, recurring feedback formats get codified into templates that improve from use, and the
only real-time interrupts left are the ones he has said he wants: the irreversible class, genuine
taste forks, and blockers.

## Acceptance criteria (EARS)

- [x] WHEN ≥5 commits have landed on main since the last digest (or ≥7 days have passed), the
  digest scan shall report due with the matching reason. — *verify: tests/arch/digest-scan.spec.ts*
- [x] WHEN no digest exists, the scan shall report due (reason `no-digest`). — *verify: same spec*
- [x] IF a committed digest lacks any of the three tier sections, THEN `--validate` shall exit 1.
  — *verify: same spec + CI*
- [x] WHEN a digest ships, it shall contain a Needs-you queue phrased so "yes" is one word,
  outcome-level headlines, and counts-only noise — no play-by-play. — *verify: template contract
  + white-team spot-check rule in the skill*
- [ ] WHILE the digest Routine is armed and the scan says not due, the session shall end without
  commits. — *verify: Routine transcript digest after arming*
- [ ] WHEN an item is queued for Eric's decision at stakes warranting it, the secretary shall
  attach a verification-team result rather than raw claims. — *verify: review of queued items'
  evidence*

## Constraints & non-goals

- **Altitude ≠ silence** (Eric's standing correction): digest-altitude covers completed,
  reversible, in-envelope work only; the irreversible class, taste forks, and blockers interrupt
  in real time, always.
- **Teams verify and report, never act**; deployment is stakes-scaled (docs/COMPUTE.md);
  verification never substitutes for Eric's authority on the irreversible class.
- **One Routine** (the daily clock), registered in docs/ROUTINES.md, armed only by Eric; the
  volume math lives in the scan, not the schedule.
- Non-goals (v1): realtime notification channels beyond the existing push-notify; automated
  team-dispatch without a queued decision item; any app-surface rendering of digests (a later
  slice can join the observatory the way the event calendar will).

## Pre-settled forks

- **Agent vs skill** → skill (+ scan + Routine row); charter's step-3 test killed the agent form.
- **Digest cadence: fixed vs volume-adaptive** → adaptive (5-commit threshold, 7-day heartbeat),
  constants in the scan, tuned on the record.
- **Digest store** → committed markdown under docs/digests/, filename = date, never rewritten.
- **Team colors** → mapped to existing owners (red-team, reviewer, /code-review --fix, Workflow
  sweeps, gates) — dispatch authority, no new roster entries.

## Autonomy envelope

- Default merge policy applies (docs/digests are docs → auto-merge). Arming the Routine is Eric's
  flip, always. The secretary never creates or modifies Routines.

## Open questions (Q&A queue)

_(none)_

## Decision log

- 2026-08-15 — first digest (docs/digests/2026-08-15.md) shipped with the build, per "sequence
  the process ahead of the work": today's unusually high autonomous volume is the instrument's
  first live test.
