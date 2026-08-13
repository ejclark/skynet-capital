// NOTE: .claude/workflows/** is excluded from Biome (biome.json) — workflow scripts run inside
// the Workflow tool's async harness, where top-level `await` and top-level `return` are legal.
// They are not Node modules; the linter's parser rejects the dialect, not the code.
export const meta = {
  name: 'symbol-sweep',
  description: 'Run the earnings-cycle + intraday-edges instruments on a ticker list, red-team each symbol, synthesize playbook fit',
  whenToUse: 'When Eric names tickers to research ("research X, Y, Z", "run the sweep on ..."). Args: {today: "YYYY-MM-DD", tickers: [{sym, peers: "A,B,C"}]}. Each symbol gets both instruments + an adversarial pass; a cross-symbol synthesis judges the house playbooks (S1/S2/E1/S3/S4 + G1) per symbol. Check docs/research/multi-symbol-sweep.md kill list first — never re-run a killed hypothesis without new prints.',
  phases: [
    { title: 'Research', detail: 'one agent per ticker: run both instruments, extract findings + strategy candidates' },
    { title: 'Red team', detail: 'one adversary per ticker: attack every finding and candidate' },
    { title: 'Synthesize', detail: 'cross-ticker matrix, new playbooks, portfolio-level critique' },
  ],
}

// Parameterized: pass {today, tickers} via args. The 2026-08-12 eight-symbol run
// (docs/research/multi-symbol-sweep.md) used the list below; it stands as the example shape.
const DEFAULT_TICKERS = [
  { sym: 'MRVL', peers: 'AVGO,NVDA,AMD' },
  { sym: 'CRWV', peers: 'NVDA,AVGO' },
  { sym: 'AMZN', peers: 'MSFT,GOOG,META' },
  { sym: 'MSFT', peers: 'AAPL,GOOG,AMZN' },
  { sym: 'GOOG', peers: 'MSFT,META,AMZN' },
  { sym: 'META', peers: 'GOOG,AMZN,MSFT' },
  { sym: 'AVGO', peers: 'MRVL,NVDA,AMD' },
  { sym: 'AAPL', peers: 'MSFT,GOOG,AMZN' },
]

const TICKERS = args?.tickers?.length ? args.tickers : DEFAULT_TICKERS
const TODAY = args.today

const RESEARCH_SCHEMA = {
  type: 'object',
  required: ['symbol', 'data_quality', 'playbook_fit', 'new_candidates', 'next_print', 'headline', 'caveats'],
  properties: {
    symbol: { type: 'string' },
    data_quality: {
      type: 'object',
      required: ['earnings_n', 'earnings_span', 'notes'],
      properties: {
        earnings_n: { type: 'number' },
        earnings_span: { type: 'string' },
        notes: { type: 'string' },
      },
    },
    playbook_fit: {
      type: 'array',
      items: {
        type: 'object',
        required: ['playbook', 'verdict', 'evidence'],
        properties: {
          playbook: { type: 'string', enum: ['S1', 'S2', 'E1', 'S3', 'S4'] },
          verdict: { type: 'string', enum: ['fits', 'weak', 'inverted', 'no_data'] },
          evidence: { type: 'string', description: 'effect size, n, the control it was judged against, win rate' },
        },
      },
    },
    new_candidates: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'thesis', 'evidence', 'prerequisites'],
        properties: {
          name: { type: 'string' },
          thesis: { type: 'string' },
          evidence: { type: 'string' },
          prerequisites: { type: 'string', description: 'e.g. needs shorting, needs MOC/MOO, none' },
        },
      },
    },
    next_print: {
      type: 'object',
      required: ['estimate', 'basis'],
      properties: {
        estimate: { type: 'string', description: 'YYYY-MM-DD estimate or "unknown"' },
        basis: { type: 'string', description: 'cadence reasoning; always labeled estimate, never confirmed' },
      },
    },
    headline: { type: 'string', description: 'the single most decision-relevant finding for this symbol' },
    caveats: { type: 'array', items: { type: 'string' } },
  },
}

const REDTEAM_SCHEMA = {
  type: 'object',
  required: ['symbol', 'attacks', 'candidate_verdicts', 'overstatements', 'strongest_surviving'],
  properties: {
    symbol: { type: 'string' },
    attacks: {
      type: 'array',
      items: {
        type: 'object',
        required: ['target', 'attack', 'outcome', 'evidence'],
        properties: {
          target: { type: 'string' },
          attack: { type: 'string' },
          outcome: { type: 'string', enum: ['survives', 'weakened', 'killed'] },
          evidence: { type: 'string' },
        },
      },
    },
    candidate_verdicts: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'verdict', 'why'],
        properties: {
          name: { type: 'string' },
          verdict: { type: 'string', enum: ['deploy_small', 'shelve', 'kill'] },
          why: { type: 'string' },
        },
      },
    },
    overstatements: { type: 'array', items: { type: 'string' } },
    strongest_surviving: { type: 'string' },
  },
}

const SYNTH_SCHEMA = {
  type: 'object',
  required: ['matrix', 'new_playbooks', 'kill_list_additions', 'portfolio_critique', 'deployment_ranked', 'time_sensitive', 'open_questions'],
  properties: {
    matrix: {
      type: 'array',
      items: {
        type: 'object',
        required: ['playbook', 'generalizes', 'per_symbol'],
        properties: {
          playbook: { type: 'string' },
          generalizes: { type: 'string', description: 'one-sentence verdict: does this playbook travel beyond NVDA, and where' },
          per_symbol: {
            type: 'array',
            items: {
              type: 'object',
              required: ['symbol', 'verdict', 'note'],
              properties: {
                symbol: { type: 'string' },
                verdict: { type: 'string', enum: ['fits', 'weak', 'inverted', 'no_data', 'killed'] },
                note: { type: 'string' },
              },
            },
          },
        },
      },
    },
    new_playbooks: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'symbols', 'thesis', 'evidence', 'redteam_verdict', 'prerequisites'],
        properties: {
          name: { type: 'string' },
          symbols: { type: 'string' },
          thesis: { type: 'string' },
          evidence: { type: 'string' },
          redteam_verdict: { type: 'string' },
          prerequisites: { type: 'string' },
        },
      },
    },
    kill_list_additions: { type: 'array', items: { type: 'string' } },
    portfolio_critique: { type: 'array', items: { type: 'string' } },
    deployment_ranked: {
      type: 'array',
      items: {
        type: 'object',
        required: ['rank', 'action', 'symbols', 'sizing_note'],
        properties: {
          rank: { type: 'number' },
          action: { type: 'string' },
          symbols: { type: 'string' },
          sizing_note: { type: 'string' },
        },
      },
    },
    time_sensitive: { type: 'array', items: { type: 'string' }, description: 'anything with a date inside ~4 weeks of today' },
    open_questions: { type: 'array', items: { type: 'string' } },
  },
}

const researchPrompt = (t) => `You are a quantitative research agent for the skynet-capital repo (a PAPER-TRADING educational app — nothing here places real orders). Working directory: /home/user/skynet-capital. Today is ${TODAY}.

Your task: run the repo's two existing research instruments on ${t.sym} and extract what they actually show, with the same adversarial honesty the instruments were built for.

STEP 1 — read the framework. Read the header comments of both scripts FIRST; they define the controls discipline (drift, beta, regime, small-n) your interpretation must follow:
- scripts/research/earnings-cycle.mjs (the four ways the analysis lies + the control for each)
- scripts/research/intraday-edges.mjs (volatility is not edge; the three-question scoring; break-even slippage)

STEP 2 — run the instruments (results are cached under node_modules/.cache so re-runs are free):
- node scripts/research/earnings-cycle.mjs ${t.sym} --bench QQQ --peers ${t.peers}
- node scripts/research/intraday-edges.mjs ${t.sym}
${t.sym === 'CRWV' ? '- CRWV IPO-ed 2025-03-28 and has only ~4 prints. Also run with --since 2025. Expect thin, wide-variance numbers and report them as such — an n=4 "pattern" is an anecdote, not a finding. If a section errors on missing data, say so honestly rather than working around it.' : ''}
Capture FULL output of both (pipe through cat, do not truncate). Re-run with different --since only if you have a specific regime question.

STEP 3 — judge the existing playbook set against ${t.sym}. The house playbooks (from docs/plans/trade-playbooks.md, derived from NVDA):
- S1 positioning bid: long at D-20, flat at D-5 before a print (on NVDA: +9.08% mean, 14/14 modern era; the last week is dead money)
- S2 never hold the print: force flat by D-1 (removes the earnings coin flip)
- E1 don't trade the open: defer non-urgent entries past 10:00 ET (cost structure, not alpha)
- S3 fade the reaction-day open: short at open D+1, cover at close (on NVDA: -2.48% mean, 11/14 red)
- S4 overnight-only: hold close-to-open, flat intraday (on NVDA: ~87% of return overnight)
For EACH, give a verdict for ${t.sym}: fits / weak / inverted / no_data — judged against the script's own controls (excess over non-earnings baseline, net-of-QQQ, era splits, win rate vs base rate). An effect that only exists pooled but not in the modern era is "weak" at best. NEVER report a raw mean as a finding when the baseline-excess disagrees.

STEP 4 — look for symbol-SPECIFIC patterns the NVDA playbooks don't cover (e.g. a run-up window with a different shape, a reaction-day behavior that inverts NVDA's, an overnight/intraday split that differs). Only name a candidate if it clears its control AND you can state what would kill it. Note each candidate's prerequisites (shorting? MOC/MOO order types? nothing?).

STEP 5 — estimate ${t.sym}'s NEXT print date from the cadence of its own 8-K dates in the script output (they are listed in the header line + window tables). Label it an estimate. If it lands within ~4 weeks of today (${TODAY}), say so prominently in your headline.

Rules: do NOT modify any repo files. Report every number with its n and its control. Your final response is consumed by a downstream program via the structured-output schema — return the data, no prose wrapper.`

const redteamPrompt = (research, t) => `You are an adversarial red-team agent for the skynet-capital repo (paper-trading educational app). Working directory: /home/user/skynet-capital. Today is ${TODAY}. Your ONLY job is to REFUTE — default to skepticism; a finding you cannot attack after genuine effort is the only kind that survives.

A research agent studied ${t.sym} with the repo's two instruments and returned this:

${JSON.stringify(research, null, 2)}

You can (and should) re-run the instruments yourself to check any claim — cached, so free:
- node scripts/research/earnings-cycle.mjs ${t.sym} --bench QQQ --peers ${t.peers}   (also try different --since values to test regime-robustness)
- node scripts/research/intraday-edges.mjs ${t.sym}   (and --slippage variants to stress the break-even claims)
Read the script headers first if you need the methodology.

MANDATORY attack battery — run each against every material claim above:
1. MULTIPLE TESTING: this same battery ran on 8 tickers in parallel, ~5 windows/tests each — roughly 40+ tests. At p<0.05 you EXPECT ~2 false positives. Any single-symbol "edge" without a mechanism is a lottery ticket. Bonferroni-style threshold is ~0.001, not 0.05.
2. AI-BETA CONFOUND: all 8 symbols are AI-adjacent mega/large-cap tech. Is the "finding" just correlated NVDA/QQQ exposure wearing a costume? Check the net-of-benchmark rows; a finding that vanishes net-of-QQQ is beta, not alpha.
3. REGIME: does it survive era-splitting, or does it exist only in the 2023-26 bull leg? What happens to the strategy the day the AI trade reverses?
4. DATE ALIGNMENT: earnings dates are SEC 8-K FILING dates. Verify the reaction day actually lands where the script assumes (D = after close, reaction = D+1). A company that files the morning after would shift everything by one day and corrupt every window. Sanity-check by looking at whether the big |gap| lands on the assumed reaction day.
5. COSTS & MICROSTRUCTURE: break-even slippage vs realistic costs for THIS symbol's liquidity. Anything requiring shorting: borrow availability/cost is nonzero even paper-honest.
6. SMALL n: binomial-vs-base-rate for any win-rate claim. n=4 (CRWV) proves nothing; say so if the researcher hedged too softly.
7. OVERSTATEMENT SCAN: did the researcher report a raw mean where the excess disagrees, pool eras to launder a dead modern era, or headline something whose control row contradicts it?

For every proposed candidate, give a verdict: deploy_small (survives with position-size humility) / shelve (interesting, blocked or under-evidenced) / kill (refuted). Killing is a GOOD outcome — record why so it is never re-proposed.

Rules: do NOT modify any repo files. Your final response is consumed by a downstream program via the structured-output schema — return the data, no prose wrapper.`

phase('Research')
const pairs = await pipeline(
  TICKERS,
  (t) => agent(researchPrompt(t), { label: `research:${t.sym}`, phase: 'Research', schema: RESEARCH_SCHEMA, effort: 'high' }),
  (research, t) => {
    if (!research) return null
    return agent(redteamPrompt(research, t), { label: `redteam:${t.sym}`, phase: 'Red team', schema: REDTEAM_SCHEMA, effort: 'xhigh' })
      .then((redteam) => ({ sym: t.sym, research, redteam }))
  },
)

const complete = pairs.filter(Boolean)
log(`${complete.length}/8 tickers completed research + red team`)

phase('Synthesize')
const synthesis = await agent(`You are the synthesis agent for a multi-symbol trading-strategy sweep in the skynet-capital repo (PAPER-trading educational app). Working directory: /home/user/skynet-capital. Today is ${TODAY}.

Eight tickers (MRVL, CRWV, AMZN, MSFT, GOOG, META, AVGO, AAPL) were each studied with the repo's earnings-cycle and intraday-edges instruments, then independently red-teamed. The full pairs (research + red-team verdicts) are below. Context: the house playbook set (docs/plans/trade-playbooks.md) was derived from NVDA — S1 positioning bid (D-20 to D-5), S2 never hold the print, E1 defer entries past 10:00 ET, S3 fade the reaction open (blocked: shorting), S4 overnight-only (blocked: MOC/MOO). Read that file for exact definitions.

${JSON.stringify(complete, null, 2)}

Produce the cross-ticker synthesis:
1. MATRIX: for each playbook S1/S2/E1/S3/S4, the per-symbol verdict (honoring the red team — a red-team kill overrides a researcher fits) and a one-line generalization verdict: does this playbook travel beyond NVDA, and to which symbols?
2. NEW PLAYBOOKS: candidates that SURVIVED their red team, deduplicated across symbols (if three symbols show the same shape, that is ONE playbook with a symbol list — and stronger for the replication). Note prerequisites.
3. KILL LIST additions: refuted candidates, with the refutation, so they are never re-proposed.
4. PORTFOLIO CRITIQUE: the cross-cutting risks no single-symbol view sees — the ~40-test multiple-comparisons exposure and what actually clears a corrected threshold; the correlated-AI-beta problem (8 playbook slots that are secretly one trade); regime concentration in 2023-26; anything else material.
5. DEPLOYMENT RANKED: what to actually do, in order, with sizing humility notes. Long-only and no new order types are the current constraints (shorting and MOC/MOO are blocked pending Eric).
6. TIME SENSITIVE: every next-print estimate within ~4 weeks of ${TODAY}, and what the playbook verdict implies to do about each, this week.
7. OPEN QUESTIONS: the forks only Eric can settle, phrased so "yes" is one word.

Be ruthless about honesty: a replication across correlated symbols is weaker than it looks (shared beta), and say exactly how much survives the correction. Your final response is consumed by a downstream program via the structured-output schema — return the data, no prose wrapper.`, { label: 'synthesize', phase: 'Synthesize', schema: SYNTH_SCHEMA, effort: 'xhigh' })

return { pairs: complete, synthesis }