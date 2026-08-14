# Handoff: <short name>

**Status:** draft <!-- draft | ready | executing | review | done — only Eric flips draft→ready -->
**Author:** Claude Design · **Date:** <YYYY-MM-DD> · **Session:** <link to the design session, if any>

<!-- Copy this file to docs/handoffs/<slug>/README.md alongside the design bundle. It is the plan
     contract (docs/plans/TEMPLATE.md) plus one handoff-specific section, "Design bundle". The
     scanner enforces the section list: `npm run handoff:scan -- --validate`. -->

## Intent & end-state

<!-- Commander's intent: what is true when this is built, and why it matters. The executor adapts
     tactics to this, not to a step list. Say what the design is FOR, not just what it looks like. -->

## Acceptance criteria (EARS)

<!-- One verifiable `shall` per line, each naming its verification. These become the review
     criteria the PR is judged against — the repo's own gates (typecheck, lint, test, arch budgets)
     are the floor, not the ceiling. -->

- [ ] WHEN <trigger>, the <system> shall <response>. — *verify: <test/gate/screenshot/exit-status>*

## Design bundle

<!-- Which file in this folder is authoritative for what. Without this an executing session has to
     guess whether the HTML or the prose wins — the exact drift a handoff exists to prevent. -->

| File | Authoritative for | Notes |
|---|---|---|
| `preview.html` | layout, spacing, states | static mock — not the implementation target |
| `tokens.css` | colors, type scale, radii | must reconcile with `docs/BRAND.md`; brand wins on conflict |
| `screens/*.png` | the visual bar | what "done" looks like |

## Contract rulings

<!-- Calls the design session already settled, so the build doesn't reopen them. One line each. -->

- **<fork>** → <decision>

## Constraints & non-goals

- Reuses existing components in `src/ui` where one exists; new shared atoms go there, not inline.
- Non-goal:

## Pre-settled forks

- **<fork>** → <decision>

## Autonomy envelope

<!-- Default: the governor merge-policy table (structural/tests/docs auto-merge; features and
     visual work wait for Eric's taste). Visual work is a feature by default — say so explicitly if
     this handoff widens or narrows that. The irreversible class is never widenable. -->

- Default merge policy applies — visual work opens a PR and **waits for Eric**.

## Open questions (Q&A queue)

<!-- Banked mid-execution; Eric answers in batch. Empty at handoff time. -->

_(none)_

## Decision log

<!-- One line per call made under the envelope: what + why. -->

_(none yet)_
