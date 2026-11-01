// NOTE: .claude/workflows/** is excluded from Biome (biome.json) — workflow scripts run inside the
// Workflow tool's async harness, where top-level `await` and top-level `return` are legal. meta must
// be a PURE LITERAL (scripts/workflow-meta-scan.mjs, blocking) — see the NOTE atop grind.js.
//
// INTENT REPLAY — does the page on how Eric writes make a session read him better?
//
// Each arm answers docs/evals/how-he-writes-set.json N times, the arms in opposite orders, reading only
// what `scripts/intent-replay.mjs prompt` prints: the same words, plus the page for one arm. Then one
// judge reads every answer with no label on it, in an order that turns with the case, so it cannot learn
// which slot read the page. That script holds the prompts and the scoring so a spec can pin them with no
// model; this file cannot read a file, so a worker runs each command.
//
// Writes nothing but its return value: no scratch folder, no comment, no label. Save the return value
// as JSON and run `node scripts/intent-replay.mjs score --results <file>`. A run or a judge that died
// comes back empty, which the score reads as unknown, never as a low score.
//
// PRICE: N×2 answerers, one judge and two lookups, each near a 30k start (docs/COMPUTE.md's figure for
// a worker); what each reads on top is small, since an answerer opens no file. Answerers run at opus/
// medium and the judge at opus/high because the 2026-11-01 baseline did, and a score only compares
// against a baseline run at the same tier. The set's header says how a score could flatter the page.
export const meta = {
  name: 'intent-replay',
  description: 'Replay real messages of Eric\'s with and without the page on how he writes, have one judge read the answers unlabelled, and return them for scripts/intent-replay.mjs to score',
  whenToUse: 'When the how-he-writes page in docs/READERS.md changes, when docs/evals/how-he-writes-set.json gains cases, or at its dated check in docs/process/LEARNING-LOOP.md. Args: {n?: 1-5 passes per arm, default 2; force?: true}. At the default, 7 agents near a 30k start each. Read-only. force: true is only for a run Eric typed. Save the return value and run node scripts/intent-replay.mjs score --results <file>.',
  phases: [
    { title: 'Gate', detail: 'ask the work spigot, then list the cases and the price' },
    { title: 'Answer', detail: 'N passes without the page and N with it, in opposite orders' },
    { title: 'Judge', detail: 'one judge, every answer unlabelled, its order turning with the case' },
  ],
}

const MAX_PASSES = 5
const n = args?.n ?? 2
// It goes into a command a worker runs, so it must be what it claims to be.
if (!Number.isInteger(n) || n < 1 || n > MAX_PASSES) throw new Error(`intent-replay: args.n must be a whole number from 1 to ${MAX_PASSES}`)

// THE WORK-MODE GATE: the same block as clear-path-flip and its siblings, because a workflow script
// cannot import; tests/scripts/workflow-gate.spec.ts runs this one too. The width is known from n.
const GATE_SCHEMA = {
  type: 'object',
  required: ['found'],
  properties: {
    found: { type: 'boolean', description: 'true only if you read a real verdict back from the command' },
    dispatch: { type: 'boolean', description: 'the verdict JSON "dispatch" field, verbatim' },
    position: { type: 'string', description: 'the verdict JSON "position" field (halt/conserve/normal/surge)' },
    grindWidth: { type: 'number', description: 'the verdict JSON caps.grindWidth field, verbatim' },
    until: { type: 'string', description: 'the verdict JSON "until" field, only when it is not null' },
    reason: { type: 'string', description: 'the verdict JSON "reason" field, verbatim' },
  },
}
const WIDTH = n * 2 + 1
const PRICE = `${WIDTH + 2} agents, near a 30k start each: ${n * 2} answerers and 1 judge on opus, plus 2 lookups.`
const gate = await agent(
  'Run exactly: node scripts/moneypenny/work-gate.mjs\n\nIt prints one JSON object on stdout and status lines on stderr. Its exit code is part of the answer, not a failure: 0 means cleared to dispatch, 3 means refused (work-mode is halt, or the spend breaker is tripped) — BOTH are a real verdict and both print the JSON. Report "found": true plus that JSON object: the "dispatch", "position" and "reason" fields and caps.grindWidth, all verbatim, plus "until" only when it is not null.\n\nIf the command exits 1, prints no parseable JSON, or the object carries no caps.grindWidth, report "found": false and nothing else — never guess a position or a width. Do nothing else: no exploration, no fixing, no editing any file.',
  { schema: GATE_SCHEMA, agentType: 'worker', model: 'sonnet', effort: 'low', label: 'work-mode', phase: 'Gate' },
).catch(() => null) // A read that throws is an unread dial: refused below, or forced past.
const dialRead = gate?.found === true && typeof gate.dispatch === 'boolean' && Number.isInteger(gate.grindWidth)
const refusal = !dialRead
  ? 'could not read the dial through `node scripts/moneypenny/work-gate.mjs`; exit 1 there means a malformed control to fix, not route around'
  : !gate.dispatch
    ? gate.reason || `work-mode=${gate.position}`
    : WIDTH > gate.grindWidth
      ? `${WIDTH} agents is over the ${gate.grindWidth} that work-mode=${gate.position} allows${gate.until ? ` (until ${gate.until})` : ''}: re-run with at most ${gate.grindWidth} agents (args.n passes make 2n + 1), or flip the dial`
      : null
const FORCED = args?.force === true
if (FORCED) {
  log(`force: true${refusal ? `, past this: ${refusal}` : ', though the dial allowed it'}. Price: ${PRICE}`)
} else if (refusal) {
  throw new Error(`intent-replay: refused — ${refusal}. Nothing dispatched. If Eric typed this run himself, re-run it with force: true.`)
} else {
  log(`work-mode=${gate.position}${gate.until ? ` (until ${gate.until})` : ''} · width ${WIDTH}/${gate.grindWidth}`)
}

const CASES_SCHEMA = {
  type: 'object',
  required: ['found'],
  properties: {
    found: { type: 'boolean', description: 'true only if the command exited 0 and printed JSON' },
    why: { type: 'string', description: 'the command\'s stderr, verbatim, when found is false' },
    ids: { type: 'array', items: { type: 'string' } },
    runs: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'arm', 'order'],
        properties: {
          name: { type: 'string' },
          arm: { type: 'string', enum: ['with', 'without'] },
          order: { type: 'string', enum: ['forward', 'backward'] },
        },
      },
    },
    price: {
      type: 'object',
      properties: {
        answerers: { type: 'number' },
        judges: { type: 'number' },
        lookups: { type: 'number' },
        agents: { type: 'number' },
        startTokens: { type: 'number' },
      },
    },
  },
}
const cases = await agent(
  `Run exactly: node scripts/intent-replay.mjs cases --n ${n}\n\nOn exit 0 it prints one JSON object. Report "found": true plus its "ids", "runs" and "price" fields, verbatim and in the same order. On any other exit report "found": false and its stderr as "why". Do nothing else: no exploration, no fixing, no editing any file, and do not open the set it reads: it holds the answers.`,
  { schema: CASES_SCHEMA, agentType: 'worker', model: 'sonnet', effort: 'low', label: 'cases', phase: 'Gate' },
)
// A lookup that died is one lost read, not a broken run: nothing was answered, and the return says so.
if (cases == null) {
  log('the cases lookup did not return; nothing run')
  return { caseIds: [], runs: [], verdicts: [], price: null, notRun: 'the cases lookup did not return: re-run' }
}
if (!cases.found || !Array.isArray(cases.ids) || !Array.isArray(cases.runs)) throw new Error(`intent-replay: could not list the cases: ${cases.why ?? 'no cases in the answer'}`)
log(`${cases.ids.length} cases · ${cases.runs.length} answerers + 1 judge + 2 lookups, about ${cases.price?.startTokens ?? 'unknown'} tokens to start them`)

const ANSWER_SCHEMA = {
  type: 'object',
  required: ['ran', 'answers'],
  properties: {
    ran: { type: 'boolean', description: 'true only if the command exited 0 and you did the task it printed' },
    answers: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'route', 'ask', 'firstMove'],
        properties: {
          id: { type: 'string' },
          route: { type: 'string', enum: ['act-now', 'park', 'fan-out', 'declare', 'profile-note', 'question', 'decision', 'status-check', 'correction'] },
          ask: { type: 'string', enum: ['must-not-ask', 'may-ask', 'should-ask'] },
          firstMove: { type: 'string', description: 'one line: the first thing you would do or write' },
        },
      },
    },
  },
}
const answered = await parallel(
  cases.runs.map((run) => () =>
    agent(
      `Run exactly: node scripts/intent-replay.mjs prompt --arm ${run.arm} --order ${run.order}\n\nWhat it prints is your whole task. Do it, and return its answers in the schema you were given, with "ran": true. Stay in your turn until this is done. If the command exits non-zero, return "ran": false and no answers: never answer without what it prints.`,
      { schema: ANSWER_SCHEMA, agentType: 'worker', model: 'opus', effort: 'medium', label: `answer ${run.name}`, phase: 'Answer' },
    ),
  ),
)
const runs = cases.runs.map((run, i) => ({
  ...run,
  // An answerer that could not read its task must not score: its arm reads as unknown.
  answers: answered[i]?.ran === true ? (answered[i].answers ?? []) : null,
}))

// The judge sees every answer to a case with no label on it, and which run fills slot 0 moves on by one
// with each case, so a slot never stands for a run. scripts/intent-replay.mjs runOfSlot holds the same
// sum to undo it, and a spec round-trips the two.
const blinded = cases.ids.map((id, caseIndex) => ({
  id,
  answers: runs.map((_, slot) => ({
    slot,
    firstMove: runs[(slot + caseIndex) % runs.length].answers?.find((a) => a.id === id)?.firstMove ?? '(no answer)',
  })),
}))
const VERDICT_SCHEMA = {
  type: 'object',
  required: ['ran', 'verdicts'],
  properties: {
    ran: { type: 'boolean', description: 'true only if the command exited 0 and you did the task it printed' },
    verdicts: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'slot', 'pass', 'why'],
        properties: {
          id: { type: 'string' },
          slot: { type: 'number' },
          pass: { type: 'boolean' },
          why: { type: 'string' },
        },
      },
    },
  },
}
const judged = await agent(
  `Run exactly: node scripts/intent-replay.mjs prompt --judge\n\nWhat it prints is your task: the rule, and what each case must and must not do. Return one verdict for every slot of every case below, with "ran": true. Stay in your turn until this is done. If the command exits non-zero, return "ran": false and no verdicts: never judge without what it prints. These are the answers, each case with its slots, after the marker:\n<<<answers>>>${JSON.stringify(blinded)}`,
  { schema: VERDICT_SCHEMA, agentType: 'worker', model: 'opus', effort: 'high', label: 'blind judge', phase: 'Judge' },
).catch(() => null) // The answers are already paid for: a judge that dies must not lose them.
const verdicts = judged?.ran === true ? (judged.verdicts ?? []) : []
log(`${runs.filter((r) => r.answers).length} of ${runs.length} answerers returned · ${verdicts.length} verdicts, unscored`)
return { caseIds: cases.ids, runs, verdicts, price: cases.price }
