# Bury one dead-code finding

**Calling convention:** invoke this step with `effort: "high"`. This chore duplicates the
mortician agent's own judgment loop (`.claude/agents/mortician.md`), which is pinned to high
effort because "read the code first, judge each item" is the actual hard part — grind's cheap
default is strictly weaker than the task this file asks for.

**Run with `isolation: true`:** step 1 below does its own `git checkout -B` — without a fresh
worktree per item, concurrent items share one working directory and stomp on each other's
checkout. Worktree isolation avoids that entirely.

**Fanning several items at once is fine; landing them separately is not.** The mortician Coach's
WIP limit counts *open PRs*, not dispatches (`docs/COACHES.md` → "How the loop runs"), so run N
items concurrently, then assemble the wave into ONE landing PR and run `dead-scan --update` once
after it — see step 6. Two items must never name a symbol in the same file.

**Pre-filter, don't rely on this file alone:** before fanning items out, check each target against
`envelope.json`'s protected patterns (`node scripts/envelope-scan.mjs --check <path>`) and drop any
that match. A protected-path deletion still hard-gates at CI rather than silently merging, but by
then an agent has already spent effort on a target that was never going to land — filter it out of
the item list instead.

## Goal

Take one knip-flagged dead-code finding (an unused file, export, or type) and give it a safe,
behavior-preserving disposition — un-export, delete, or `knip.json`-ignore with justification —
verify green, and ratchet the dead-code budget down.

## Steps

1. `git fetch origin main && git checkout -B refactor/bury-<slug> origin/main` (pick `<slug>` from
   the target file or export name), then `bash scripts/worktree-setup.sh` — required inside a
   worktree, or every subsequent tool call exits 127.
2. Confirm the target is still flagged: `npx knip --no-exit-code --reporter compact`. The target
   below is already picked for you — don't re-derive it from a fresh scan.
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
   first's ratchet. The caller runs it once, after the wave's PR merges (calling convention above).
7. Commit (conventional, lowercase-led, e.g. `refactor: bury unused export in <area>`), push with
   retries. Report `status: "done"` with a one-line disposition, the budget delta, and the pushed
   branch name in `branch` — chain `{kind: "script", command: "git ls-remote --exit-code --heads
   origin {prev.branch}"}` after this step so the push is verified, not trusted
   (`docs/grind/README.md`).

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
