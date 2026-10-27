// NOTE: .claude/workflows/** is excluded from Biome (biome.json) — workflow scripts run inside the
// Workflow tool's async harness, where top-level `await` and top-level `return` are legal. meta must
// be a PURE LITERAL (scripts/workflow-meta-scan.mjs, blocking) — see the NOTE atop grind.js.
//
// CLEAR-PATH FLIP — docs/ISSUES.md → "Who may flip it", run by name instead of by hand.
//
// A session may apply `ready` when the path is clear and Eric's flip would only be a rubber stamp
// (Eric, 2026-10-19). *Clear* is four written checks, and the call is *earned*: an independent
// verifier tried to refute it and could not. On 2026-10-26 a surge session ran that by hand over 21
// issues; the refuters stopped 4 bad calls (#6006, #4458, #5967, #6079) and 2 readied issues that
// lacked `feedback` sat unbuilt (fixed at the lane by #6219; the post still adds it to a non-plan
// issue so the label stays honest before the lane claims it). This file is that loop:
//
//   judge (one per issue)  → the four checks with evidence + a drafted comment
//   refute (two per positive call, independent, different lenses)
//     - envelope: derive every path the build would touch and run envelope-scan on each
//     - thread:   re-read the whole thread for forks, size, live claims and already-shipped work
//   survives only if BOTH refuters returned and NEITHER refuted.
//
// Clear is computed HERE from the four checks, never taken from the judge's own summary, and a
// refuter that died counts as a refutation — an unverified call is not an earned one.
//
// Writes nothing. The result goes to `node scripts/clear-path-post.mjs <result.json>`, which posts
// only survivors carrying two verifier lines (the write is a script so it is specced and gated on
// exit status, not on a subagent's say-so).
export const meta = {
  name: 'clear-path-flip',
  description: 'Judge issues against the four clear-path checks, refute each positive call twice, return survivors for clear-path-post.mjs',
  whenToUse: 'When a session wants to apply `ready` itself under docs/ISSUES.md → Who may flip it — a surge pass over the triage backlog, or any batch of issues whose flip would be a rubber stamp. Args: {issues: [number, ...]}. Read-only: it posts nothing. Save the returned object as JSON and run `node scripts/clear-path-post.mjs <file>` (add --dry-run first) to post the footed comment and apply ready (+ feedback when a non-plan issue lacks it) for survivors only.',
  phases: [
    { title: 'Judge', detail: 'one judge per issue records the four checks and drafts the comment' },
    { title: 'Refute', detail: 'two independent refuters per positive call: envelope paths, and the thread' },
  ],
}

const issues = (args?.issues ?? []).map(Number).filter((n) => Number.isInteger(n) && n > 0)
if (!issues.length) throw new Error('clear-path-flip requires args.issues: a non-empty array of issue numbers')
// Same sanity floor as grind.js's MAX_ITEMS spirit, sized to a triage backlog rather than a sweep.
if (issues.length > 60) throw new Error(`clear-path-flip: ${issues.length} issues is over the 60-issue cap — run it in batches`)

const READ =
  'Read the issue and EVERY comment on it over REST, e.g. `node scripts/issues.mjs show {n} --json` for the body and labels, and ' +
  '`curl -sS --fail -H "Authorization: Bearer $(gh auth token 2>/dev/null || echo $GH_TOKEN)" https://api.github.com/repos/ejclark/skynet-capital/issues/{n}/comments?per_page=100` for the thread ' +
  '(or the GitHub MCP issue_read tool if REST is refused). Also check whether a PR already references it: ' +
  '`git fetch -q origin main && git log origin/main --oneline -i --grep "#{n}\\b"` for shipped work.'

const CHECK = {
  type: 'object',
  required: ['pass', 'evidence'],
  properties: {
    pass: { type: 'boolean' },
    evidence: { type: 'string', description: 'one line: the quote, label, size or link that decides it' },
  },
}
const JUDGE_SCHEMA = {
  type: 'object',
  required: ['issue', 'title', 'state', 'labels', 'checks', 'touchedPaths', 'comment'],
  properties: {
    issue: { type: 'number' },
    title: { type: 'string' },
    state: { type: 'string', description: 'open or closed' },
    labels: { type: 'array', items: { type: 'string' } },
    checks: {
      type: 'object',
      required: ['criteria', 'size', 'noFork', 'notBlocked'],
      properties: { criteria: CHECK, size: CHECK, noFork: CHECK, notBlocked: CHECK },
    },
    touchedPaths: { type: 'array', items: { type: 'string' }, description: 'repo paths the build would create or edit' },
    comment: { type: 'string', description: 'the drafted flip comment, markdown, no verifier lines and no footer' },
  },
}
const VERDICT_SCHEMA = {
  type: 'object',
  required: ['refuted', 'line'],
  properties: {
    refuted: { type: 'boolean' },
    line: { type: 'string', description: 'ONE line for the flip comment: what you checked and what you found' },
  },
}

const judgePrompt = (n) => `You are judging whether issue #${n} in ejclark/skynet-capital has a CLEAR PATH under docs/ISSUES.md → "Who may flip it". Read that section first. Read-only: never comment, label or edit anything.

${READ.replaceAll('{n}', String(n))}

Record the four written checks, each with one line of evidence:
1. criteria — acceptance criteria are present (EARS lines, a checklist, or a "done when" that a build can be judged against). A wish with no way to tell it is done fails.
2. size — S or M, or the next slice a plan's state block already names. Say which. L/XL or "unknown" fails.
3. noFork — no open fork only Eric can settle (a taste call, a question addressed to him still unanswered, a needs-eric label), AND nothing in envelope.json's protected class: list every path the build would touch in touchedPaths and run \`node scripts/envelope-scan.mjs --check <paths>\`; any "protected": true fails.
4. notBlocked — no open blocking issue (native blocked-by, "blocked by #N" with #N open, needs-info, or an open parent whose slice comes first).

Then draft the flip comment (markdown, no footer — a script adds the verifier lines and footer). Shape:
**Clear path — session flip** (docs/ISSUES.md → Who may flip it)
| Check | Verdict | Evidence |
one row per check. If the issue lacks the \`feedback\` label and is not a \`plan\`, add a line saying \`feedback\` is applied with \`ready\` (the feedback lane builds it).

Be strict: a check you cannot evidence is a fail. Report the issue's current labels and state verbatim.`

const refutePrompt = (lens, judged) => {
  const n = judged.issue
  const common = `Another agent judged issue #${n} ("${judged.title}") in ejclark/skynet-capital to have a CLEAR PATH (docs/ISSUES.md → "Who may flip it") and wants to apply \`ready\`. Your job is to REFUTE that call. Read-only: never comment, label or edit anything. Default to refuted=true if you cannot positively confirm your lens.

Their evidence:
${JSON.stringify(judged.checks, null, 2)}
Paths they say the build touches: ${JSON.stringify(judged.touchedPaths)}

${READ.replaceAll('{n}', String(n))}
`
  if (lens === 'envelope') {
    return `${common}
YOUR LENS — the envelope. Do not trust their path list. From the issue's ask, independently derive every path the build would create or edit (follow imports one hop: a change to a helper that a workflow file or a credential path also needs counts). Run \`node scripts/envelope-scan.mjs --check <every path>\` and read each result. Refute if ANY path is protected, if their list missed a path that matters, or if the ask cannot be built without touching .github/workflows/**, credentials, spend, or anything outward-facing-and-hard-to-reverse.
Your "line" must read like: "envelope — traced N paths (a, b, c), none protected" or name the protected path.`
  }
  return `${common}
YOUR LENS — the thread. Re-read the WHOLE thread, oldest to newest, and refute if any of these hold:
- an open fork only Eric can settle (a question to him with no answer, "Eric's call", a pending taste pick, needs-eric now or removed without a recorded answer);
- the real size is larger than S/M once the thread's additions are counted;
- a live claim: in-progress label, an open PR referencing it, an assignee, or a session saying it is building it within the last 48h;
- already shipped: a merged PR or a commit on origin/main that delivers the ask (then the right move is to close it, not ready it);
- the issue is closed, or already carries \`ready\`.
Your "line" must read like: "thread — read K comments; no open fork, no live claim, not shipped" or name what you found.`
}

const results = await pipeline(
  issues,
  (n) => agent(judgePrompt(n), { label: `judge #${n}`, phase: 'Judge', schema: JUDGE_SCHEMA }),
  async (judged, n) => {
    if (!judged) return { kind: 'notClear', issue: n, failed: ['judge did not return'] }
    const failed = Object.entries(judged.checks ?? {})
      .filter(([, c]) => !c?.pass)
      .map(([k, c]) => `${k}: ${c?.evidence ?? 'no evidence'}`)
    if (judged.state !== 'open') failed.push(`state: ${judged.state}`)
    if ((judged.labels ?? []).includes('ready')) failed.push('already carries ready')
    if (failed.length) return { kind: 'notClear', issue: n, title: judged.title, failed }

    const [envelope, thread] = await parallel([
      () => agent(refutePrompt('envelope', judged), { label: `refute-envelope #${n}`, phase: 'Refute', schema: VERDICT_SCHEMA }),
      () => agent(refutePrompt('thread', judged), { label: `refute-thread #${n}`, phase: 'Refute', schema: VERDICT_SCHEMA }),
    ])
    const votes = [
      envelope ?? { refuted: true, line: 'envelope — verifier did not return' },
      thread ?? { refuted: true, line: 'thread — verifier did not return' },
    ]
    const verifiers = votes.map((v) => v.line)
    if (votes.some((v) => v.refuted)) return { kind: 'refuted', issue: n, title: judged.title, verifiers }
    return {
      kind: 'survivor',
      issue: n,
      title: judged.title,
      checks: judged.checks,
      addFeedback: !(judged.labels ?? []).some((l) => l === 'feedback' || l === 'plan'),
      comment: judged.comment,
      verifiers,
    }
  },
)

const pick = (kind) => results.filter((r) => r?.kind === kind).map(({ kind: _k, ...rest }) => rest)
const out = { survivors: pick('survivor'), refuted: pick('refuted'), notClear: pick('notClear') }
const lost = issues.length - out.survivors.length - out.refuted.length - out.notClear.length
if (lost) log(`${lost} issue(s) dropped by a failed stage — re-run them`)
log(`${out.survivors.length} survive · ${out.refuted.length} refuted · ${out.notClear.length} not clear`)
return out
