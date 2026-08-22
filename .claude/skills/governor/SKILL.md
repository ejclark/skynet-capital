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
2. **ROSTER.** The full athlete roster — every coach in `docs/COACHES.md` that has one. Walk **all** of
   them each cycle; a coach silently omitted here is a debt dimension that never gets worked.

   | Athlete | Eye (`--candidate`) | Branch prefix (WIP glob) |
   |---|---|---|
   | `decomposer` | `scripts/arch-scan.mjs` | `refactor/decompose-*` |
   | `ui-librarian` | `scripts/dupe-scan.mjs` | `refactor/dedupe-*` |
   | `mortician` | `scripts/dead-scan.mjs` | `refactor/bury-*` |
   | `test-backfiller` | `scripts/spec-gap-scan.mjs` | `test/backfill-*` |

   Coaches with an eye but **no athlete yet** (`dep-graph`, `incident`) are not dispatched — they await
   the rule of three. Their gates still enforce in CI; only the autonomous correction is missing.

   For each athlete in the table:
   - **WIP limit 1:** if its branch glob already has an open PR, skip it this cycle. Inventory is waste.
   - **TARGET:** `node <its eye> --candidate`. The gate picks; never hand-pick. No candidate (budget
     already met) → skip; that dimension is clean, which is the goal, not a failure.
   - **COLLISION:** if the target file is modified by ANY open PR (`gh`/MCP: list open PR files), skip
     this coach this cycle — structural work never races feature work on the same file.
3. **DISPATCH.** Launch the athlete: cheap model tier (sonnet), isolated worktree, its standard contract
   (branch off origin/main, `bash scripts/worktree-setup.sh`, gate-confirm target, drill, verify by exit
   status, ratchet, push, report — no PR-opening; athletes carry no GitHub tooling).
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

## Merge-policy table — auto-merge is the default

**Standing rule: every Claude-authored PR gets native auto-merge (SQUASH) enabled at open, so it
merges itself the moment CI goes green — unless Eric says hold it, or it falls in a carve-out below.**
Auto-merge is opt-*out*, not opt-in: the reviewer is the gate suite, and flow is the point. To hold a
PR for Eric's eyes, either don't enable auto-merge or add a `no-automerge` label; say so per-PR.

| Class | Auto-merge | Rationale |
|---|---|---|
| Everything by default: athlete refactors, docs, features, visual work — verified green | ✅ default-on | The gates are the reviewer; revert is cheap; tempo is the point |
| Config/tooling (lint rules, budgets, scanners) | ✅ only if the same PR lands with zero open violations | Config changes the *system's* behavior |
| Visual/taste work Eric wants to eyeball first | ⏸ hold on request only | Reaffirmed (Eric, 2026-08-20, PR #459): taste review is live post-merge by default; a pre-merge hold happens only when Eric names the PR or Claude flags a specific taste fork |
| Workflow files (`.github/workflows/**`) | ❌ never | High blast radius; Eric rations runner minutes — his one-click by design |
| Auth/tokens/spend, credentials, anything outward-facing **and hard to reverse** | ❌ never | The irreversible class stays Eric's (CLAUDE.md hard boundaries). The list is `envelope.json` — check with `envelope-scan --check`, don't reason from memory |

**"Outward-facing" means reachable by a non-member, or changing a contract with an external service
— not "a user can see it".** This is a web app: every UI string is literally outward-facing, and the
copies of this rule that dropped `and hard to reverse` are where the over-triggering came from. A
copy tweak is not the irreversible class.

Auto-merge adds tempo, not trust: every auto-merged PR still passes typecheck · lint · full tests ·
all ratchet gates · commitlint, and post-merge the pipeline smoke-tests prod and rolls back on failure.
Native auto-merge (not an in-CI REST merge) is deliberate: a GITHUB_TOKEN merge would not trigger the
`push`→`main` deploy job, so the merge must be a first-class GitHub merge.

## Boundaries

- **No new athletes from here.** The governor dispatches the existing roster; recruiting a new agent
  follows the rule of three (docs/COACHES.md) and is a head-coach decision.
- **Never bypass a gate, never `--no-verify`, never edit a budget upward on an athlete's behalf.**
- **In doubt about a PR's class → check, don't hold.** `node scripts/envelope-scan.mjs --check
  <paths>` answers it mechanically; if nothing comes back protected, arm auto-merge and revert if it
  turns out wrong. This line used to say the opposite ("default to human review"), which quietly
  re-instated the universal pre-merge gate `CLAUDE.md` calls a throughput bug — *"every trivial PR
  silently becomes a request for Eric's attention — the exact ToC violation this whole model exists
  to avoid."* Doubt is cheap to resolve and reverts are cheap to make; his attention is neither.
