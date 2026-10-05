---
name: governor
description: run one coach's athlete rep — WIP check, gate target, collision check, then the drill
model: sonnet
effort: high
isolation: worktree
outcomeCheck: 'git ls-remote --exit-code --heads origin {prev.branch}'
---

# Run one coach's athlete rep

**Calling convention:** generate the call with
`node scripts/grind-manifest.mjs --args --items '<json>' --item-source '<where the list came from>' docs/grind/governor.instructions.md`
rather than transcribing the front matter. `effort: high` because steps 2–4 are a go/no-go judgment
on someone else's open work and step 6 is a behavior-preserving refactor — `docs/COMPUTE.md` puts
anything that reads, writes or judges at `high`. `model: sonnet` is the tier `/governor` step 4
already dispatched its athletes at: mechanical-with-verification, and every rep is verified by exit
status before it pushes. `isolation: worktree` because step 5 does its own `git checkout -B`, and
without a fresh worktree per item concurrent reps share one working directory.

**One item per coach, never per target** — this is the whole fence, and it is what makes the
cycle's two invariants hold by construction rather than by prose:

```json
{
  "items": [
    { "coach": "Size",       "eye": "scripts/arch-scan.mjs",     "drill": "decompose", "prefix": "refactor/decompose-" },
    { "coach": "Duplication","eye": "scripts/dupe-scan.mjs",      "drill": "dedupe",    "prefix": "refactor/dedupe-" },
    { "coach": "Dead code",  "eye": "scripts/dead-scan.mjs",      "drill": "bury",      "prefix": "refactor/bury-" },
    { "coach": "Spec gap",   "eye": "scripts/spec-gap-scan.mjs",  "drill": "backfill",  "prefix": "test/backfill-" }
  ],
  "itemSource": "the four athlete coaches in docs/COACHES.md's defensive roster; each rep runs its own eye",
  "skipEnvelopeCheck": "the target is unknown until the gate picks it at step 2, so grind's step 0 has nothing real to check — step 4 below runs envelope-scan on the gate's actual target instead",
  "steps": [
    { "kind": "instructions", "path": "docs/grind/governor.instructions.md", "effort": "high", "isolation": true, "model": "sonnet" },
    { "kind": "script", "command": "git ls-remote --exit-code --heads origin {prev.branch}" }
  ]
}
```

Three things the front matter cannot carry, because `grind.js` cannot enforce them:

- **`skipEnvelopeCheck` is not emitted by `--args`** — add it by hand, with that reason. Grind's
  automatic step 0 extracts a path field from an object item; the only path these items carry is
  the `eye` script, which is never protected, so the check would pass vacuously on something that
  is not the target. Step 4 is the real one.
- **At most one item per `prefix`.** Two reps on one coach would race that coach's single
  ratchet-down budget file, and `docs/COACHES.md`'s WIP limit counts open PRs, not dispatches. With
  one item per coach, each budget's `--update` has exactly one writer, so the drill's own ratchet
  step is safe to run in-rep — no trailing once-per-batch `--update` to remember.
- **Under `work-mode:conserve`, pass fewer items than the roster has.** Grind's own spigot check
  refuses on `grindWidth` (5 under `conserve`), which four items clear — but
  `caps.governorDispatches` is **1** at that position (`work-mode.json`), and grind does not read
  that key. Run the single highest-leverage coach and name the ones deferred, exactly as
  `/governor` step 2 does.

**Landing the wave is the caller's job, not a rep's.** Each rep pushes its own branch and opens
nothing. After the run, merge every green branch into one `refactor/governed-cycle-<n>` branch
(commits stay distinct for bisectability), verify the union once, and open one PR per
`docs/COACHES.md` → *How the loop runs*. Never `scripts/ship.sh platter` — that is a different
mechanism, reserved for the irreversible class.

**What has actually been checked, and what has not** (2026-10-03, when this chore landed —
"partial beats false shipped", `docs/COACHES.md` → *Defensive roster*). Steps 1–4 were dry-run by
hand against live repo state for all four coaches: 7 open PRs, 46 changed files, no WIP hit, each
eye naming a target, no collision, nothing envelope-blocking. The preflight above emits exactly the
`steps` array shown. **Not yet proven:** a real dispatch — steps 5–8, the drill, the push, and the
caller's cycle PR. The first run is the test, and the honest thing to do with its ledger is paste it
onto whatever issue asked for the cycle.

## Goal

One rep of one coach's correction loop: the gate names the target, the rep refuses it if anyone
else is already working that file or that coach already has an open PR, and otherwise the drill
runs to a green, pushed branch. Done is a branch on origin — or a stated reason there isn't one.

## Steps

Your item is a JSON object with `coach`, `eye`, `drill` and `prefix`. Read those four fields out of
it yourself; nothing substitutes them for you.

1. **WIP 1 — the cheapest skip, so it goes first.**
   `gh pr list --state open --limit 100 --json headRefName --jq '.[].headRefName'`. If any open
   PR's head branch starts with your item's `prefix`, report `status: "skipped"` with
   `WIP 1: <branch> is already open for <coach>` and stop. Inventory is waste, and the next cycle
   recomputes this coach's target from a fresher `main` anyway.
2. **The gate picks the target; you never do.** `git fetch origin main`, then
   `node <eye> --candidate` (run it from the repo root; `npx` nothing). A `null` candidate, or no
   `candidate` key, means that budget is already met — report `status: "skipped"` with
   `<coach>: budget met, no candidate`. That is the goal, not a failure. Never fall back to
   `runnerUp` and never hand-pick: re-deriving the target is what keeps two reps off one file.

   **The four eyes do not agree on a field name** — verified 2026-10-03 by running all four. Read
   yours out of this table rather than assuming `candidate.file`:

   | Eye | Target field | The files your rep will touch |
   |---|---|---|
   | `arch-scan.mjs` | `candidate.file` | that one file, plus the new modules the split creates |
   | `dupe-scan.mjs` | `candidate.name` (a symbol, **not** a path) | every path in `candidate.files` — 12 of them is normal |
   | `dead-scan.mjs` | `candidate.target` (a path) + `candidate.exports` / `candidate.types` | that one file, plus any importer the drill has to touch |
   | `spec-gap-scan.mjs` | `candidate.file` | the new spec file; `src` is never edited |

3. **Collision — structural work never races feature work on the same file.** For each open PR from
   step 1, `gh api repos/{owner}/{repo}/pulls/<number>/files?per_page=100 --jq '.[].filename'`. If
   **any** file from your step-2 row appears in any of them, report `status: "skipped"` with
   `collision: <file> is open in #<number>` and stop. Do not switch targets to dodge it, and do not
   narrow a multi-file target to the files that happen to be free — a partial dedupe is a worse
   outcome than a skipped cycle. Duplication will skip the most often, because its target is a
   symbol spread across every file that pasted it; that is the check working, not a bug.
4. **Envelope check on the real target.**
   `node scripts/envelope-scan.mjs --check <every path from your step-2 row> --base origin/main`.
   Any entry with `blocking: true` → report `status: "blocked"` with
   `target is envelope-protected` and stop. This is the check grind's step 0 could not do for you
   (see the calling convention above).
5. **Branch and set up.** `git checkout -B <prefix><slug> origin/main` (`<slug>` from the target's
   basename, or the symbol's name for duplication), then `bash scripts/worktree-setup.sh`. A later tool exiting 127 means this step was
   skipped or failed — read what it says rather than hand-rolling a `node_modules` workaround.
6. **Run the drill, following its own spec exactly.** Read `.claude/skills/<drill>/SKILL.md` and
   carry it out against the target, including its ratchet step. That file is the single copy of the
   loop — do not reconstruct it from this chore, and do not improvise past a guardrail it states.
   (A `{kind: "skill"}` step cannot do this: grind runs the *same* chain for every item, and the
   drill name differs per coach. Reading the skill is how one chain reaches four drills.)
7. **Verify by exit status, never tailed output.** `npm run typecheck`, `npm run lint`, `npm test` —
   each must exit 0. A pipeline exits with its last command's status, so never `cmd | tail`.
8. **Commit, push with retries, report.** Conventional-Commit subject, lowercase-led, ≤100
   characters (the drill's own spec names the shape). Report the pushed branch name in the `branch`
   field — the trailing `git ls-remote` step verifies it against origin rather than trusting your
   `done`. Open no PR: athletes carry no GitHub write tooling by design, and the caller lands the
   wave as one cycle PR.

## Guardrails

- **One target, one rep.** Everything beyond the file the gate named at step 2 is out of scope,
  however tempting the file next to it looks.
- **Never bypass a gate, never `--no-verify`, never edit a budget upward.** A budget only ever moves
  down, and only through its own `--update`.
- **Never recruit, never retarget.** This chore dispatches the existing roster against the existing
  gates. A new athlete is a head-coach decision under the rule of three (`docs/COACHES.md`), and a
  hand-picked target is the one thing the gate exists to prevent.
- **A skip is a successful rep.** Three of the four stop conditions above (WIP, budget met,
  collision) are the cycle working as designed; report them plainly and do not retry in-run.
- **Blocked means blocked.** Verify failing, the target already fixed on `main`, a protected path —
  report `status: "blocked"` with why. Never improvise past it, and never retry a failed rep inside
  the same run.
