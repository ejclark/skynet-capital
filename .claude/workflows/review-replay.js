// NOTE: .claude/workflows/** is excluded from Biome (biome.json) — workflow scripts run inside the
// Workflow tool's async harness, where top-level `await` and top-level `return` are legal. meta must
// be a PURE LITERAL (scripts/workflow-meta-scan.mjs, blocking) — see the NOTE atop grind.js.
//
// REVIEW REPLAY — does this review lens find what it claims to, and only that?
//
// One reviewer per labelled PR, on the base and head shas, reading only what
// `scripts/review-replay.mjs prompt` prints. That script holds the prompt and the scoring so a spec can
// pin them with no model; this file cannot read a file, so a worker runs each command. The reviewer
// is told nothing about whether the PR has a defect, and the lens's real examples are stripped.
//
// Writes nothing but its return value: no scratch folder, no comment, no label. Save the return value
// as JSON and run `node scripts/review-replay.mjs score --results <file>`. An unreturned reviewer
// comes back as returned: false, which the score reads as unknown, never as a clean control.
//
// PRICE: one reviewer per PR plus two mechanical lookups, each near a 30k start (docs/COMPUTE.md's
// figure for a worker); what each reads on top is unmeasured. `cases` prints the sum, and this logs
// it before the first reviewer starts. Reviewers run at COMPUTE's review row, opus/high. No refuters:
// the set's howThisCouldFlatterALens says what that leaves unmeasured.
export const meta = {
  name: 'review-replay',
  description: 'Replay one review lens over the labelled PRs, one reviewer each, and return the findings for scripts/review-replay.mjs to score',
  whenToUse: 'When a review lens under docs/review/lenses needs a number before the post-merge audit may load it, or after a lens changes. Args: {lens: string, ids?: [string, ...], run?: string}. One worker per PR plus two lookups, near a 30k start each; refuses more than 40 PRs at once. Read-only. Save the return value and run node scripts/review-replay.mjs score --results <file>.',
  phases: [
    { title: 'Gate', detail: 'ask the work spigot, then list the PRs this lens runs on and their price' },
    { title: 'Review', detail: 'one worker per PR, base and head shas, the lens and none of the answer' },
  ],
}

const MAX_PRS = 40
const lens = typeof args?.lens === 'string' ? args.lens.trim() : ''
// Both go into a command a worker runs, so each must be what it claims to be.
if (!/^[a-z-]+$/.test(lens)) throw new Error('review-replay requires args.lens: a file name under docs/review/lenses, without .md')
const ids = (args?.ids ?? []).map(String)
if (!ids.every((id) => /^[A-Z]\d+$/.test(id))) throw new Error('review-replay: args.ids must be case ids from docs/review/replay-set.json, like P04')
if (ids.length > MAX_PRS) throw new Error(`review-replay: ${ids.length} ids is over the ${MAX_PRS} one run may review — run it in batches`)

// Same reason and same refusals as grind.js → THE WORK SPIGOT: this file has no gh and no network, so
// a cheap worker runs the gate's CLI. Nothing is ever silently dropped from a run.
const GATE_SCHEMA = {
  type: 'object',
  required: ['found'],
  properties: {
    found: { type: 'boolean', description: 'true only if you read a real verdict back from the command' },
    dispatch: { type: 'boolean', description: 'the verdict JSON "dispatch" field, verbatim' },
    position: { type: 'string', description: 'the verdict JSON "position" field (halt/conserve/normal/surge)' },
    grindWidth: { type: 'number', description: 'the verdict JSON caps.grindWidth field, verbatim' },
    reason: { type: 'string', description: 'the verdict JSON "reason" field, verbatim' },
  },
}
const gate = await agent(
  'Run exactly: node scripts/moneypenny/work-gate.mjs\n\nIt prints one JSON object on stdout and status lines on stderr. Exit 0 means cleared to dispatch and exit 3 means refused: both are a real verdict and both print the JSON. Report "found": true plus the "dispatch", "position" and "reason" fields and caps.grindWidth, all verbatim.\n\nIf the command exits 1, prints no parseable JSON, or the object carries no caps.grindWidth, report "found": false and nothing else. Do nothing else: no exploration, no fixing, no editing any file.',
  { schema: GATE_SCHEMA, effort: 'low', agentType: 'worker', label: 'work-mode', phase: 'Gate' },
)
if (!gate?.found || typeof gate.dispatch !== 'boolean' || !Number.isInteger(gate.grindWidth)) {
  throw new Error('review-replay: could not read the work spigot via `node scripts/moneypenny/work-gate.mjs` — refusing to dispatch a run of unknown width. See #3960.')
}
if (!gate.dispatch) throw new Error(`review-replay: refused by the work spigot — ${gate.reason || `work-mode=${gate.position}`}. Nothing dispatched.`)

const CASES_SCHEMA = {
  type: 'object',
  required: ['found'],
  properties: {
    found: { type: 'boolean', description: 'true only if the command exited 0 and printed JSON' },
    why: { type: 'string', description: 'the command\'s stderr, verbatim, when found is false' },
    inputs: {
      type: 'array',
      items: {
        type: 'object',
        required: ['pr', 'base', 'head', 'caseIds'],
        properties: {
          pr: { type: 'number' },
          base: { type: 'string' },
          head: { type: 'string' },
          caseIds: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    price: {
      type: 'object',
      properties: {
        reviewers: { type: 'number' },
        lookups: { type: 'number' },
        agents: { type: 'number' },
        startTokens: { type: 'number' },
      },
    },
  },
}
const idsFlag = ids.length ? ` --ids ${ids.join(',')}` : ''
const cases = await agent(
  `Run exactly: node scripts/review-replay.mjs cases --lens ${lens}${idsFlag}\n\nOn exit 0 it prints one JSON object. Report "found": true plus its "inputs" and "price" fields, verbatim. On any other exit report "found": false and its stderr as "why". Do nothing else: no exploration, no fixing, no editing any file.`,
  { schema: CASES_SCHEMA, effort: 'low', agentType: 'worker', label: 'cases', phase: 'Gate' },
)
if (!cases?.found || !Array.isArray(cases.inputs)) throw new Error(`review-replay: could not list the cases for ${lens}: ${cases?.why ?? 'the lookup did not return'}`)
if (cases.inputs.length > MAX_PRS) throw new Error(`review-replay: ${cases.inputs.length} PRs is over the ${MAX_PRS} one run may review — name a batch in args.ids`)
if (cases.inputs.length > gate.grindWidth) throw new Error(`review-replay: ${cases.inputs.length} PRs is over the ${gate.grindWidth} the work spigot allows at work-mode=${gate.position} — name a batch in args.ids, or flip the dial.`)
log(`${lens}: ${cases.inputs.length} reviewers + 2 lookups, about ${cases.price?.startTokens ?? 'unknown'} tokens to start them, before what each reads`)

const FINDINGS_SCHEMA = {
  type: 'object',
  required: ['ran', 'findings'],
  properties: {
    ran: { type: 'boolean', description: 'true only if the command exited 0 and you did the task it printed' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['severity', 'file', 'summary', 'failure_scenario'],
        properties: {
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          file: { type: 'string' },
          line: { type: 'number' },
          summary: { type: 'string', description: 'one sentence: the defect or the cost' },
          failure_scenario: { type: 'string', description: 'concrete input or state → wrong result or measurable cost' },
        },
      },
    },
  },
}
const reviewed = await parallel(
  cases.inputs.map((input) => () =>
    agent(
      `Run exactly: node scripts/review-replay.mjs prompt --lens ${lens} --head ${input.head}\n\nWhat it prints is your whole task. Do it, and return its findings in the schema you were given, with "ran": true. If the command exits non-zero, return "ran": false and no findings: never review without what it prints.`,
      { schema: FINDINGS_SCHEMA, agentType: 'worker', model: 'opus', effort: 'high', label: `review #${input.pr}`, phase: 'Review' },
    ),
  ),
)

const results = cases.inputs.map((input, i) => ({
  pr: input.pr,
  head: input.head,
  caseIds: input.caseIds,
  // A reviewer that could not read its task returns no findings too, and that must not score as clean.
  returned: reviewed[i]?.ran === true,
  findings: reviewed[i]?.ran === true ? (reviewed[i].findings ?? []) : [],
}))
log(`${results.filter((r) => r.returned).length} of ${results.length} reviewers returned · ${results.reduce((n, r) => n + r.findings.length, 0)} findings, unscored`)
return { lens, results, price: cases.price }
