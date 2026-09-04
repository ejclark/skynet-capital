---
name: ship
description: >-
  Land a verified branch as a PR the resource-cheap way: local verify → push → open the PR over
  REST (the plentiful core bucket) → one auto-merge call → STOP. No polling; the merge webhook is
  the completion signal. Use whenever you're opening a PR or merging a green branch in this repo,
  and instead of hand-rolling the GitHub MCP PR dance (which spends the scarce GraphQL bucket by
  the thousands). Wraps scripts/ship.sh.
---

# /ship — the cheap, no-poll path to landing a PR

The mechanics live in `scripts/ship.sh` (a one-time build cost, ~free per run). This skill is the
**policy** that makes the model reach for it instead of the expensive habit. The rule that matters:
**never poll GitHub for status, and never route bulk operations through the GraphQL MCP.**

## Why (the constraint this protects)

`git` and repo-scoped **REST** run on your machine / the **core** bucket (15k/hr, barely touched).
The GitHub **MCP** spends **GraphQL** (5k/hr) — one MCP PR-create+auto-merge+read cycle measured
**~6,000 points**, enough to exhaust the bucket by itself; repeated status-polling is what actually
drained it. See `docs/COACHES.md` → *Resource cost is a fitness dimension*.

## The flow

1. **Verify locally first.** `scripts/ship.sh open` runs `npm run verify` (parity with CI) and
   refuses to push on red — never spend a runner or a PR on a known loser.
2. **Open over REST.** It pushes the branch and `POST`s the PR on the core bucket, printing the PR
   number. (If the proxy blocks REST writes, it exits 2 and tells you to fall back to **one**
   `mcp__github__create_pull_request` call — one call, not thousands.)
3. **Arm auto-merge — the one required GraphQL call.** Make exactly **one**
   `mcp__github__enable_pr_auto_merge` (SQUASH). That's ~1 point/PR — trivial; the problem was never
   a single arm call, it was polling. This gives server-side merge-on-green even if the session ends.
   **This call is not optional for `main`:** direct REST merge into a protected branch is refused for
   this session type (`403 "Merging into a protected base branch is not permitted for this session
   type"`), so native auto-merge is the *only* way this session can land a PR on `main`.
4. **STOP. Do not poll.** No `list_pull_requests`, no `pull_request_read`, no status check-ins. The
   merge **webhook** is the completion signal — act when it arrives, not before.

**When GraphQL is exhausted** (can't make the arm call): don't wait or poll. **Eric web-merges** —
his browser session isn't rate-limited, and a green PR merges in one click. That's the escape hatch,
not `ship.sh merge`. (`scripts/ship.sh merge <n>` works only for an *unprotected* base branch — never
`main` here — so it's rarely used.)

## Carve-outs — never auto-land (open the PR, hand to Eric)

- **Workflow files** (`.github/workflows/**`) — high blast radius; Eric's one-click.
- **Credentials / spend / outward-facing *and hard to reverse*** (CLAUDE.md hard boundaries). The
  authoritative list is `envelope.json` — `node scripts/envelope-scan.mjs --check <paths>` answers
  "is this a carve-out?" mechanically. "Outward-facing" means reachable by a non-member or changing
  an external contract, NOT "a user can see it"; on a web app the loose reading catches every copy
  change, which is exactly how this gate over-triggered.
- **Visual/taste work Eric asked to eyeball first.**

For these: `scripts/ship.sh open` to create the PR, but do **not** arm auto-merge.

## Batching — and the platter, for the carve-outs above

Prefer one PR over many (fewer pushes, fewer opens, fewer merges = less of every finite resource).
For ordinary auto-merging work: assemble athlete branches locally with `git`, verify once, `ship
open` once.

For the **carve-outs** — the changes Eric merges by hand — that same shape is the **platter**
(#1343). The boundary never moves; only its cost does. On 2026-09-04 seven protected-path changes
cost seven separate hand-merges, and the held set was not even enumerable.

```
scripts/ship.sh platter open <item-branch>   # cut platter/<date> off main, board item 1, open it HELD
scripts/ship.sh platter board <item-branch>  # board the next item; push; refresh the PR's ledger
scripts/ship.sh platter ledger [--body]      # the table (or the whole PR body), read from git
```

- **One commit per item, merged with "Create a merge commit"** — that is what keeps `git revert
  <item sha>` able to drop a single item. Squashing the platter still lands the same tree but
  collapses the items, and revert degrades to all-or-nothing. The PR body says so above the fold.
- **Nothing red boards.** `board` runs `npm run verify` on the post-board tree and un-boards the
  item on red. This matters more than it looks: `pipeline.yml`'s `verify` triggers on `pull_request:
  branches: [main]`, so a PR based on a platter branch runs **no CI at all** — the platter PR is the
  union's first CI run, and local verify per board is the only per-item proof that exists.
- **Never a workspace.** A conflicting item catches up to `main` on its own branch and re-boards;
  nothing is ever fixed on the platter.
- **No same-file fence.** Feast mode's "two items must not touch the same file" comes from parallel
  athletes. The platter boards sequentially onto one integration branch, so same-file items are fine
  in order — a conflict is just an item that has to catch up first.
- **Cadence:** ship the platter when `node scripts/digest-scan.mjs --due` says a digest is due (5
  landed commits, or the 7-day heartbeat). An item ships alone instead only when it is **hot**:
  `scripts/incident-scan.mjs` names an unlearned incident it fixes, or a deploy is blocked on it.
  Anything else waits for the cadence — "it feels urgent" is not the test.
- **It is never armed**, by two independent mechanisms: `--hold` applies `hold-merge` (which
  `pipeline.yml`'s arm job skips) and the diff is protected (which `checkarm` refuses, exit 5).
- **`--hold` now labels.** Any held PR, platter or not, gets `hold-merge` — so "what is waiting on
  Eric?" is a label query rather than a guess.

## Mechanics & traps (moved here from CLAUDE.md, 2026-08-28 — this skill owns the landing detail)

- **No `git stash`, ever.** It has silently dropped stashed edits in this environment (the incident
  is banked in `docs/LESSONS.md`). Branch-first (`git checkout -B <branch> origin/main` *before
  editing*) makes stash unnecessary.
- **Commit subjects are lowercase-led** — commitlint rejects a capitalized first word, including
  proper nouns ("PRs", "Barad-dûr"). Conventional-Commit types; imperative mood.
- **PR bodies go over REST (`ship.sh`), never through the GitHub MCP write tools** — those silently
  strip `<details>`/`<summary>`, so the whole brief lands above the fold while the tool reports
  success (`docs/LESSONS.md`, 2026-08-25). `ship.sh checkbody` lints the *file*, not what GitHub
  stored. If a body must go through the MCP tools anyway, keep the below-fold content short, then
  re-read the PR and count the `<details>` before calling it done.
- **Promote drafts immediately.** Some Claude Code environments force every PR open as a draft —
  that is a property of the tool, never a readiness judgment. A lingering draft is a throughput bug
  twice over: drafts can't auto-merge (silently converting a trivial PR into a request for Eric's
  attention), and drafts skip `verify` (`docs/LESSONS.md`, 2026-08-14 — draft-by-default once merged
  code with no CI at all). The moment a PR opens: mark ready + arm auto-merge in the same breath,
  unless a carve-out genuinely applies.
- **The merge-arming axis is whose token arms it, not REST-vs-native** (2026-08-22). Native
  auto-merge lands as the identity that ARMED it; arming with `GITHUB_TOKEN` produces a push that
  triggers no workflows (GitHub's loop guard) — it took out the deploy, the receipt scan, and the
  stall audit at once, silently. Arm with a real identity. `node scripts/deploy-lag.mjs` answers
  "is `main` actually deployed?"; the full story lives in that script's header.
- **Catching a branch up to `main` (a merge conflict, or `ship open`'s stale-base guard below): use
  `git merge origin/main --no-edit`, never a hand-written message.** commitlint requires
  Conventional-Commit format and only exempts git's own auto-generated `Merge branch 'X' into Y`
  text — a custom sentence fails the commit-msg hook (`docs/LESSONS.md`, 2026-09-04). `ship open`
  now refuses to verify a branch that's behind `origin/$base` at all (same date's lesson): local
  `npm run verify` tests the checked-out tree, not the actual PR-merge state, so a stale base can
  pass locally and still fail CI on a check that only exists once `main`'s own newer commits are
  folded in.
