// NOTE: .claude/workflows/** is excluded from Biome (biome.json) — workflow scripts run inside
// the Workflow tool's async harness, where top-level `await` and top-level `return` are legal.
// They are not Node modules; the linter's parser rejects the dialect, not the code.
//
// meta must be a PURE LITERAL — the Workflow registry parses it statically and silently drops a
// workflow whose meta uses `+` concatenation, template strings, comments inside the object, or any
// expression (that is how /grind became un-invokable between #1306 and the fix that added this
// note). One long single-quoted string per field, no escaped quotes inside it.
export const meta = {
  name: 'grind',
  description: 'Fan out a chain of steps across many similar targets; effort routed by step kind',
  whenToUse:
    'For a batch of near-identical, mechanical chores — the same fix/skill/command applied across many files/PRs/branches/tickers — where doing them one at a time in the main thread burns turns without needing deep judgment per item. Not for anything requiring cross-item synthesis or a design call; that wants a purpose-built pipeline instead.\n\nArgs: {items: [...], effort?, model?, isolation?, promptTemplate?, steps?}. Provide exactly one of promptTemplate or steps. Generate the call from a chore file with `node scripts/grind-manifest.mjs --args --items <json> docs/grind/<chore>.instructions.md` rather than hand-writing it (docs/grind/README.md).\n\n- promptTemplate: "...{item}..." — single-stage mode: one agent call per item (unchanged from before).\n- steps: [{kind, ...}] — multi-stage mode: each item runs the SAME step chain in order via pipeline() (item A can be on step 3 while item B is still on step 1). Once a step reports status "blocked" or "skipped", later steps for that item pass through unchanged rather than running. Step kinds:\n  - {kind:"prompt", template} — free-text instruction, same {item} substitution as promptTemplate.\n  - {kind:"instructions", path, extra?} — points at a checked-in *.instructions.md file (see docs/grind/README.md); the agent reads it and carries it out against the item. Write the chore once, reuse the file across every grind run instead of re-pasting a template.\n  - {kind:"skill", name, args?} — the agent invokes an existing repo skill (its .claude/skills/<name>/SKILL.md), exactly as if a user typed "/<name>", targeted at the item.\n  - {kind:"script", command} — the agent runs the exact shell command (with {item}/{prev} substituted) and reports pass/fail only — no exploration, no judgment. The cheapest, fastest, most deterministic step kind; prefer it whenever the chore reduces to a command.\n  Every step after the first receives the prior step result, structured as {status, summary, branch?} — as {prev} (the whole JSON) or {prev.<field>} (one field) — in its prompt, so steps compose (e.g. script check -> skill fix -> script re-check). A step that pushes a branch should report it in branch, so a trailing {kind:"script", command:"git ls-remote --exit-code --heads origin {prev.branch}"} verifies the push actually happened instead of trusting the self-report — a "done" with no branch on origin fails closed (docs/grind/README.md).\n\nCompute (docs/COMPUTE.md): effort defaults by STEP KIND — "script" steps run at low (a command either exits 0 or it does not; thoroughness cannot change that), every other kind at high (it reads, writes, or judges). Model defaults to sonnet (the floor for mechanical-with-verification); a chore that needs more declares it in its front matter. Per-step effort/model override both; args.effort/args.model override the defaults for the whole run. None of these are chosen for economy — token conservation is an explicit signal from Eric, never a default.',
  phases: [{ title: 'Grind' }],
}

const items = args?.items
if (!items?.length) throw new Error('grind requires args.items: a non-empty array')

const steps = args?.steps?.length
  ? args.steps
  : args?.promptTemplate
    ? [{ kind: 'prompt', template: args.promptTemplate }]
    : null
if (!steps) {
  throw new Error(
    'grind requires either args.promptTemplate (a string containing "{item}") or args.steps (a non-empty array of {kind, ...} step specs)',
  )
}

const STEP_KINDS = ['prompt', 'instructions', 'skill', 'script']
for (const step of steps) {
  if (!step || typeof step !== 'object') throw new Error('grind: each step must be an object {kind, ...}')
  if (!STEP_KINDS.includes(step.kind)) {
    throw new Error(`grind: unknown step kind "${step.kind}" (expected one of ${STEP_KINDS.join(', ')})`)
  }
  if (step.kind === 'prompt' && !step.template) throw new Error('grind: a "prompt" step requires template (a string containing "{item}")')
  if (step.kind === 'instructions' && !step.path) throw new Error('grind: an "instructions" step requires path (e.g. "docs/grind/foo.instructions.md")')
  if (step.kind === 'skill' && !step.name) throw new Error('grind: a "skill" step requires name (e.g. "decompose")')
  if (step.kind === 'script' && !step.command) throw new Error('grind: a "script" step requires command (a shell command string, "{item}"/"{prev}" substituted)')
}

// Compute routing (docs/COMPUTE.md → "Eric does not set the dial"): the tier follows the task
// class, never economy. A `script` step is the one genuinely mechanical kind — a command exits 0
// or it doesn't, and no amount of thoroughness changes that — so it runs at low. Everything else
// reads, writes, or judges, which the floor table puts at high. Model defaults to sonnet, the
// floor for mechanical-with-verification; a chore that needs more (research, adversarial review)
// declares it in its front matter and the manifest passes it through. Per-step fields override
// both; args.effort/args.model override the defaults for the whole run.
const RUN_EFFORT = args.effort
const RUN_MODEL = args.model || 'sonnet'
const effortFor = (step) => step.effort || RUN_EFFORT || (step.kind === 'script' ? 'low' : 'high')
// Isolation costs ~200-500ms + disk per agent — only pay it when items mutate shared files/branches
// in parallel (e.g. each item does its own `git checkout -B`).
const ISOLATION = args.isolation ? 'worktree' : undefined

const RESULT_SCHEMA = {
  type: 'object',
  required: ['status', 'summary'],
  properties: {
    status: { type: 'string', enum: ['done', 'blocked', 'skipped'] },
    summary: { type: 'string' },
    branch: {
      type: 'string',
      description: 'the git branch this step pushed to origin, if it pushed one — lets a later script step verify the push happened',
    },
  },
}

function labelFor(item) {
  if (typeof item === 'string') return item
  return item.label || item.id || item.sym || item.branch || item.file || item.doc || item.path || JSON.stringify(item).slice(0, 40)
}

// The names the progress view shows. A step is named after what it runs (the chore's basename,
// the skill, a script step's own label), not its kind — "1343 · research-bottleneck" reads at a
// glance; "1343:instructions" does not. The run's phase is named the same way when the chain has
// exactly one such step, which is the common grind shape.
function stepName(step) {
  if (step.label) return step.label
  if (step.kind === 'instructions') return step.path.split('/').pop().replace(/\.instructions\.md$/, '')
  if (step.kind === 'skill') return step.name
  return step.kind
}
const named = steps.filter((s) => s.kind === 'instructions' || s.kind === 'skill')
const PHASE = named.length === 1 ? stepName(named[0]) : 'Grind'

function substitute(template, item, prev) {
  const value = typeof item === 'string' ? item : JSON.stringify(item)
  let out = template.split('{item}').join(value)
  if (prev !== undefined) {
    // {prev.field} before {prev}: a missing field substitutes to '' so a command that needs it
    // (e.g. git ls-remote ... {prev.branch}) fails closed instead of running against garbage.
    out = out.replace(/\{prev\.([A-Za-z_][A-Za-z0-9_]*)\}/g, (_, key) => (prev?.[key] == null ? '' : String(prev[key])))
    out = out.split('{prev}').join(JSON.stringify(prev))
  }
  return out
}

function promptFor(step, item, prev) {
  const target = typeof item === 'string' ? item : JSON.stringify(item)
  const prevNote = prev !== undefined ? `\n\nThe previous step in this chain returned:\n${JSON.stringify(prev)}` : ''
  switch (step.kind) {
    case 'prompt':
      return substitute(step.template, item, prev)
    case 'instructions': {
      const extra = step.extra ? `\n\nAdditional guidance for this run:\n${step.extra}` : ''
      return `Read the instructions file at ${step.path} and carry it out for the target below. Follow the file's own steps and guardrails exactly; do not improvise beyond what it specifies. If you push a branch, report its exact name in the "branch" field of your result.\n\nTarget: ${target}${prevNote}${extra}`
    }
    case 'skill': {
      const argsNote = step.args ? ` with args: ${substitute(step.args, item, prev)}` : ''
      return `Invoke the "${step.name}" skill (as if a user typed /${step.name}${argsNote}) targeted at: ${target}. If you push a branch, report its exact name in the "branch" field of your result.${prevNote}`
    }
    case 'script': {
      const cmd = substitute(step.command, item, prev)
      return `Run exactly this command and nothing else — no exploration, no fixing, just execute and report:\n\n${cmd}\n\nReport status "done" if it exits 0, "blocked" if it exits non-zero (include the failing output in your summary), "skipped" only if the command is genuinely inapplicable to this target (say why). If the previous step reported a branch, carry it forward unchanged in your own "branch" field.`
    }
    default:
      throw new Error(`grind: unknown step kind "${step.kind}"`)
  }
}

function stageOpts(step, item) {
  return {
    phase: PHASE,
    label: `${labelFor(item)} · ${stepName(step)}`,
    effort: effortFor(step),
    model: step.model || RUN_MODEL,
    isolation: ISOLATION,
    schema: RESULT_SCHEMA,
  }
}

phase(PHASE)

// pipeline() gives stage 1 just (item) and every later stage (prevResult, item, index) — mirror
// that here so the chain lines up with how pipeline actually invokes each callback.
const stages = steps.map((step, i) =>
  i === 0
    ? (item) => agent(promptFor(step, item, undefined), stageOpts(step, item))
    : (prev, item) => {
        // A step already blocked/skipped stays that way — don't spend an agent running later
        // steps against a target the chain has already given up on.
        if (prev && prev.status !== 'done') return prev
        return agent(promptFor(step, item, prev), stageOpts(step, item))
      },
)

const results = await pipeline(items, ...stages)

const combined = items.map((item, i) => ({ item, result: results[i] }))
const done = combined.filter((c) => c.result?.status === 'done')
const blocked = combined.filter((c) => c.result?.status === 'blocked')
const skipped = combined.filter((c) => c.result?.status === 'skipped')
const errored = combined.filter((c) => !c.result)

log(`${PHASE}: ${done.length}/${items.length} done · ${blocked.length} blocked · ${skipped.length} skipped${errored.length ? ` · ${errored.length} errored` : ''}`)

return {
  chore: PHASE,
  total: items.length,
  done: done.length,
  blocked: blocked.map((c) => ({ item: labelFor(c.item), summary: c.result.summary })),
  results: combined.map((c) => ({ item: labelFor(c.item), ...(c.result || { status: 'errored', summary: 'agent failed after retries' }) })),
}
