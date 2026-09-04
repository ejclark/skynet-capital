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
