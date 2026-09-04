# Grind — reusable batch-chore specs

`/grind` (`.claude/workflows/grind.js`) fans one repetitive chore out across many similar targets —
one agent per item, effort routed by step kind (`docs/COMPUTE.md`: a `script` step at `low`,
anything that reads, writes, or judges at `high`; the chore's front matter raises either) —
instead of doing them one at a time in the main thread. This directory holds the reusable `*.instructions.md` files a grind run can point at, so a
chore gets written once and reused, instead of re-pasted into `promptTemplate` every time.

Maps onto the codification ladder in [`../COACHES.md`](../COACHES.md): a one-off chore is a
`promptTemplate` string; the second time you'd paste the same string, write it down here instead.

## Two ways to call grind

**Single-stage** (unchanged, still the default for a one-off):

```json
{
  "items": ["a.ts", "b.ts"],
  "itemSource": "hand list — a one-off doc chore with no gate of its own",
  "promptTemplate": "Add a JSDoc comment to every exported function in {item}."
}
```

**Multi-stage** — each item runs the same ordered chain of steps (`args.steps`), via `pipeline()` so
items don't wait on each other's slowest step:

```json
{
  "items": ["a.ts", "b.ts"],
  "itemSource": "npx tsc --noEmit over src/**, filtered to files with errors",
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

## Interrogate before you call — `itemSource` and the two automatic steps

`grind.js` cannot ask a clarifying question mid-run (it dispatches into the background, no
filesystem access, no interactivity) — so the interrogation has to happen in the calling session,
before `Workflow(grind)` is ever invoked, and its output becomes required input to the call rather
than a checklist that is easy to skip:

**Honesty about what is actually enforced here, not just requested in prose** (a UX review of the
first version of this section caught it overclaiming): of the four things worth settling before a
call — item source, depth, width, outcome check — only **item source** is validated for content.
Depth (`effort`/`model`) was already a plain, optional arg before any of this; nothing checks it is
the right tier for the chore. Width has no arg at all — it is pure judgment. Outcome check
(`verifyBranch`) is enforceable *if you set it*, but nothing forces you to. Read the four below as
"here is what each dimension gets you," not "grind checks all four."

- **`args.itemSource`** (required, 12+ characters) — a real description of where `items` came from:
  a scan/query command, or the explicit reason none applies. The length floor exists because a
  red-team pass on the first version landed exactly the rubber-stamp attack you would expect —
  `"items"` or `"n/a"` satisfied a bare non-empty check while saying nothing. It is logged at run
  start and included in the returned result, so a bad answer is at least visible after the fact,
  not just required and then discarded.
- **An envelope check runs as step 0, on by default.** Every item goes through `node
  scripts/envelope-scan.mjs --check <path> --base origin/main` before your own steps run, closing
  what used to be a documented gap (nothing in `grind.js` filtered `items` against
  `envelope.json`). It is a `prompt` step, not `script` — `--check` always exits 0 and returns
  descriptive JSON, so the dispatched agent reads it and reports `blocked` on any `blocking: true`
  entry. For an item that is a JSON object (the `{doc, refs}` shape `fix-doc-rot` uses, for
  example) the agent is told to extract the real path field itself rather than hand the raw JSON to
  the shell — an early version substituted `{item}` straight into the command line, and a red-team
  pass showed the shell word-splitting `{"doc":"envelope.json","refs":["a"]}` into fragments that
  matched nothing, silently passing a protected-file edit. And when the item genuinely is not a
  file path (an issue number, a ticker, a PR branch), the agent reports **`done`**, never
  `skipped` — the pipeline treats any non-`done` status as "stop the chain for this item," so a
  `skipped` envelope step would silently no-op the chore itself on every non-path grind call (the
  same red-team pass caught this against `research-bottleneck`, whose items are issue numbers).
  Pass `skipEnvelopeCheck: '<reason>'` (a non-empty string, not a bare boolean) to opt out
  entirely; say why.
  **What this does not close:** the check is agent judgment (a `prompt` step), not a hard
  exit-code gate, and `envelope-scan.mjs --check` itself does exact-string glob matching with no
  path normalization — `./envelope.json` or an absolute path can slip past it exactly as they can
  slip past a hand-typed `--check` call. That fix belongs in `envelope-scan.mjs` itself, which is
  Eric's call, not grind's. **And CI is not a backstop for every grind push** — `tests/arch/
  envelope.spec.ts` only enforces on lane-prefixed branches (`feedback/`, `research/`, `design/`);
  a chore branch grind pushes under another name gets no CI-side check at all, so this step-0 check
  is the only net for those, not a second one.
- **`verifyBranch: true`** appends a trailing `{kind:"script"}` step running `git ls-remote
  --exit-code --heads origin {prev.branch}`, so a `done` with nothing pushed fails closed instead
  of being trusted — the ad-hoc equivalent of a checked-in chore's own `outcomeCheck` front matter
  (below). If your `steps` chain already ends in the identical command (a checked-in chore's own
  `outcomeCheck` already does), grind detects the duplicate and skips appending a second one,
  logging a note rather than running the check twice.
  **A real bug this caught:** `git ls-remote --exit-code --heads origin ""` — an *empty* branch
  argument — lists every head on the remote and exits 0. A prior step that forgot to report
  `branch` made this check pass vacuously, for `verifyBranch` and for every checked-in chore's own
  `outcomeCheck` alike. Grind now checks, before dispatching any step whose command or template
  references `{prev.branch}`, whether the previous step actually reported one — if not, that step
  is reported `blocked` without ever running, instead of being handed an empty string and passing.

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

- **`/bury` and `/backfill`** (`.claude/skills/bury/SKILL.md`, `.claude/skills/backfill/SKILL.md`)
  — the dead-code and spec-gap drills, fanned with `{kind: "skill"}`. They started life as two
  hand-copied chore files here; #1326 hoisted them so the `mortician`/`test-backfiller` agents and
  grind share one copy. Each skill's body carries its grind calling convention.
- [`fix-doc-rot.instructions.md`](fix-doc-rot.instructions.md) — fix one dead doc reference
  flagged by `scripts/doc-rot-scan.mjs`.
- [`triage-comment-bloat.instructions.md`](triage-comment-bloat.instructions.md) — triage one
  file's worth of narration-only comments flagged by `scripts/comment-bloat-scan.mjs`.
- [`research-bottleneck.instructions.md`](research-bottleneck.instructions.md) — for one
  `bottleneck`-labelled issue, find the superior *existing* solution, battle-test the candidates
  against primary sources and `envelope.json`, and leave a call sheet + routing label on the
  issue. The pursuit half of the capture-and-pursue lane: any session that measures a new
  constraint files it with `/issue` + `bottleneck`; a grind run over the open ones does the
  research so no one's attention (least of all Eric's) is spent re-deriving it. Research, not
  mechanics — its front matter declares `effort: high` on `model: fable` for exactly that reason.
- [`interrogate.instructions.md`](interrogate.instructions.md) — for one issue carrying a
  process/policy/design directive, steelman it, then red/blue/tiger/yellow the *mechanism* (never
  the outcome) and leave a call sheet — verbatim · amended · reject · status quo — plus a routing
  label. The fan-out half of "interrogate before you comply" (CLAUDE.md); the Orient output
  style's step 2 is the in-session listener that routes here when an objection survives.

Each of these was chosen and vetted through a research pass (red/blue/purple/tiger/yellow-teamed —
see the PR that added them) against every gate this repo currently runs; several plausible-looking
batch chores (fanning `/decompose` or `/dedupe`, renumbering forward-test IDs) were deliberately
**not** codified here because they need cross-item context a fan-out can't safely give them — see
each file's own header for why, when a reason applies.

## Calling convention: the chore declares its tier, you generate the call

`grind.js` still has no way to read an `*.instructions.md` file's contents before dispatching an
agent to it — workflow scripts have no filesystem access, and that constraint is not going away.
What changed (#1325) is who holds the tier: every checked-in chore declares it in YAML front
matter, using the **same key names as `.claude/agents/*.md` frontmatter** so a chore that later
graduates to a real subagent carries its header unchanged.

```yaml
---
name: triage-comment-bloat
description: triage one file's narration-only comments flagged by comment-bloat-scan
effort: low                  # low | medium | high | xhigh | max
isolation: worktree          # worktree | none — `none` is an explicit "this chore needs no checkout"
model: fable                 # optional; alias only, never a pinned id. Omit to take grind's default.
outcomeCheck: 'git ls-remote --exit-code --heads origin {prev.branch}'
---
```

**Generate the call instead of transcribing it.** `scripts/grind-manifest.mjs` reads the front
matter and prints the exact `args` object, tier filled in and the outcome-check step appended:

```bash
node scripts/grind-manifest.mjs --args --items '["src/a.ts","src/b.ts"]' --item-source "comment-bloat-scan.mjs" docs/grind/triage-comment-bloat.instructions.md
```

```json
{
  "items": ["src/a.ts", "src/b.ts"],
  "itemSource": "comment-bloat-scan.mjs",
  "steps": [
    { "kind": "instructions", "path": "docs/grind/triage-comment-bloat.instructions.md", "effort": "low", "isolation": true },
    { "kind": "script", "command": "git ls-remote --exit-code --heads origin {prev.branch}" }
  ]
}
```

`--item-source` is required alongside `--args` — `grind.js` refuses to run without `args.itemSource`
(see "Interrogate before you call" above), so the preflight cannot emit a call that would fail.

`npm run grind:manifest` (no flags) prints what every chore declares and **exits 1** if any of them
fails to declare `name`, `description`, `effort`, or `isolation` — blocking in CI via
`tests/arch/grind-manifest.spec.ts`. So the tier can no longer go undeclared; what is still on the
caller is running the preflight rather than hand-writing the args.

**Not yet done — grind does not read the manifest at dispatch.** The next slice teaches `grind.js`
to fetch each chore's manifest through one cheap subagent before the pipeline and resolve
`explicit step field › explicit call arg › the file › the cheap default`, failing closed rather
than falling back to cheap. Until that lands, a caller who skips the preflight and hand-writes args
can still under-tier a run — the front matter and the gate remove the *ambiguity*, not the last of
the manual step.

**What front matter deliberately does NOT carry:** per-run grouping rules (per-doc, per-file,
in waves), because `grind.js` could not enforce them anyway. Those stay prose in each chore's own
"Calling convention" note — read it before invoking.

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

### Two hazards the first real run hit (2026-09-04)

- **Worktrees are cut from the calling session's HEAD, not from `origin/main`.** An agent reads
  the chore file from that worktree *before* its own step 1 fetches `origin/main`, so a session
  whose checkout is behind dispatches agents against a stale chore. The first `fix-doc-rot` run
  did exactly that: the `docs/IDEAS.md` item read the pre-#1323 two-case file and `blocked` on
  reasoning the third case ("an idea, not a citation") had already codified. Sync first —
  `git fetch origin main && git rebase origin/main` (or `checkout -B … origin/main`) — then launch.
- **Inside a worktree, local `main` is stale — only `origin/main` is ever fetched.** One agent
  ran `git checkout main -- .`, staged ~100 files from a far-behind local `main`, and reverted
  before anything was committed or pushed; the outcome check would have caught a push, but the
  cheaper fix is upstream. Every chore's step 1 says `origin/main`; a chore that says bare `main`
  anywhere is a bug in the chore.

**A third, from the interrogate chore's first run (2026-09-04):** an `outcomeCheck` of the shape
`curl … | grep -q <word>` fails closed for two wrong reasons. `grep -q` exits at its first match
and closes the pipe, so `curl` dies with exit 23 ("failure writing output") under `pipefail` —
the check reports "blocked" on a comment that exists. And a prose word as the marker (`grep -q
interrogation`) matches any comment that mentions the chore. Both checked-in research chores now
use `test "$(curl -sSf … | grep -c -- "!-- <marker> --")" -gt 0`: `grep -c` reads the whole
stream, `-f` fails on an HTTP error instead of grepping an error page, and the marker is the
comment's literal first line as the API returns it (`<` arrives as `\u003c`, so match from `!--`).

## If `Workflow({name: "grind"})` says "not found"

The Workflow tool's name registry is built **once per session, lazily, at the first `Workflow`
call**, and then frozen — it does not re-read `.claude/workflows/` afterward (verified 2026-09-04
by dropping a fresh-named copy of a known-good script into the directory mid-session: it never
appeared). Two consequences:

- A script whose `export const meta` isn't a **pure literal** (no `+`, template strings,
  identifiers, calls, or spreads — the harness's own contract) is dropped from the registry
  silently, with no error anywhere. That is how `/grind` shipped documented, routed from CLAUDE.md,
  and un-invokable by name between #1306 and the fix. `npm run workflow:meta`
  (`scripts/workflow-meta-scan.mjs`, blocking in `tests/arch/workflow-meta.spec.ts`) now refuses
  that shape at CI.
- Within the session that first built the registry, fixing the file changes nothing. Invoke by
  path instead — `Workflow({scriptPath: "/home/user/skynet-capital/.claude/workflows/grind.js",
  args: {...}})` — which reads the file fresh and, if the script is malformed, reports the real
  error instead of "not found". The name works again in the next session.

## Known limitations

- **`envelope.json` enforcement is now built in, and still imperfect.** `grind.js` prepends an
  envelope-check step to every chain by default, closing the gap this bullet used to describe — see
  "Interrogate before you call" above for the full account, including what it does NOT close
  (agent judgment rather than a hard gate, no path normalization, and CI is not a backstop for a
  grind push on a non-lane-prefixed branch). The follow-up this bullet originally deferred to (a
  `--envelope` flag in `grind-manifest.mjs` that structurally drops protected items before dispatch)
  never landed, and does not need to: the blocker was that only some item shapes are file paths —
  issue numbers and `{doc, refs}` objects need their own mapping. Routing the check through a
  `prompt` step sidesteps that by having the dispatched agent extract the real path itself instead
  of grind.js needing to know every item shape in advance.
- **An agent's loop is reachable only if it lives in a skill — and only an interactive session
  can put it there.** `skill` steps reach `.claude/skills/*/SKILL.md`; the athletes that already
  kept their procedure in a skill (`decomposer` → `/decompose`, `ui-librarian` → `/dedupe`) were
  always fannable. `mortician` and `test-backfiller` weren't, so #1315 hand-copied their loops into
  two chore files, which diverged within a day with nothing watching. #1326 fixed that the way the
  ladder says: the loops moved into `/bury` and `/backfill`, the agents preload and follow them,
  the copies are gone. The reason it took a human-driven session: `.claude/` is a Claude Code
  **protected directory** — writes there are never auto-approved outside `bypassPermissions`, and
  `permissions.allow` rules don't override that — so Moneypenny's unattended lane cannot create or
  edit a skill or agent at all, and `envelope-scan --check` (which lists only `.claude/settings.json`)
  will tell you the path is open. Any future issue whose build is a skill or agent contract
  dead-ends the feedback lane the same way; route it to an interactive session. **`grind.js`
  itself is inside that protected directory** — measured 2026-09-04 on issue #1352, whose build
  was an edit to `.claude/workflows/grind.js`: `envelope-scan --check` returned `protected: false`
  and the write was refused anyway, one turn later. So a feedback-lane session can *call* grind but
  can never *change* it; file the change as its own issue and let an interactive session apply it.
  (The earlier "never hand-pick" objection recorded here was wrong: a gate's item list *is* the
  gate picking.)
  What is still missing: `scripts/grind-manifest.mjs` reads `*.instructions.md` front matter only,
  so a skill's calling convention is hand-written in its body until #1325's remaining half.

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
