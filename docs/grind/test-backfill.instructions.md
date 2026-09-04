---
name: test-backfill
description: backfill BDD specs for one src file flagged by scripts/spec-gap-scan.mjs
effort: high
isolation: worktree
outcomeCheck: 'git ls-remote --exit-code --heads origin {prev.branch}'
---

# Backfill one spec-gap finding

**Calling convention:** the front matter above is the calling convention — generate the call with
`node scripts/grind-manifest.mjs --args --items '<json>' docs/grind/test-backfill.instructions.md`
rather than transcribing these values by hand. `effort: high` because this duplicates the test-backfiller
agent's own loop (`.claude/agents/test-backfiller.md`), which is pinned to high effort for the same
reason grind's cheap default is the wrong fit here: judging correct-vs-buggy behavior before
writing a spec is real work. `isolation: worktree` because step 1 below does its own
`git checkout -B`, and without a fresh worktree per item, concurrent items share one working
directory and stomp on each other's checkout.

What the front matter **cannot** carry, because `grind.js` cannot enforce it — if the item list has
more than ~3 files, stage it in
waves rather than one fully-parallel run, assemble each wave into ONE landing PR, and run
`node scripts/spec-gap-scan.mjs --update` once per wave (not per item). That is the test-backfiller
Coach's WIP limit as written — one open PR per Coach, counted in *open PRs, not dispatches*
(`docs/COACHES.md` → "How the loop runs"); this file follows that line rather than re-deriving it.

## Goal

Take one file flagged by `scripts/spec-gap-scan.mjs` (a `src/` file no spec imports) and add
behavioral BDD specs for it — never modify `src/**` or existing tests.

## Steps

1. `git fetch origin main && git checkout -B test/backfill-<slug> origin/main`, then
   `bash scripts/worktree-setup.sh` — required in a worktree, or every subsequent tool call exits
   127.
2. `node scripts/spec-gap-scan.mjs --candidate` only to confirm the target is still flagged — don't
   re-pick a different file.
3. **Read the target module first, in full**, before writing anything.
4. Write BDD specs per `docs/ENGINEERING.md`: `describe("when <situation>")` →
   `it("<expected behavior>")`, asserting on observable behavior (rendered output, returned
   values, produced intents) — never private fields or call counts. Use
   `tests/support/builders.ts` for shared test data; fake transports/fetch at I/O boundaries.
   Cover the main paths and the edge cases a reader would worry about (empty inputs, boundaries,
   error paths).
5. `npm run verify` — must exit 0, or stop and report `status: "blocked"` with the failing output.
6. Commit (`test: behavioral specs for <module>`), push with retries. Report the module, test
   count, behaviors covered, and the pushed branch name in `branch` — chain `{kind: "script",
   command: "git ls-remote --exit-code --heads origin {prev.branch}"}` after this step so the push
   is verified, not trusted (`docs/grind/README.md`). Do NOT run `--update` yourself — that happens
   once per wave, after every item in it lands (see calling convention above).

## Guardrails

- **Trading/risk carve-out — check this before step 3.** If the target path matches
  `src/trading/**`, `src/playbooks/**`, `src/alpaca/**`, `src/engine/guards.ts`, or
  `src/bots/account-guard.ts`, do NOT write specs against current behavior. Report
  `status: "blocked"` with summary "needs human confirmation of correct behavior before specs are
  written" and stop — options-payoff and risk-sizing logic is exactly where a plausible-looking
  spec can enshrine a real bug instead of catching one.
- **Tests must be honest:** a spec that asserts whatever the code currently does, without judging
  whether it SHOULD, is worse than none. If you find behavior that looks like a bug outside the
  carve-out above, write the spec for the correct behavior, mark it `.todo`/skip with a comment
  explaining why, and report it — never enshrine a bug.
- Add-only: never modify `src/**` to make a test pass, never weaken an existing spec.
- A tool exiting 127 means step 1's `worktree-setup.sh` was skipped or failed — run it and read
  what it says; never hand-roll a `node_modules` workaround.
