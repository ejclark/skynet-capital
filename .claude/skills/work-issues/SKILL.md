---
name: work-issues
description: >-
  Burn down the ready backlog in one live session: pull the next issue in the board's Ready
  column (the shared `pullable` rule) once the admission gate admits it, echo the parsed ask back
  as a comment, build it in an isolated worktree, verify green, ship it, then move to the next.
  Use when asked to "work through the backlog", "burn down issues", "iterate on open issues", or
  to make visible, controlled progress on the
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
2. **QUEUE.** `node scripts/moneypenny/admission.mjs --queue` — the board's **Ready** column and
   nothing else, as JSON, in the order the gate would pick (#4393 criterion 10). It filters every
   open `ready` issue through `pullable()` (`scripts/moneypenny/labels.mjs`): open, labelled
   `ready`, `isBuildable` (none of `needs-eric` / `needs-info` / `needs-design` / `hold-merge`),
   and not `in-progress`. That is the same predicate both Moneypenny claim lanes and her retry
   sweep ask, so this pass and her lanes can never disagree about what is pullable. A Backlog issue
   (no `ready`) is never pulled here, however buildable it looks — getting it `ready` is a triage
   call, not this pass's. An issue with an open PR naming it is already `in-progress` (the PR
   derives the label, #4402), so the old "skip anything with an open PR" check is inside the rule.

   One extra check the rule cannot make: Moneypenny's lease window. Her lanes take a git-tag lease
   a moment *before* they apply `in-progress`, so for the head of the queue run `node
   scripts/moneypenny/index.mjs --check-claim feedback-<n>` (or `plan-<n>`); `claimed: true` means
   skip it. Read-only; it never joins or breaks her claim.

   The order is fast-track first, then `npm run rank`'s class (a hand-set `P0`–`P3` always wins),
   an expedited bug first inside its class, then oldest. Eric may name a different order for this
   pass; `npm run rank` still explains *why* a row sits where it does. If the queue is empty, say
   so and stop — don't loosen the filter to find something to do.

3. **ADMIT, then PICK ONE.** Before building the head of the queue, ask the gate:
   `node scripts/moneypenny/admission.mjs --check <n>` (#4393 criterion 11). It prints
   `{number, admit, reason, queuedBehind?}` and exits **0** admitted or **3** refused — work-mode
   `halt`/`conserve`, the in-flight cap (`work-mode.json` → `inFlightCap`, counting every open
   `in-progress` issue whichever path started it), or the same-surface fence. **A refusal ends the
   pass** with one line — `pass ended — #<n> not admitted: <reason>` — and builds nothing. Do not
   try the next row to get around the cap; the cap is the point. Exit 2 is a usage slip; fix it.
   The CLI only reads: it never comments and never labels.

   On admit, label it `in-progress` right away (`gh issue edit <n> --add-label in-progress`) —
   that label is what the Orchestration board's In Progress column and the cap count (#3960).
   Every terminal outcome in LAND takes it back off.

   **The expedite class (#4393 criterion 12).** A session Eric starts by hand to build something
   directly is never asked to pass this gate and is never refused — that freedom is settled
   (#4393 fork 3). It is still *counted*: its PR names the issue, which derives `in-progress`, so
   it fills a slot the next automated pull sees. This skill is an automated puller even when Eric
   invoked it — it pulls from the queue, so it asks the gate; only a hand-picked build skips it.

4. **READ THE STATE BLOCK FIRST, on a `plan` issue.** If the issue carries a state block
   (`docs/ISSUES.md` → *The state block*, #3765), it names the slice, its inputs, its done line
   and its falsifier: take that slice and do not re-read the thread to re-derive it. If a `plan`
   issue has no block, read the whole thread once, post the block as a comment, then continue.
   ECHO below is for `feedback` issues; a state block already is the echo.
5. **ECHO.** Post one issue comment restating the ask in your own words — problem, acceptance
   sketch, and the slice you're about to build — before writing any code. This is the confirmation
   loop named as a follow-up in `docs/plans/issue-centric-orchestration.md` (slice 4): it catches a
   misread ask for the cost of one comment instead of a wasted build. If the restated ask feels
   underspecified to act on, label `needs-info` (member) or `needs-eric` (his call), remove
   `in-progress`, and skip to the next issue — don't guess past real ambiguity just to keep the loop moving.
6. **BUILD.** Branch off `origin/main` in an isolated worktree (`docs/DELEGATION.md`), dispatch the
   build via the `Agent` tool (general-purpose, or a named athlete if the work matches one's mandate)
   with the issue's full capsule as its prompt — it has no memory of this session, so the prompt must
   be self-contained. Contract: implement, run `npm run verify`, and land on exactly one of the four
   terminal states the feedback lane already uses: a PR, `next-slice`, `needs-info`, or `needs-eric`.
7. **LAND.** On a PR outcome: open it with `/ship`, following its merge-policy table verbatim
   (`.claude/skills/governor/SKILL.md` — don't re-derive it here) including the carve-outs
   (workflow files, the irreversible class per `envelope.json`, taste holds). On any other outcome:
   apply the label, comment the reason in one line, and move on. Either way, remove `in-progress`
   (`--remove-label in-progress`) on every terminal outcome — PR merged, `next-slice`,
   `needs-info` or `needs-eric`; the stall audit only catches one forgotten for 6h. A `needs-eric` item doesn't block
   the rest of the queue; it just stops competing for the same PR slot. **On a `plan` issue, every
   outcome is an edit to its state block** (the slice's new state, the next pickup line, one dated
   log line) and never a new status comment; the one-line reason for a non-PR outcome goes in the
   log line.
8. **REPEAT.** Re-run QUEUE and ADMIT against the new `origin/main` before picking the next issue — same
   re-derivation discipline as `/governor`'s cycle boundary, so two picks never race the same file.
9. **STOP** when the queue is empty, when the gate refuses (step 3), when Eric set a cap for this
   pass and it's reached, or when an
   item surfaces that is in the irreversible class (`node scripts/envelope-scan.mjs --check <paths>`)
   — that one pauses the *whole* pass for his call, since it's the one class interrupt economics
   never defers.

## Reporting

One line per issue as it resolves (`#123 → PR #456, auto-merge armed` / `#128 → needs-info: ...`),
not a narrated play-by-play of the build. Close the pass with a short tally: shipped / parked /
blocked, and what's left in the queue if it wasn't emptied. This is Eric's report altitude
(`CLAUDE.md` → *Report at altitude*) applied to a burn-down instead of a time-boxed digest.

One more line, optional, at the tally — never per-issue: did the same friction recur across ≥2 issues
this pass, or surface a clear opportunity? Log it to `docs/IDEAS.md`
(`(src: Claude · while: work-issues pass <date>)`); nothing to note → the tally above is the whole
report. Same no-new-gate discipline as `/governor`'s own cycle-close retro line.

## Boundaries

- **Never apply `ready` yourself to make something pullable.** `ready` is the authorization
  signal and the board's Ready column; this pass only pulls what already carries it. Whether a
  Backlog item should be `ready` is triage, not burn-down.
- **Never batch multiple issues into one PR.** Unlike `/governor`'s structural-debt cycle (same
  gate, fungible commits), backlog issues are independently-scoped asks from different sources —
  bundling them defeats the "small, independently-revertable PR" flow principle and makes a bad
  build harder to isolate.
- **Never bypass a gate or `--no-verify` to keep the loop moving.** A red `npm run verify` is a
  `needs-eric` or a fix, never a skip.
