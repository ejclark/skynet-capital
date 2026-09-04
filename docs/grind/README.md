# Grind — reusable batch-chore specs

`/grind` (`.claude/workflows/grind.js`) fans one repetitive chore out across many similar targets —
cheap model, low effort, one agent per item — instead of doing them one at a time in the main
thread. This directory holds the reusable `*.instructions.md` files a grind run can point at, so a
chore gets written once and reused, instead of re-pasted into `promptTemplate` every time.

Maps onto the codification ladder in [`../COACHES.md`](../COACHES.md): a one-off chore is a
`promptTemplate` string; the second time you'd paste the same string, write it down here instead.

## Two ways to call grind

**Single-stage** (unchanged, still the default for a one-off):

```json
{ "items": ["a.ts", "b.ts"], "promptTemplate": "Add a JSDoc comment to every exported function in {item}." }
```

**Multi-stage** — each item runs the same ordered chain of steps (`args.steps`), via `pipeline()` so
items don't wait on each other's slowest step:

```json
{
  "items": ["a.ts", "b.ts"],
  "steps": [
    { "kind": "script", "command": "npx tsc --noEmit {item}" },
    { "kind": "instructions", "path": "docs/grind/fix-type-error.instructions.md" },
    { "kind": "script", "command": "npx tsc --noEmit {item}" }
  ]
}
```

(`fix-type-error.instructions.md` above is illustrative — not a checked-in file. See "Real,
checked-in chores" below for ones that actually exist.)

Once a step reports `blocked` or `skipped` for an item, later steps pass it through unchanged
rather than spending an agent on a target the chain already gave up on.

## Step kinds

- **`script`** — runs an exact shell command, no reasoning asked of it. Use this whenever the
  chore genuinely reduces to a command (a lint fix, a codemod, a check). Cheapest and fastest;
  prefer it over `prompt`/`instructions` whenever it's sufficient — this is the "codify the loop
  into a script" rung of the ladder, applied per-step instead of per-workflow.
- **`instructions`** — points at a `*.instructions.md` file in this directory (see format below).
  Use this once the same free-text chore is being handed to grind a second time.
- **`skill`** — invokes an *existing* repo skill (its `.claude/skills/<name>/SKILL.md`) against the
  item, as if a user had typed `/<name>`. This is deliberately **not** a parallel "skills.md"
  convention — skills already have one canonical spec file (`SKILL.md`) under `.claude/skills/`;
  grind composes those, it doesn't duplicate them. Use this to fan a skill that's normally invoked
  one target at a time (`/decompose`, `/dedupe`, `/telestrator`, …) across a whole batch at once,
  e.g. `{ "kind": "skill", "name": "decompose", "args": "<file>" }` run over every file the
  arch-scan gate flags this cycle, instead of one `/governor` cycle per file.
- **`prompt`** — free text, `{item}`/`{prev}` substituted. The escape hatch for a chore that hasn't
  earned its own file yet (rule of three: write it inline once, promote to `instructions` on the
  second recurrence — same rule COACHES.md applies to skills vs. agents).

Every step after the first gets the prior step's `{status, summary}` result as `{prev}` in its
prompt, so a chain can react to what came before (a script step's failing output feeding an
`instructions` step that's meant to fix it, for example).

## `*.instructions.md` format

Keep it the same shape a human would want if they picked this file up cold — it IS being handed to
a fresh, context-free subagent every time it runs:

```markdown
# <imperative title — what this chore does>

## Goal
One or two sentences: what "done" looks like for one target.

## Steps
1. ...
2. ...

## Guardrails
- What NOT to do (scope creep, files not to touch, behavior not to change).
- What to report back if blocked, and how (status: blocked + why, in the summary).
```

Substitution: the calling grind run supplies the target as the agent's `{item}` — reference it in
prose ("the target below") rather than trying to template inside the instructions file itself;
`grind.js` interpolates `{item}`/`{prev}` into the wrapper prompt, not into the file contents.

## Real, checked-in chores

- [`bury-dead-code.instructions.md`](bury-dead-code.instructions.md) — dispose of one
  knip-flagged unused export/type/file (mirrors the `mortician` agent's loop).
- [`fix-doc-rot.instructions.md`](fix-doc-rot.instructions.md) — fix one dead doc reference
  flagged by `scripts/doc-rot-scan.mjs`.
- [`triage-comment-bloat.instructions.md`](triage-comment-bloat.instructions.md) — triage one
  file's worth of narration-only comments flagged by `scripts/comment-bloat-scan.mjs`.
- [`test-backfill.instructions.md`](test-backfill.instructions.md) — backfill BDD specs for one
  file flagged by `scripts/spec-gap-scan.mjs` (mirrors the `test-backfiller` agent's loop).
- [`research-bottleneck.instructions.md`](research-bottleneck.instructions.md) — for one
  `bottleneck`-labelled issue, find the superior *existing* solution, battle-test the candidates
  against primary sources and `envelope.json`, and leave a call sheet + routing label on the
  issue. The pursuit half of the capture-and-pursue lane: any session that measures a new
  constraint files it with `/issue` + `bottleneck`; a grind run over the open ones does the
  research so no one's attention (least of all Eric's) is spent re-deriving it. Research, not
  mechanics — call it with `effort: "high"` and the best model available.

Each of these was chosen and vetted through a research pass (red/blue/purple/tiger/yellow-teamed —
see the PR that added them) against every gate this repo currently runs; several plausible-looking
batch chores (fanning `/decompose` or `/dedupe`, renumbering forward-test IDs) were deliberately
**not** codified here because they need cross-item context a fan-out can't safely give them — see
each file's own header for why, when a reason applies.

## Calling convention: effort, model, and the shared-budget-file race

`grind.js` has no way to read an `*.instructions.md` file's contents before dispatching an agent to
it (workflow scripts have no filesystem access) — so a chore that genuinely needs a higher
effort/model tier than grind's cheap default has to say so in its own header, and the **caller**
is responsible for actually passing `{effort: "high", ...}` (or whatever the file asks for) in the
`steps` array. Read each instructions.md's "Calling convention" note before invoking it.

The same applies to gates that rewrite one shared budget/ratchet file (`*-scan.mjs --update`):
running `--update` inside each parallel item's own step risks two agents racing the same file.
Every instructions.md above that touches a ratcheted gate says explicitly whether to run
`--update` per item, once at the end (non-isolated), or not at all from within the chain.

That race is also the reason a Coach's WIP limit is not a cap on how wide you may fan. The limit
counts **open PRs, not dispatches** (`docs/COACHES.md` → "How the loop runs"), so N items may run
concurrently as long as the wave lands as one PR with one trailing `--update`, and one file belongs
to exactly one item. Cite that line rather than re-deriving the answer in a new chore file.

### Verify the outcome mechanically — never trust a `done`

A step's `{status, summary}` is a self-report. Issue #1028 (fixed by #1309 for the feedback-triage
lane) is what that costs: a session that completes end to end and reports success while having
done nothing visible, with nothing to catch it. Grind's answer is the same as #1309's — check the
world, not the claim. A step that pushes a branch reports it in the optional `branch` field of its
result; every step after the first can read it as `{prev.branch}` (`{prev.<field>}` substitutes one
field, `{prev}` the whole JSON), so the chain ends with:

```json
{ "kind": "script", "command": "git ls-remote --exit-code --heads origin {prev.branch}" }
```

A `done` with no branch on origin makes that command fail, which reports `blocked` — fail-closed.
A missing `branch` field substitutes to an empty string and fails the same way. Every checked-in
chore above reports its branch and expects this trailing step; the four calling conventions say so.

## Known limitations

- **No built-in `envelope.json` enforcement.** An instructions.md file can tell its agent to
  self-check and report `blocked` on a protected path, but nothing in `grind.js` itself filters the
  `items` list before dispatch. When an item list comes from a live gate scan (knip, arch-scan,
  etc.) rather than a fixed list you wrote by hand, filter out anything matching
  `envelope.json`'s protected patterns yourself before calling grind — a protected-path edit still
  gets caught at CI, but only after an agent already spent effort on a target that was never going
  to land.
- **`skill` steps reach `.claude/skills/*/SKILL.md` only, not `.claude/agents/*.md`.** Several
  useful batch chores mirror an existing single-target *agent* (`mortician`, `test-backfiller`,
  `decomposer`, `ui-librarian`) rather than a skill — for those, the `instructions` step kind is
  the only current option, which means hand-duplicating the agent's loop into a `*.instructions.md`
  file (as the four files above do) rather than reusing it directly. This is a deliberate,
  documented trade rather than an oversight: those agents' own contracts say to always pick their
  target from a fresh `--candidate` scan and never accept a hand-picked one, so pointing several
  parallel grind items at the same agent type risks every one of them independently re-deriving
  the *same* top-priority target instead of respecting the item list — a correctness risk, not just
  a missing convenience. Revisit only after that "never hand-pick" contract has a way to accept an
  explicit target.

## When to reach for this vs. `/governor` or a purpose-built workflow

- **One target, needs judgment** → do it directly, no grind.
- **Many near-identical targets, low judgment per item** → grind (this directory).
- **Structural debt with its own gate + ratchet (dead code, duplication, file size)** →
  `/governor` already dispatches those one PR at a time; grind is for chores that don't have a
  standing gate/athlete of their own, or where you want the whole batch run in one shot rather than
  one per cycle.
- **Cross-item synthesis needed** (a judgment that depends on comparing all items together) → a
  purpose-built workflow script (see `workflow-authoring`), not grind — grind's items are
  independent by design.
