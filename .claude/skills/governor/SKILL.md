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
4. **LAND.** On a green report: open the PR (title/body from the athlete's report, conventional subject)
   and **enable auto-merge (SQUASH)** if — and only if — the merge-policy table below allows the class.
   On a failure report: surface it to the human head coach verbatim; do not retry in-cycle.
5. **STOP.** One dispatch per coach per cycle. The next cycle recomputes targets from the NEW main —
   that re-derivation is the serializer that prevents two reps racing the same file.

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
