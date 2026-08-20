# Plan: issue-centric orchestration — the feedback channel as the front door

**Status:** draft <!-- draft | ready | executing | review | done — only Eric flips draft→ready -->
**Author:** Claude (proposing, from Eric's direction) · **Date:** 2026-08-20

## Intent & end-state

Move the front door of development from ephemeral chat sessions to the **issue channel**. Every raw
idea — whether it arrives through the app's `/feedback` form, a GitHub issue form, or a rapid-fire
line in a Claude chat — becomes **its own labeled issue**: a self-contained context capsule that the
postmaster's feedback lane (shipped, `postmaster.yml` → `build-feedback`) builds in a **fresh
session with clean context**. GitHub **Projects** becomes the flight board that tracks everything
in-flight, so no work dies on the vine inside a chat session nobody reopens.

Eric's direction, verbatim (2026-08-20, three messages — quoted unedited per the journey discipline):

> One advantage of creating new feedback issues.. those are launched in new claude sessions, unlike
> my rapid fire comment chain of ideas that conflat context in the same session. That could be a
> game changer in terms of minimizing context polution and rapid firing development

> Food for thought, I'd like to transfer a lot of the story generation to the feebdack form. One
> mechanism that may tie into the broader research results is setting up github projects to manage
> logistics/orchestration of all the work in flight. Working out of the feedback channel could be a
> more effective way to launch a bunch of ideas and keep bette track of eveyrthing via issues. This
> seems better than a bunch of sessions in claude that die on the vine or I loose track of
> progress/state.

**End-state:** Eric fires N ideas in one sitting; N issues exist minutes later, each carrying a
structured story a zero-context session can act on; each builds (or stops at `needs-eric`) in its
own isolated run; one Projects board answers "what's in flight, what's blocked, what shipped" at a
glance — the same picture-first, ten-second-review contract the PR template carries.

## Why this leans on shipped machinery (not new invention)

- **The isolation mechanism already exists.** `feedback`-labeled issues are claimed and built in
  fresh CI sessions (`postmaster.yml`, feedback lane, 2026-08-19), model-tiered by ask complexity
  (2026-08-20). This plan adds *routes into* that lane and *visibility over* it — it does not
  rebuild it.
- **The label is the authorization** (issue creation alone never starts AI work). That invariant is
  load-bearing on a public repo and is **not widened** by this plan.

## Acceptance criteria (EARS)

- [ ] WHEN a member or Eric opens any issue form, the form shall produce a **story capsule** —
  problem, value, acceptance sketch — structured enough for a zero-context session to act on
  without re-interviewing the filer. — *verify: filed test issue reads as a standalone brief*
- [ ] WHEN Eric rapid-fires multiple ideas in one Claude session, the session shall offer the
  **fan-out route**: file each as its own `feedback`-labeled issue instead of conflating them
  in-context. — *verify: routing one-liners name the route; issues exist with the label*
- [ ] WHEN work starts or stalls on a fanned-out issue, the state shall be visible on the Projects
  board without opening a chat session. — *verify: board columns move on label/PR events*
- [ ] IF an idea is a taste fork or irreversible-class item, THEN the fan-out route shall NOT
  auto-build it — it files with `needs-eric` context per the feedback lane's envelope. —
  *verify: envelope text in the issue lane unchanged*

## Constraints & non-goals

- **Non-goal (this plan): rebuilding the `/feedback` app form UI.** Form/visual changes wait for
  Eric's taste per the merge policy; the story-capsule structure ships first in the issue templates,
  where it is cheap and reversible. The app form inherits the same structure as a follow-up slice.
- **Non-goal: replacing `docs/IDEAS.md`.** Park remains the route for ideas that need *judgment
  before work*; fan-out is for self-contained, buildable asks that should start now, isolated.
- Postmaster/claude workflow prompts are **workflow files — carve-out**: proposed changes open as a
  PR held for Eric, never auto-merged.

## Slices (in order)

1. **Story capsules in the issue templates** *(ships with this plan's PR — reversible, docs-class)*:
   upgrade `.github/ISSUE_TEMPLATE/*.yml` so each form generates the structured story the fresh
   session needs (see `docs/PICTURES.md` for the communication rationale).
2. **The fan-out route** *(ships with this plan's PR)*: idea-routing gains
   `fan out (→ issue → fresh session)` beside act/park/profile/question, with the override `FAN:`.
3. **Projects flight board** *(Eric's gate — needs project-scope credentials; procedure below)*.
4. **Postmaster story echo** *(carve-out PR, follow-up)*: the fresh session's first visible act is
   restating the ask as a story comment on the issue — the confirmation loop that catches a
   misread ask before tokens are spent building the wrong thing.
5. **App form inherits the capsule structure** *(feature work, waits for taste)*.

## Pre-settled forks

- **Capsule format** → EARS-*lite* (problem / value / acceptance sketch in plain words), not full
  EARS — members are analytical-but-non-technical; the building session formalizes to EARS.
- **Board substrate** → GitHub Projects v2 with built-in auto-add/status workflows — not a
  hand-maintained docs table (tables rot; the board is event-driven, matching the no-cron directive).
- **Authorization** → unchanged: the `feedback` label (write/triage perms) starts work, never issue
  creation.

## Autonomy envelope

- Default merge policy applies. Issue templates + docs auto-merge; slices 3–5 are Eric-gated as
  marked.

## Eric's one credentialed step — the Projects board (slice 3)

1. Open <https://github.com/users/ejclark/projects/new>, name it **Skynet flight board**, template
   **Board** — creating a user-owned Projects v2 board is account-scoped, which is why this step is
   yours; the default Actions token cannot do it.
2. In the project's ⚙ Settings → **Manage access**, keep it private; then in the board's **⋯ →
   Workflows**, enable **Auto-add to project** with filter `is:issue label:feedback`, and enable
   **Item closed → Done** + **Pull request merged → Done** — these built-ins move cards on events
   with zero code on our side.
3. Reply here with the project number (the `N` in `/users/ejclark/projects/N`) — lets Claude
   sessions link and query the board over the API where useful.

*Gist: one board, private, that automatically collects every `feedback` issue and moves items to
Done as their PRs merge — the flight tracker exists after ~2 minutes of clicks, no code required.*

## Open questions (Q&A queue)

_(none)_

## Decision log

- 2026-08-20 · Plan drafted from Eric's three mid-turn messages during the hat-team communication
  research; slices 1–2 land with that research's PR so the pending work tests the process
  (CLAUDE.md: "sequence the process ahead of the work").
