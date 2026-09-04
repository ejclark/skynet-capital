---
name: backfill
description: >-
  Write behavioral BDD specs for one src file no spec imports — add-only, never touching src or
  existing tests, verified green, the spec-gap budget ratcheted. Use when the spec-gap gate
  (scripts/spec-gap-scan.mjs) names a target, when asked to "backfill tests" or "add specs for",
  or as a /grind skill step fanned across the gate's list. The corrective drill the test-backfiller
  agent runs; also invokable as /backfill. Takes the target file as the argument.
---

# Backfill — the spec-gap drill

The *correction* half of the spec-gap Coach: the eye (`scripts/spec-gap-scan.mjs` +
`spec-gap-budget.json`, enforced by `tests/arch/spec-gap.spec.ts`) says a `src/` file has no spec
importing it; this drill writes the behavioral coverage. It is the **one** copy of the procedure —
the `test-backfiller` agent preloads this file and follows it, and a `/grind` run points
`{kind: "skill", name: "backfill"}` at it (#1326 — see `/bury` for why the copies went away).

## The target

Whoever invokes the drill names the target. The `test-backfiller` agent takes it from
`node scripts/spec-gap-scan.mjs --candidate` (never hand-picked); a `/grind` item carries it as
`{item}`, produced by `node scripts/spec-gap-scan.mjs`; a human passes it as the argument. The drill
never re-derives the target from a fresh scan.

## Steps

1. `git fetch origin main && git checkout -B test/backfill-<slug> origin/main`, then
   `bash scripts/worktree-setup.sh` — required in a worktree, or every subsequent tool call exits
   127. Skip only if the caller already did this on this branch.
2. **Check the carve-out before reading anything** (Guardrails, first bullet). Then confirm the
   target is still flagged (`node scripts/spec-gap-scan.mjs`); if it isn't, report
   `status: "blocked"` with "already covered on main" and stop.
3. **Read the target module first, in full**, before writing anything.
4. Write BDD specs per `docs/ENGINEERING.md`: `describe("when <situation>")` →
   `it("<expected behavior>")`, asserting on observable behavior (rendered output, returned
   values, produced intents) — never private fields or call counts. Use
   `tests/support/builders.ts` for shared test data; fake transports/fetch at I/O boundaries.
   Cover the main paths and the edge cases a reader would worry about (empty inputs, boundaries,
   error paths).
5. `npm run verify` — must exit 0, or stop and report `status: "blocked"` with the failing output.
6. `node scripts/spec-gap-scan.mjs --update` (the budget only ever moves down) — commit it with the
   specs **only when this is the batch's single item**. In a multi-item wave, do NOT run it here;
   the caller runs it once after the wave's PR merges.
7. Commit (`test: behavioral specs for <module>`), push with 4× backoff retries. Report the module,
   test count, behaviors covered, and the pushed branch name in `branch`.

## Guardrails

- **Trading/risk carve-out — check this before step 3.** If the target path matches
  `src/trading/**`, `src/playbooks/**`, `src/alpaca/**`, `src/engine/guards.ts`, or
  `src/bots/account-guard.ts`, do NOT write specs against current behavior. Report
  `status: "blocked"` with summary "needs human confirmation of correct behavior before specs are
  written" and stop — options-payoff and risk-sizing logic is exactly where a plausible-looking
  spec can enshrine a real bug instead of catching one. This binds every caller, the
  governor-dispatched athlete included: an athlete that runs once per cycle is not more trustworthy
  on that class of code than a grind item is.
- **Tests must be honest:** a spec that asserts whatever the code currently does, without judging
  whether it SHOULD, is worse than none. If you find behavior that looks like a bug outside the
  carve-out above, write the spec for the correct behavior, mark it `.todo`/skip with a comment
  explaining why, and report it — never enshrine a bug.
- Add-only: never modify `src/**` to make a test pass, never weaken an existing spec.
- A tool exiting 127 means step 1's `worktree-setup.sh` was skipped or failed — run it and read
  what it says; never hand-roll a `node_modules` workaround.

## Calling convention (grind)

Fan it with `{kind: "skill", name: "backfill"}`. This drill needs `effort: "high"` (judging
correct-vs-buggy behavior before writing a spec is real work), `isolation: true` (step 1 does its
own checkout), and a trailing outcome check. Stage a list longer than ~3 files in waves; each wave
lands as **one** PR and `spec-gap-scan --update` runs once after it (`docs/COACHES.md` → the WIP
limit counts open PRs, not dispatches).

```json
{
  "items": ["src/companion/companion-help.ts", "src/storage/participant-state.ts"],
  "steps": [
    { "kind": "skill", "name": "backfill", "args": "{item}", "effort": "high" },
    { "kind": "script", "label": "verify-push", "command": "git ls-remote --exit-code --heads origin {prev.branch}" }
  ],
  "isolation": true
}
```

Hand-written for now: `scripts/grind-manifest.mjs` reads `docs/grind/*.instructions.md` front matter
only — teaching it to read a skill header is #1325's remaining half.
