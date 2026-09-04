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
  description: 'grind — one chore, many items',
  whenToUse:
    'For a batch of near-identical, mechanical chores — the same fix/skill/command applied across many files/PRs/branches/tickers — where doing them one at a time in the main thread burns turns without needing deep judgment per item. Not for anything requiring cross-item synthesis or a design call; that wants a purpose-built pipeline instead.\n\nBefore constructing args: args.itemSource is REQUIRED — a real description (12+ characters) of where items came from, never a placeholder like "items" or "n/a"; the call throws otherwise. Say whether it is a live scan/query or a hand-picked list, and why. This is the one part of a pre-flight this workflow can actually enforce — depth (effort/model, see Compute below) and the outcome check (verifyBranch, also below) are yours to set correctly, not validated for quality; width (scope beyond the automatic envelope check) is your judgment call with no matching arg at all.\n\nArgs: {items: [...], itemSource, chore?, labels?, effort?, model?, isolation?, verifyBranch?, skipEnvelopeCheck?, promptTemplate?, steps?}. chore names the phase (the TOC header in the panel) when the chain has no instructions/skill step to name it. Provide exactly one of promptTemplate or steps. Generate the call from a chore file with `node scripts/grind-manifest.mjs --args --items <json> --item-source <string> docs/grind/<chore>.instructions.md` rather than hand-writing it (docs/grind/README.md).\n\n- itemSource: required, 12+ characters, a real description of where items came from (a scan command, a query, or the explicit reason none applies) — not a rubber-stamp word. Logged at run start and included in the returned result.\n- verifyBranch: true appends a trailing {kind:"script"} step that runs "git ls-remote --exit-code --heads origin {prev.branch}" after your own steps, so a "done" with nothing pushed to origin fails closed instead of being trusted. Skipped automatically, with a log line, if your own steps already end in the identical command (a checked-in chore already covers this via its own outcomeCheck front matter).\n- skipEnvelopeCheck: a non-empty string naming why items are not file paths (issue numbers, tickers, PR branches) — skips the automatic envelope.json check normally prepended as step 0 (default on). A bare boolean is rejected; state the reason.\n- promptTemplate: "...{item}..." — single-stage mode: one agent call per item (unchanged from before).\n- steps: [{kind, ...}] — multi-stage mode: each item runs the SAME step chain in order via pipeline() (item A can be on step 3 while item B is still on step 1). Once a step reports status "blocked" or "skipped", later steps for that item pass through unchanged rather than running. A step 0 envelope check runs first automatically (see skipEnvelopeCheck above; it reports "done" rather than "skipped" for an item with no path, so it never stalls the rest of the chain), then your steps, then an optional verifyBranch check last. Any step that checks {prev.branch} against a prior result reporting no branch is blocked before dispatch rather than run — an empty-string branch argument would otherwise exit 0 and pass vacuously. Step kinds:\n  - {kind:"prompt", template} — free-text instruction, same {item} substitution as promptTemplate.\n  - {kind:"instructions", path, extra?} — points at a checked-in *.instructions.md file (see docs/grind/README.md); the agent reads it and carries it out against the item. Write the chore once, reuse the file across every grind run instead of re-pasting a template.\n  - {kind:"skill", name, args?} — the agent invokes an existing repo skill (its .claude/skills/<name>/SKILL.md), exactly as if a user typed "/<name>", targeted at the item.\n  - {kind:"script", command} — the agent runs the exact shell command (with {item}/{prev} substituted) and reports pass/fail only — no exploration, no judgment. The cheapest, fastest, most deterministic step kind; prefer it whenever the chore reduces to a command.\n  Every step after the first receives the prior step result, structured as {status, summary, branch?} — as {prev} (the whole JSON) or {prev.<field>} (one field) — in its prompt, so steps compose (e.g. script check -> skill fix -> script re-check).\n\nCompute (docs/COMPUTE.md): effort defaults by STEP KIND — "script" steps run at low (a command either exits 0 or it does not; thoroughness cannot change that), every other kind at high (it reads, writes, or judges). Model defaults to sonnet (the floor for mechanical-with-verification); a chore that needs more declares it in its front matter. Per-step effort/model override both; args.effort/args.model override the defaults for the whole run. None of these are chosen for economy — token conservation is an explicit signal from Eric, never a default.\n\nWhat the run reports (#1352 — the Background-tasks panel renders names and one narrator line, nothing else): the panel is a table of contents, so every field is a terse line item. Phase = the chore name. Agent label = the item plus an optional nickname from args.labels ({"1351": "listener slice 2"} — keyed by the item string, or by item.id/label for object items), with NO step suffix on the run\'s one named step (the phase already says it) and a one-word suffix on the automatic steps (" · envelope", " · verify"). log() narrates k/N done as items finish. The run returns a ready-to-paste GFM table in its "ledger" field: print it verbatim as the completion message rather than hand-writing a status table, and paste it into the issue or PR the run served so a later session (which cannot read this session\'s run directory) can still see what happened. Agent summaries are one line (≤120 chars) plus a URL, so they fit the table they land in.',
}

const items = args?.items
if (!items?.length) throw new Error('grind requires args.items: a non-empty array')

// The 12-char floor exists to reject rubber-stamp answers ("items", "n/a", "list") that satisfy a
// bare non-empty check while carrying zero real information — a red-team pass on the first version
// of this gate landed exactly that attack.
const itemSource = args?.itemSource
if (!itemSource || typeof itemSource !== 'string' || itemSource.trim().length < 12) {
  throw new Error(
    'grind requires args.itemSource: a real description of where items came from, not a placeholder — "items"/"n/a"/"list" do not count. Good: "doc-rot-scan.mjs output" or "hand-picked, no gate exists for this one-off". See meta.whenToUse.',
  )
}

if (args?.skipEnvelopeCheck !== undefined && (typeof args.skipEnvelopeCheck !== 'string' || !args.skipEnvelopeCheck.trim())) {
  throw new Error(
    'grind: args.skipEnvelopeCheck must be a non-empty string naming why items are not file paths (or omit it entirely to run the default envelope check)',
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
//
// Two rules in the template exist because a red-team pass found real bypasses in the first version:
// (1) the agent must extract a real path from an object item itself, never hand the raw JSON to the
// shell — {"doc":"envelope.json","refs":["a"]} substituted straight into the command line and shell
// word-split into harmless-looking fragments that matched nothing. (2) a non-applicable item must
// report "done", never "skipped" — this pipeline treats any non-"done" status as "stop the chain for
// this item", so "skipped" here silently no-ops every later step (the actual chore never runs) on
// every non-path grind call, which defeats the whole point of a pre-flight check.
const ENVELOPE_STEP = {
  kind: 'prompt',
  label: 'envelope-check',
  template:
    'This item is: {item}\n\nDetermine the file path(s) this item actually touches. If {item} is a plain path string, that is the path. If it is a JSON object, extract the path-like field yourself (for example "path", "file", or "doc") — never run the raw JSON text through a shell command or treat a field:value fragment as a path.\n\nFor each path found, run: node scripts/envelope-scan.mjs --check "<path>" --base origin/main — quoting each path. Parse the JSON output. If any entry has "blocking": true, report status "blocked" and put the matching rule/reason in your summary — do not proceed past this step.\n\nIf the item has no file-path-like field at all (for example a bare GitHub issue number, a PR branch name, or a ticker symbol), the envelope check does not apply to it — report status "done" (never "skipped" — a later step in this chain still needs to run) and say in one line why no path applies. Otherwise, once every path clears, report status "done". Do nothing else — no exploration, no fixing.',
}

// Mirrors docs/grind/README.md's "Verify the outcome mechanically" trailing step, opt-in via
// verifyBranch so callers whose chain never pushes a branch are not forced to carry a step that
// always fails.
const VERIFY_BRANCH_STEP = {
  kind: 'script',
  label: 'verify-branch',
  command: 'git ls-remote --exit-code --heads origin {prev.branch}',
}

// `git ls-remote --exit-code --heads origin ""` lists every head and exits 0 — a step that checks
// {prev.branch} without a real branch to check passes vacuously. Guarded below at dispatch time
// (referencesPrevBranch), not here, so it also protects a checked-in chore's own outcomeCheck.
function referencesPrevBranch(step) {
  return (step.template || step.command || '').includes('{prev.branch}')
}

// A checked-in chore's own outcomeCheck already runs this exact command (grind-manifest.mjs); do
// not silently duplicate it just because the caller also passed verifyBranch.
const alreadyVerifiesBranch = steps.some((s) => s.kind === 'script' && s.command === VERIFY_BRANCH_STEP.command)
if (args?.verifyBranch && alreadyVerifiesBranch) {
  log('verifyBranch: true, but the chain already ends in the same branch-verification command — not appending a duplicate')
}

const finalSteps = [
  ...(args?.skipEnvelopeCheck ? [] : [ENVELOPE_STEP]),
  ...steps,
  ...(args?.verifyBranch && !alreadyVerifiesBranch ? [VERIFY_BRANCH_STEP] : []),
]

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
    summary: {
      type: 'string',
      description: 'one line, at most 120 characters, plus the URL of anything you posted or pushed — it is rendered as a table cell in the run ledger and in the Background-tasks panel',
    },
    branch: {
      type: 'string',
      description: 'the git branch this step pushed to origin, if it pushed one — lets a later script step verify the push happened',
    },
  },
}

// The run's own fridge picture (#1352). The Background-tasks panel renders names and one narrator
// line — no table, no diagram (verified against code.claude.com/docs/en/workflows and the bundled
// workflow-authoring reference; neither documents a render lever). So the picture lives in what
// this script RETURNS: a GFM table renders in every client AND survives a paste into an issue
// comment, which is the only place a later CI session can read it — the run directory under
// ~/.claude/projects/ belongs to the session that ran it and no other machine can see it.
const CELL_MAX = 140
const STATUS_MARK = { done: '✅ done', blocked: '⛔ blocked', skipped: '➖ skipped', errored: '❌ errored' }

// A summary containing a pipe or a newline would silently break the table it is rendered into —
// escape the pipe, flatten the whitespace, and mark truncation visibly rather than dropping text.
function cell(text) {
  const flat = String(text ?? '').replace(/\s+/g, ' ').replace(/\|/g, '\\|').trim()
  return flat.length > CELL_MAX ? `${flat.slice(0, CELL_MAX - 1)}…` : flat
}

function ledgerTable(heading, rows) {
  return [
    heading,
    '',
    '| Item | Step | Status | Summary |',
    '| --- | --- | --- | --- |',
    ...rows.map((r) => `| ${cell(r.item)} | ${cell(r.step || '—')} | ${STATUS_MARK[r.status] || cell(r.status)} | ${cell(r.summary)} |`),
  ].join('\n')
}

// budget is a documented global, but referencing an undeclared identifier throws rather than
// yielding undefined — hence typeof, not budget?.spent.
const HAS_BUDGET = typeof budget !== 'undefined' && typeof budget.spent === 'function'
const TOKENS_AT_START = HAS_BUDGET ? budget.spent() : null

// Naming (Eric, 2026-09-04: "think of these pieces as a line item on a table of contents"). The
// panel shows literal names in very little room, so a label is the item plus an optional nickname
// from args.labels — never a repeat of what the phase row above it already says.
const LABELS = args?.labels && typeof args.labels === 'object' ? args.labels : {}
function nicknameFor(item) {
  const key = typeof item === 'string' ? item : (item.id ?? item.label ?? item.sym ?? item.file ?? item.doc ?? item.path)
  const nick = key == null ? undefined : LABELS[String(key)]
  return nick ? String(nick).trim() : ''
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
// args.chore names the phase for a chain with no instructions/skill step (a script-only run
// would otherwise fall back to the generic "Grind" — the smoke run for #1352 showed exactly that).
const PHASE = (typeof args?.chore === 'string' && args.chore.trim()) || (named.length === 1 ? stepName(named[0]) : 'Grind')

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

// A one-word suffix for the steps that are not the run's own named step — the automatic
// envelope check and branch verify, or a script step in a multi-step chain.
function suffixFor(step) {
  if (step === ENVELOPE_STEP) return 'envelope'
  if (step === VERIFY_BRANCH_STEP) return 'verify'
  return stepName(step)
}

function stageOpts(step, item) {
  const nick = nicknameFor(item)
  const base = nick ? `${labelFor(item)} ${nick}` : labelFor(item)
  const isTheNamedStep = named.length === 1 && step === named[0]
  return {
    phase: PHASE,
    label: isTheNamedStep ? base : `${base} · ${suffixFor(step)}`,
    effort: effortFor(step),
    model: step.model || RUN_MODEL,
    isolation: ISOLATION,
    schema: RESULT_SCHEMA,
  }
}

phase(PHASE)

// B: the narrator line moves during the run. log() is the panel's one live lever, and the running
// view — not the final report — is where a watcher actually looks (Prefect's progress artifact and
// Inngest's step timeline exist for the same reason). One line per item as it finishes.
const tally = { done: 0, blocked: 0, skipped: 0, errored: 0 }
function finish(result) {
  const status = tally[result?.status] === undefined ? 'errored' : result.status
  tally[status] += 1
  const parts = [`${tally.done}/${items.length} done`, `${tally.blocked} blocked`]
  if (tally.skipped) parts.push(`${tally.skipped} skipped`)
  if (tally.errored) parts.push(`${tally.errored} errored`)
  log(`${PHASE} · ${parts.join(' · ')}`)
  return result
}

// pipeline() gives stage 1 just (item) and every later stage (prevResult, item, index) — mirror
// that here so the chain lines up with how pipeline actually invokes each callback.
const stages = finalSteps.map((step, i) => {
  const isLast = i === finalSteps.length - 1
  // Stamp which step produced this result, so the ledger can say WHERE an item stopped — pipeline()
  // returns only the last stage's value, and a blocked item's result is passed through unchanged by
  // every later stage. Never overwrite an existing stamp: that is the pass-through case.
  const tag = (result) => {
    const stamped = result && typeof result === 'object' && !result.step ? { ...result, step: suffixFor(step) } : result
    return isLast ? finish(stamped) : stamped
  }
  const run = (value) => Promise.resolve(value).then(tag)
  return i === 0
    ? (item) => run(agent(promptFor(step, item, undefined), stageOpts(step, item)))
    : (prev, item) => {
        // A step already blocked/skipped stays that way — don't spend an agent running later
        // steps against a target the chain has already given up on.
        if (prev && prev.status !== 'done') return tag(prev)
        // "git ls-remote ... origin ''" exits 0 (lists every head) — a step checking {prev.branch}
        // against a prev result with no branch would otherwise pass vacuously instead of catching
        // the "done" that pushed nothing docs/grind/README.md warns about.
        if (referencesPrevBranch(step) && !prev?.branch) {
          return tag({
            status: 'blocked',
            summary: 'this step checks {prev.branch}, but the previous step reported no branch — refusing to run a check that would otherwise pass vacuously',
          })
        }
        return run(agent(promptFor(step, item, prev), stageOpts(step, item)))
      }
})

log(`${PHASE} · 0/${items.length} done · ${itemSource}`)
const results = await pipeline(items, ...stages)

const combined = items.map((item, i) => ({ item, result: results[i] }))
const done = combined.filter((c) => c.result?.status === 'done')
const blocked = combined.filter((c) => c.result?.status === 'blocked')
const skipped = combined.filter((c) => c.result?.status === 'skipped')
const errored = combined.filter((c) => !c.result)

const tokens = TOKENS_AT_START === null ? null : Math.max(0, budget.spent() - TOKENS_AT_START)
const rows = combined.map((c) => ({
  item: nicknameFor(c.item) ? `${labelFor(c.item)} ${nicknameFor(c.item)}` : labelFor(c.item),
  step: c.result?.step,
  status: c.result?.status || 'errored',
  summary: c.result?.summary || 'agent failed after retries',
}))
const counts = [`${done.length}/${items.length} done`, `${blocked.length} blocked`]
if (skipped.length) counts.push(`${skipped.length} skipped`)
if (errored.length) counts.push(`${errored.length} errored`)
if (tokens !== null) counts.push(`${Math.round(tokens / 1000)}k output tokens`)

return {
  chore: PHASE,
  total: items.length,
  itemSource,
  done: done.length,
  tokens,
  ledger: ledgerTable(`**${PHASE}** — ${counts.join(' · ')}\n_Items from: ${itemSource}_`, rows),
  blocked: blocked.map((c) => ({ item: labelFor(c.item), summary: c.result.summary })),
  results: combined.map((c) => ({ item: labelFor(c.item), ...(c.result || { status: 'errored', summary: 'agent failed after retries' }) })),
}
