---
name: work-issues
description: >-
  Burn down the ready backlog in one live session: pull the next buildable `feedback`- or
  `plan`-labeled issue, echo the parsed ask back as a comment, build it in an isolated worktree,
  verify green, ship it, then move to the next issue. Use when asked to "work through the backlog",
  "burn down issues", "iterate on open issues", or to make visible, controlled progress on the
  ready queue right now — as opposed to waiting on Moneypenny's async event lane
  (`moneypenny-events.yml`) to pick items up on its own schedule. Never builds a `needs-eric` or
  `needs-info` item, and never touches the irreversible class without stopping for Eric.
---

# /work-issues — a synchronous burn-down of the ready backlog

This is the **in-session, human-visible** complement to Moneypenny's event-driven feedback lane
(`docs/MONEYPENNY.md`), not a replacement for it — she still owns sequencing across issues and PRs
generally; this skill is one manual pass through her queue when Eric (or Claude, mid-session) wants
visible, controlled throughput right now instead of waiting on webhook timing. Operates within her
mandate, per `docs/MONEYPENNY.md`'s authority section.

## The cycle

1. **SYNC.** `git fetch origin main` — every decision derives from shipped reality.
2. **QUEUE.** List open issues labeled `feedback` or `plan`. From that set, exclude:
   - anything also labeled `needs-eric`, `needs-info`, `next-slice`, `hold-merge`,
     `conflict-flagged`, or `stall-flagged` — those are already parked on a signal only a human (or
     a later cycle) resolves, per `docs/ISSUES.md`'s label vocabulary.
   - anything with an open PR already referencing it (`Fixes #N` / a branch named for the issue) —
     WIP limit 1 per issue, same rule as `/governor`'s athlete check. Inventory is waste.

   Order the remainder oldest-first (FIFO) unless Eric names a priority order for this pass.

   **The `plan`-label authorization gap:** the `feedback` label alone is a settled authorization
   invariant (`docs/plans/issue-centric-orchestration.md`: "the label is the authorization"), but a
   `plan`-labeled issue's readiness historically depended on Eric's own comment/flip, not a distinct
   label — there is no `ready` label in the registry (`tests/arch/label-vocabulary.spec.ts`). Treat a
   `plan` issue as buildable under the same rule as `feedback` (open, none of the parking labels
   above) **unless its body still carries an explicit `Status: draft` marker** — that marker means a
   human hasn't flipped it yet, and this skill must not flip it for them. If the queue produces zero
   issues because everything is genuinely parked, say so and stop; don't loosen the filter to find
   something to do.

3. **PICK ONE.** Take the head of the queue.
4. **ECHO.** Post one issue comment restating the ask in your own words — problem, acceptance
   sketch, and the slice you're about to build — before writing any code. This is the confirmation
   loop named as a follow-up in `docs/plans/issue-centric-orchestration.md` (slice 4): it catches a
   misread ask for the cost of one comment instead of a wasted build. If the restated ask feels
   underspecified to act on, label `needs-info` (member) or `needs-eric` (his call) here and skip to
   the next issue — don't guess past real ambiguity just to keep the loop moving.
5. **BUILD.** Branch off `origin/main` in an isolated worktree (`docs/DELEGATION.md`), dispatch the
   build via the `Agent` tool (general-purpose, or a named athlete if the work matches one's mandate)
   with the issue's full capsule as its prompt — it has no memory of this session, so the prompt must
   be self-contained. Contract: implement, run `npm run verify`, and land on exactly one of the four
   terminal states the feedback lane already uses: a PR, `next-slice`, `needs-info`, or `needs-eric`.
6. **LAND.** On a PR outcome: open it with `/ship`, following its merge-policy table verbatim
   (`.claude/skills/governor/SKILL.md` — don't re-derive it here) including the carve-outs
   (workflow files, the irreversible class per `envelope.json`, taste holds). On any other outcome:
   apply the label, comment the reason in one line, and move on — a `needs-eric` item doesn't block
   the rest of the queue; it just stops competing for the same PR slot.
7. **REPEAT.** Re-run QUEUE against the new `origin/main` before picking the next issue — same
   re-derivation discipline as `/governor`'s cycle boundary, so two picks never race the same file.
8. **STOP** when the queue is empty, when Eric set a cap for this pass and it's reached, or when an
   item surfaces that is in the irreversible class (`node scripts/envelope-scan.mjs --check <paths>`)
   — that one pauses the *whole* pass for his call, since it's the one class interrupt economics
   never defers.

## Reporting

One line per issue as it resolves (`#123 → PR #456, auto-merge armed` / `#128 → needs-info: ...`),
not a narrated play-by-play of the build. Close the pass with a short tally: shipped / parked /
blocked, and what's left in the queue if it wasn't emptied. This is Eric's report altitude
(`CLAUDE.md` → *Report at altitude*) applied to a burn-down instead of a time-boxed digest.

## Boundaries

- **Never invent a `ready` label or a new authorization signal.** The two that exist —
  `feedback`'s label-is-authorization, and a `plan` issue's absence of `Status: draft` — are the
  whole gate. If neither settles it, that's a `needs-eric` outcome, not a judgment call for this
  skill to make.
- **Never batch multiple issues into one PR.** Unlike `/governor`'s structural-debt cycle (same
  gate, fungible commits), backlog issues are independently-scoped asks from different sources —
  bundling them defeats the "small, independently-revertable PR" flow principle and makes a bad
  build harder to isolate.
- **Never bypass a gate or `--no-verify` to keep the loop moving.** A red `npm run verify` is a
  `needs-eric` or a fix, never a skip.
