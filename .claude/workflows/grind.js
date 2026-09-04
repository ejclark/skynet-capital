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
  description: 'Fan out a chain of steps across many similar targets, cheap model/effort by default',
  whenToUse:
    'For a batch of near-identical, mechanical chores — the same fix/skill/command applied across many files/PRs/branches/tickers — where doing them one at a time in the main thread burns turns without needing deep judgment per item. Not for anything requiring cross-item synthesis or a design call; that wants a purpose-built pipeline instead.\n\nBefore calling, settle four things in your own reasoning: item source (a live scan or query the items came from — a hand-picked list is a smell unless the chore genuinely has no gate of its own), depth (the effort/model tier, and why this chore is mechanical rather than judgment-heavy), width (any scope carve-out beyond the automatic envelope check below), and the outcome check (pass verifyBranch:true whenever a step pushes a branch, so completion is verified against origin instead of trusted from a self-report). Name the item source as args.itemSource — a short string; it is required and shows up in the run for whoever reads it later.\n\nArgs: {items: [...], itemSource, effort?, model?, isolation?, verifyBranch?, skipEnvelopeCheck?, promptTemplate?, steps?}. Provide exactly one of promptTemplate or steps.\n\n- itemSource: a short string naming where items came from (a scan command, a query, or the reason none applies). Required.\n- verifyBranch: true appends a trailing {kind:"script"} step that runs "git ls-remote --exit-code --heads origin {prev.branch}" after your own steps, so a "done" with nothing pushed to origin fails closed instead of being trusted.\n- skipEnvelopeCheck: true skips the automatic envelope.json check normally prepended as step 0 (default on) — set it only when items are not file paths (issue numbers, tickers, PR branches) and say why in itemSource.\n- promptTemplate: "...{item}..." — single-stage mode: one agent call per item (unchanged from before).\n- steps: [{kind, ...}] — multi-stage mode: each item runs the SAME step chain in order via pipeline() (item A can be on step 3 while item B is still on step 1). Once a step reports status "blocked" or "skipped", later steps for that item pass through unchanged rather than running. A step 0 envelope check runs first automatically (see skipEnvelopeCheck above), then your steps, then an optional verifyBranch check last. Step kinds:\n  - {kind:"prompt", template} — free-text instruction, same {item} substitution as promptTemplate.\n  - {kind:"instructions", path, extra?} — points at a checked-in *.instructions.md file (see docs/grind/README.md); the agent reads it and carries it out against the item. Write the chore once, reuse the file across every grind run instead of re-pasting a template.\n  - {kind:"skill", name, args?} — the agent invokes an existing repo skill (its .claude/skills/<name>/SKILL.md), exactly as if a user typed "/<name>", targeted at the item.\n  - {kind:"script", command} — the agent runs the exact shell command (with {item}/{prev} substituted) and reports pass/fail only — no exploration, no judgment. The cheapest, fastest, most deterministic step kind; prefer it whenever the chore reduces to a command.\n  Every step after the first receives the prior step result, structured as {status, summary, branch?} — as {prev} (the whole JSON) or {prev.<field>} (one field) — in its prompt, so steps compose (e.g. script check -> skill fix -> script re-check). Per-step overrides: effort/model.',
  phases: [{ title: 'Grind' }],
}

const items = args?.items
if (!items?.length) throw new Error('grind requires args.items: a non-empty array')

const itemSource = args?.itemSource
if (!itemSource || typeof itemSource !== 'string' || !itemSource.trim()) {
  throw new Error(
    'grind requires args.itemSource: a short string naming where items came from (a scan/query command, or the reason none applies) — see meta.whenToUse',
  )
}

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

// Envelope check runs as step 0 by default — the "Known limitations" gap docs/grind/README.md used
// to document (nothing filtered items against envelope.json before dispatch). It is a "prompt" step,
// not "script", because --check always exits 0 and returns descriptive JSON for the agent to read;
// a plain exit-code step cannot express that. skipEnvelopeCheck opts out for non-path items.
const ENVELOPE_STEP = {
  kind: 'prompt',
  label: 'envelope-check',
  template:
    'Run exactly this command: node scripts/envelope-scan.mjs --check {item} --base origin/main\n\nParse its JSON output. If any entry has "blocking": true, report status "blocked" and put the matching rule/reason in your summary — do not proceed past this step. If {item} is not a file path (for example a GitHub issue number, PR branch name, or ticker symbol) and the command errors or plainly does not apply, report status "skipped" and say why in one line. Otherwise report status "done". Do nothing else — no exploration, no fixing.',
}

// Mirrors docs/grind/README.md's "Verify the outcome mechanically" trailing step, opt-in via
// verifyBranch so callers whose chain never pushes a branch are not forced to carry a step that
// always fails.
const VERIFY_BRANCH_STEP = {
  kind: 'script',
  label: 'verify-branch',
  command: 'git ls-remote --exit-code --heads origin {prev.branch}',
}

const finalSteps = [
  ...(args?.skipEnvelopeCheck ? [] : [ENVELOPE_STEP]),
  ...steps,
  ...(args?.verifyBranch ? [VERIFY_BRANCH_STEP] : []),
]

// Defaults are deliberately cheap: this workflow exists to burn through repetitive, low-judgment
// work fast, not to replicate Ultracode's xhigh bump. Override per call (or per step) when a batch
// is subtler.
const EFFORT = args.effort || 'low'
const MODEL = args.model || 'sonnet'
// Isolation costs ~200-500ms + disk per agent — only pay it when items mutate shared files/branches
// in parallel (e.g. each item is a PR branch getting merge-conflict resolution).
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
    phase: 'Grind',
    label: `${labelFor(item)}:${step.label || step.kind}`,
    effort: step.effort || EFFORT,
    model: step.model || MODEL,
    isolation: ISOLATION,
    schema: RESULT_SCHEMA,
  }
}

// pipeline() gives stage 1 just (item) and every later stage (prevResult, item, index) — mirror
// that here so the chain lines up with how pipeline actually invokes each callback.
const stages = finalSteps.map((step, i) =>
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

log(`${done.length}/${items.length} done · ${blocked.length} blocked · ${skipped.length} skipped${errored.length ? ` · ${errored.length} errored` : ''}`)

return {
  total: items.length,
  done: done.length,
  blocked: blocked.map((c) => ({ item: labelFor(c.item), summary: c.result.summary })),
  results: combined.map((c) => ({ item: labelFor(c.item), ...(c.result || { status: 'errored', summary: 'agent failed after retries' }) })),
}
