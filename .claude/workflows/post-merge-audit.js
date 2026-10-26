// NOTE: .claude/workflows/** is excluded from Biome (biome.json) — workflow scripts run inside the
// Workflow tool's async harness, where top-level `await` and top-level `return` are legal. meta must
// be a PURE LITERAL (scripts/workflow-meta-scan.mjs, blocking) — see the NOTE atop grind.js.
//
// POST-MERGE AUDIT — did what just merged break something on main?
//
// Auto-merge means a PR's correctness review happens after it lands (CLAUDE.md → Merge posture). On
// 2026-10-26 a surge session shipped 11 builds and audited them by hand: one reviewer per PR, then
// two refuters per serious finding. This file is that loop, run by name:
//
//   review (one per PR)   → correctness-only findings, judged against CURRENT main, not the PR's
//                           base — a later merge may already have fixed it, or made it worse
//   refute (two per high/medium finding, independent, different lenses)
//     - trace:     walk a real caller or input to the failure in today's code
//     - reproduce: write a throwaway spec that fails on main because of it (isolated worktree)
//   confirmed only if BOTH refuters returned and NEITHER refuted. A refuter that died counts as a
//   refutation: a finding nobody could stand behind is not a confirmed one.
//
// Correctness only, never "find gaps" — a reviewer told to find gaps manufactures them (Orient).
// Low findings are returned unverified and labelled so, never silently dropped. Writes nothing to
// GitHub; the session files confirmed findings as `bug` + `fast-track` (CLAUDE.md → A bug found
// mid-build is the next pull).
export const meta = {
  name: 'post-merge-audit',
  description: 'Correctness-review merged PRs against current main, refute each high/medium finding twice, return the confirmed findings',
  whenToUse: 'After a batch of PRs auto-merged (a surge wave, a governor cycle, a burn-down) and nobody read them for correctness first. Args: {prs: [number, ...]}. Read-only on GitHub; the reproduce refuter writes a throwaway spec in an isolated worktree. Returns {confirmed, refuted, low, unreviewed}; file each confirmed finding as a bug + fast-track issue.',
  phases: [
    { title: 'Review', detail: 'one correctness-only reviewer per merged PR, judged against current main' },
    { title: 'Refute', detail: 'two independent refuters per high/medium finding: trace the path, reproduce in a temp spec' },
  ],
}

const prs = (args?.prs ?? []).map(Number).filter((n) => Number.isInteger(n) && n > 0)
if (!prs.length) throw new Error('post-merge-audit requires args.prs: a non-empty array of merged PR numbers')
if (prs.length > 40) throw new Error(`post-merge-audit: ${prs.length} PRs is over the 40-PR cap — run it in batches`)

const FIND = (n) =>
  `Find PR #${n}'s change: \`git fetch -q origin main\`, then \`git log origin/main --oneline --grep "(#${n})"\` (squash merges carry "(#${n})" in the subject) and \`git show <sha>\`. ` +
  `If no commit matches, read it over REST: \`curl -sS --fail -H "Authorization: Bearer $(gh auth token 2>/dev/null || echo $GH_TOKEN)" https://api.github.com/repos/ejclark/skynet-capital/pulls/${n}\` (and /files), or the GitHub MCP pull_request_read tool.`

const FINDINGS_SCHEMA = {
  type: 'object',
  required: ['merged', 'findings'],
  properties: {
    merged: { type: 'boolean', description: 'true only if you found the change on origin/main' },
    sha: { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['severity', 'file', 'summary', 'failure_scenario'],
        properties: {
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          file: { type: 'string' },
          line: { type: 'number' },
          summary: { type: 'string', description: 'one sentence: the defect' },
          failure_scenario: { type: 'string', description: 'concrete input/state → wrong output or crash' },
        },
      },
    },
  },
}
const VERDICT_SCHEMA = {
  type: 'object',
  required: ['refuted', 'evidence'],
  properties: {
    refuted: { type: 'boolean' },
    evidence: { type: 'string', description: 'the trace, or the spec you ran and its output, in a few lines' },
  },
}

const reviewPrompt = (n) => `Review merged PR #${n} in ejclark/skynet-capital for CORRECTNESS ONLY: wrong results, crashes, broken contracts, regressions, a requirement in its linked issue the code does not meet. Not style, naming, structure, test coverage or debt — the fitness gates own those.

${FIND(n)}

Judge every finding against the code as it is on origin/main NOW (read the current files, not just the diff): a later merge may already have fixed it, or the PR may have broken a caller it never touched. Report a finding only when you can name a concrete failure scenario. Severity: high = wrong money/P&L/state, data loss, crash on a common path, a broken gate or lane; medium = wrong on a real but narrower path; low = edge cases you are unsure anyone hits. Zero findings is a normal answer.`

const tracePrompt = (n, f) => `A reviewer claims merged PR #${n} in ejclark/skynet-capital introduced this ${f.severity} defect. Try to REFUTE it. Read-only.

${f.file}${f.line ? `:${f.line}` : ''} — ${f.summary}
Failure scenario: ${f.failure_scenario}

${FIND(n)}

YOUR LENS — trace. On origin/main as it is now, walk from a real caller or real input (an entrypoint, a route, a scheduled job, a CLI) to the claimed failure. Refute if no real path reaches it, if a guard upstream prevents it, if current main already fixed it, or if the behaviour is intended and documented. Default to refuted=true if you cannot complete the trace. Evidence: the call chain with file:line hops.`

const reproPrompt = (n, f) => `A reviewer claims merged PR #${n} in ejclark/skynet-capital introduced this ${f.severity} defect. Try to REFUTE it by attempting to reproduce it.

${f.file}${f.line ? `:${f.line}` : ''} — ${f.summary}
Failure scenario: ${f.failure_scenario}

YOUR LENS — reproduce. You are in an isolated worktree. \`git fetch -q origin main && git checkout -q origin/main\`. Write ONE throwaway spec next to the nearest existing spec for that file (tests/**/*.spec.ts for root code, app/ for the app), asserting the CORRECT behaviour on the scenario above, and run only it (\`npx rstest run <path>\`, or \`npm test --prefix app -- <path>\` for app/). If it fails for the claimed reason, the defect reproduces: refuted=false. If it passes, or you cannot build a repro that exercises the claim, refuted=true. Delete the spec afterwards and never commit or push. Evidence: the assertion and the run's verdict line.`

const results = await pipeline(
  prs,
  (n) => agent(reviewPrompt(n), { label: `review #${n}`, phase: 'Review', schema: FINDINGS_SCHEMA }),
  async (review, n) => {
    if (!review?.merged) return { pr: n, unreviewed: review ? 'not found on origin/main' : 'reviewer did not return' }
    const serious = review.findings.filter((f) => f.severity !== 'low')
    const low = review.findings.filter((f) => f.severity === 'low').map((f) => ({ pr: n, ...f }))
    const judged = await parallel(
      serious.map((f, i) => async () => {
        const [trace, repro] = await parallel([
          () => agent(tracePrompt(n, f), { label: `trace #${n}.${i + 1}`, phase: 'Refute', schema: VERDICT_SCHEMA }),
          () => agent(reproPrompt(n, f), { label: `repro #${n}.${i + 1}`, phase: 'Refute', schema: VERDICT_SCHEMA, isolation: 'worktree' }),
        ])
        const votes = [
          trace ?? { refuted: true, evidence: 'trace refuter did not return' },
          repro ?? { refuted: true, evidence: 'repro refuter did not return' },
        ]
        return { pr: n, ...f, confirmed: votes.every((v) => !v.refuted), trace: votes[0].evidence, repro: votes[1].evidence }
      }),
    )
    return { pr: n, judged: judged.filter(Boolean), low }
  },
)

const done = results.filter(Boolean)
const judged = done.flatMap((r) => r.judged ?? [])
const out = {
  confirmed: judged.filter((f) => f.confirmed).map(({ confirmed: _c, ...f }) => f),
  refuted: judged.filter((f) => !f.confirmed).map(({ confirmed: _c, ...f }) => f),
  low: done.flatMap((r) => r.low ?? []),
  unreviewed: done.filter((r) => r.unreviewed).map((r) => ({ pr: r.pr, why: r.unreviewed })),
}
const lost = prs.length - done.length
if (lost) log(`${lost} PR(s) dropped by a failed stage — re-run them`)
log(`${out.confirmed.length} confirmed · ${out.refuted.length} refuted · ${out.low.length} low (unverified) · ${out.unreviewed.length} unreviewed`)
return out
