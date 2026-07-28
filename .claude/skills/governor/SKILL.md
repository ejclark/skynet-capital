---
name: governor
description: >-
  Run one head-coach dispatch cycle: for each defensive coach with an athlete, check WIP, take the
  gate's named target, check collisions, dispatch the athlete on a cheap model in an isolated worktree,
  then open its PR with auto-merge enabled per the merge-policy table. Use when asked to "run the
  coaches", "run a governor cycle", or to work down structural debt autonomously. One dispatch per
  coach per cycle; never retries a failed athlete automatically.
---

# Governor — one dispatch cycle of the mechanized head coach

The head coach's policy, codified: what runs, when it may land, and what must never land without a
human. This is deliberately a *drill* someone invokes (ladder rung 2–3); scheduling it (rung 4) is
earned after the policy proves out over reps.

## The cycle

1. **SYNC.** `git fetch origin main` — every decision derives from shipped reality, never a stale tree.
2. **ROSTER.** For each coach with an athlete (`decomposer` ← arch-scan, `ui-librarian` ← dupe-scan):
   - **WIP limit 1:** if this coach already has an open PR (`refactor/decompose-*` / `refactor/dedupe-*`
     branch with an open PR), skip it this cycle. Inventory is waste.
   - **TARGET:** `node scripts/<gate>.mjs --candidate`. The gate picks; never hand-pick.
   - **COLLISION:** if the target file is modified by ANY open PR (`gh`/MCP: list open PR files), skip
     this coach this cycle — structural work never races feature work on the same file.
3. **DISPATCH.** Launch the athlete: cheap model tier (sonnet), isolated worktree, its standard contract
   (branch off origin/main, gate-confirm target, drill, verify by exit status, ratchet, push, report —
   no PR-opening; athletes carry no GitHub tooling). Include the known worktree caveat: node_modules may
   need a temporary symlink from the main checkout.
4. **LAND — one cycle, one PR.** Collect all green athlete reports and land them as a SINGLE cycle PR:
   merge each athlete's branch into one `refactor/governed-cycle-<n>` branch (their commits stay
   distinct for bisectability), verify green once, open one PR titled
   `refactor: governed cycle <n> — <rep summaries>`, and **enable auto-merge (SQUASH)** if — and only
   if — every rep in the batch is a class the merge-policy table allows (one disallowed rep = the whole
   PR waits for human review, or ship that rep separately). Batching halves CI runs, release entries,
   and GitHub API calls — the measured constraints. Exception: isolate a rep in its own PR when it is
   unusually large or risky enough that independent revert matters more than the savings.
   On a failure report: surface it to the human head coach verbatim; do not retry in-cycle.
5. **STOP.** One dispatch per coach per cycle. The next cycle recomputes targets from the NEW main —
   that re-derivation is the serializer that prevents two reps racing the same file.

## Feast mode — planned parallel burn-down

When the head coach declares a feast (a batch burn-down), the cycle serializer is replaced by **planned
partitioning**: each athlete gets an exclusive file territory (fence), multiple seams per dispatch are
allowed, and all green work assembles into ONE platter branch/PR (distinct commits kept for bisect).
Three standing rules:

- **Leftovers ledger.** Every skip-for-collision is recorded WITH the fence that caused it. A skip
  without a recorded fence is a process bug.
- **Every athlete completion is a mini-cycle trigger.** On each completion: mark that fence lifted,
  re-check the ledger, and route anything now unfenced — do not idle at an all-done barrier holding
  actionable work.
- **Cost test.** Dispatch a backfill athlete only if the freed work exceeds athlete spin-up cost;
  otherwise fold it into platter assembly. Surface the opportunity either way — never sit on it silently.

## Merge-policy table — what may auto-merge

| Class | Auto-merge | Rationale |
|---|---|---|
| Athlete PRs: behavior-preserving refactors, verified green + budget ratcheted | ✅ | The gates are the reviewer — that is their job |
| Docs-only | ✅ | Reversible; no runtime surface |
| Config/tooling (lint rules, budgets, scanners) | ⚠️ only if the same PR lands with zero open violations | Config changes the *system's* behavior |
| Features, visual work, auth/tokens/spend, anything outward-facing | ❌ never | Taste and the irreversible class stay with Eric |
| Workflow files (`.github/workflows/**`) | ❌ never | Gated behind Eric's one-click approval by design |

Auto-merge adds tempo, not trust: every auto-merged PR still passes typecheck · lint · full tests ·
all ratchet gates · commitlint, and post-merge the pipeline smoke-tests prod and rolls back on failure.

## Boundaries

- **No new athletes from here.** The governor dispatches the existing roster; recruiting a new agent
  follows the rule of three (docs/COACHES.md) and is a head-coach decision.
- **Never bypass a gate, never `--no-verify`, never edit a budget upward on an athlete's behalf.**
- **If in doubt about a PR's class, it does not auto-merge.** Default to human review.
