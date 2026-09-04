---
name: bury
description: >-
  Dispose of one knip-flagged dead-code finding — un-export, delete, or knip.json-ignore with a
  justification — behavior-preserving, verified green, the dead-code budget ratcheted. Use when the
  dead-code gate (scripts/dead-scan.mjs) names a target, when asked to "bury" or "remove dead code",
  or as a /grind skill step fanned across a knip sweep. The corrective drill the mortician agent
  runs; also invokable as /bury. Takes its target (a file, or a file + symbol) as the argument.
---

# Bury — the dead-code drill

The *correction* half of the dead-code Coach: the eye (`scripts/dead-scan.mjs` + `dead-budget.json`,
enforced by `tests/arch/dead.spec.ts`) says a symbol is unreferenced; this drill decides what that
actually means and lands the safe disposition. It is the **one** copy of the procedure — the
`mortician` agent preloads this file and follows it, and a `/grind` run points
`{kind: "skill", name: "bury"}` at it. #1326: two hand-copies of this loop diverged within a day of
being made, with nothing watching; the ladder in `docs/COACHES.md` says every coach has a drill, and
this coach had skipped that rung.

## The target

Whoever invokes the drill names the target. The `mortician` agent takes it from
`node scripts/dead-scan.mjs --candidate` (never hand-picked); a `/grind` item carries it as `{item}`,
produced by `npx knip --no-exit-code --reporter compact`; a human passes it as the argument. The drill
never re-derives the target from a fresh scan — a gate's output *is* the gate picking.

## Steps

1. `git fetch origin main && git checkout -B refactor/bury-<slug> origin/main` (`<slug>` from the
   target file or export name), then `bash scripts/worktree-setup.sh` — required inside a worktree,
   or every subsequent tool call exits 127. Skip only if the caller already did this on this branch.
2. Confirm the target is still flagged: `npx knip --no-exit-code --reporter compact`. If it isn't,
   report `status: "blocked"` with "already fixed on main" and stop.
3. **Read the code first**, then grep for every reference before touching anything. Grep the
   WHOLE repo, not just `src/`/`tests/`/`docs/` — a symbol can look dead to knip and to a narrow
   grep while still being wired into a `package.json` script, a GitHub Actions workflow, or a
   deploy-config file:
   `grep -rn "<symbol>" --include='*.ts' --include='*.mjs' --include='*.json' --include='*.toml' --include='*.yml' .`
4. Judge and act on the target:
   - Used only inside its own file but still `export`ed → **un-export** it (behavior unchanged).
   - Truly unreferenced anywhere (step 3's grep confirms) → **delete** it.
   - Confirmed intentional public surface (a comment, doc reference, or template contract proves
     it — not just "seems important") → add its path to `knip.json`'s `ignore` array and explain
     why in the commit body. Rare; when unsure, un-export instead of ignoring.
5. `npm run verify && node scripts/dead-scan.mjs` — every check must exit 0, or stop and report
   `status: "blocked"` with the failing output.
6. `node scripts/dead-scan.mjs --update` (the budget only ever moves down) — commit it in the same
   commit as the fix **only when this is the batch's single item**. In a multi-item wave, do NOT run
   it here: every item would rewrite the same shared budget file and the second to land loses the
   first's ratchet. The caller runs it once, after the wave's PR merges.
7. Commit (conventional, lowercase-led, e.g. `refactor: bury unused export in <area>`), push with
   4× backoff retries. Report `status: "done"` with a one-line disposition, the budget delta, and
   the pushed branch name in `branch`.

## Guardrails

- Never touch a path matching `envelope.json`'s `protected` patterns — if unsure, run
  `node scripts/envelope-scan.mjs --check <path>` on the target first. Report `status: "blocked"`
  with "target is envelope-protected" instead of editing it.
- Behavior must not change. Deleting something referenced anywhere — including a script,
  workflow, or deploy-config reference outside `src/`/`tests/`/`docs/` — is a failed rep.
- Never bypass a gate, never use `--no-verify`, never edit a budget upward.
- A tool exiting 127 means step 1's `worktree-setup.sh` was skipped or failed — run it and read
  what it says; never hand-roll a `node_modules` workaround.
- If blocked (verify fails, target already fixed, or target is protected), report `status:
  "blocked"` with why — don't improvise past it.

## Calling convention (grind)

Fan it with `{kind: "skill", name: "bury"}`. This drill needs `effort: "high"` (judging each item is
the hard part — grind's cheap default is strictly weaker), `isolation: true` (step 1 does its own
checkout), a trailing outcome check, and the item list **pre-filtered against `envelope.json`**
(`node scripts/envelope-scan.mjs --check <path>` per candidate) so no agent is spent on a target that
was never going to land. Fan as wide as the list goes, but two items must never name a symbol in the
same file, the wave lands as **one** PR, and `dead-scan --update` runs once after it
(`docs/COACHES.md` → the WIP limit counts open PRs, not dispatches).

```json
{
  "items": [{ "file": "src/a.ts", "symbol": "unusedThing" }],
  "steps": [
    { "kind": "skill", "name": "bury", "args": "{item}", "effort": "high" },
    { "kind": "script", "label": "verify-push", "command": "git ls-remote --exit-code --heads origin {prev.branch}" }
  ],
  "isolation": true
}
```

Hand-written for now: `scripts/grind-manifest.mjs` reads `docs/grind/*.instructions.md` front matter
only — teaching it to read a skill header is #1325's remaining half.
