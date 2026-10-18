/**
 * CANDIDATE PLAYBOOKS (#4808 slice 3) — a new signal idea enters here, not in the registry. Eric,
 * 2026-10-07: "This foster playbook creation as the conduit to improve ROI for portfolios." A
 * candidate is a hypothesis with a dated falsifier and a pre-registered back-test; it graduates to
 * the registry only by passing, and is killed with a date by failing.
 *
 * IT CANNOT TRADE BY CONSTRUCTION (EARS 3). A candidate is not a `Playbook`: it has no
 * `desiredState`, no sizing and no window, so nothing that places or suggests an order can be handed
 * one, and `tests/playbooks/candidates.spec.ts` keeps its id out of the registry and the pair table.
 * The Store card says its back-test status in words (`candidateLine`).
 *
 * THE FIVE STEPS ARE DECLARED BEFORE THE FIRST RUN. The 2026-10-07 sweep refuted 8 of 8 candidates,
 * each for missing one of them (`docs/research/multi-symbol-sweep.md`; the call-sheet comment on
 * #4808): a fixed threshold · a power estimate with three outcomes · a control · a confound filter
 * that is print-clean on both sides · factor-aware grouping, sized to the latest era. `power` is
 * numbers, not prose, because `scripts/research/backtest-verdict-math.mjs` reads it to decide pass,
 * kill or underpowered — and judges power FIRST, so a thin sample is `underpowered` and goes to
 * `next-slice`, never to the kill list.
 *
 * KILLED MEANS RECORDED (EARS 4): a killed candidate carries its date and reason, and the spec fails
 * until its id is on the kill list in `docs/research/multi-symbol-sweep.md` — so it is never
 * re-proposed.
 */

/** Where a candidate stands. Only `not-run` and `underpowered` are open. */
export type BacktestStatus =
  | { readonly kind: "not-run" }
  | { readonly kind: "passed"; readonly on: string }
  | { readonly kind: "killed"; readonly on: string; readonly because: string }
  | {
      readonly kind: "underpowered";
      readonly on: string;
      readonly clusters: number;
      readonly needed: number;
    };

/** The numbers the verdict is judged by, fixed before any run. */
export interface CandidatePower {
  /** Expected spread of one date's mean excess return, in percent. An assumption, written down. */
  readonly sdPct: number;
  /** The smallest excess over the control worth trading, in percent. */
  readonly effectPct: number;
  /** The bar as a z value (3.29 is a two-sided 1-in-1,000). */
  readonly zBar: number;
  /** The power as a z value (0.84 is 80%). */
  readonly zPower: number;
}

export interface CandidateSteps {
  /** 1 · the line, with its numbers. */
  readonly threshold: string;
  /** 2 · declared so the verdict can be pass, kill or underpowered. */
  readonly power: CandidatePower;
  /** 3 · the simpler cousin the signal has to beat. */
  readonly control: string;
  /** 4 · what is dropped so the result is print-clean on both sides. */
  readonly confoundFilter: string;
  /** 5 · how events are grouped, and the era the result is sized to. */
  readonly grouping: string;
}

export interface CandidatePlaybook {
  readonly id: string;
  readonly name: string;
  /** The idea in a member's words. */
  readonly hypothesis: string;
  /** Research scripts that compute its inputs for any ticker, each `node scripts/research/*.mjs <SYM>`. */
  readonly instruments: readonly string[];
  readonly steps: CandidateSteps;
  readonly falsifier: { readonly by: string; readonly text: string };
  readonly status: BacktestStatus;
}

export const CANDIDATES: readonly CandidatePlaybook[] = [
  {
    id: "CAND-OPTVOL-BOLLINGER",
    name: "Options volume at the Bollinger edge",
    hypothesis:
      "When heavy option volume arrives on a day the stock closes at the edge of its 20-day range, the move over the next 5 sessions continues (momentum) or reverses (pullback) more than a band touch alone would say.",
    instruments: [
      "node scripts/research/option-volume.mjs <SYM>",
      "node scripts/research/bollinger-touch.mjs <SYM>",
    ],
    steps: {
      threshold:
        "option volume (calls plus puts, all exchanges) of at least 3 times its own trailing 20-session mean, on a session that closes at or beyond the 20-day, 2-standard-deviation Bollinger band; judged on the next 5 sessions' return net of QQQ over the same dates",
      power: { sdPct: 4, effectPct: 1.5, zBar: 3.29, zPower: 0.84 },
      control:
        "the same band touch on sessions where option volume is under 1.5 times its mean: the signal must beat the price-only cousin, not zero",
      confoundFilter:
        "drop any touch whose 5-session outcome window, or the 5 sessions before the touch, contains the stock's earnings report, confirmed from SEC filings; the control is filtered the same way",
      grouping:
        "average events within their date and treat dates as the sample; returns net of QQQ so the shared market move is not the result; the newest 12 months must carry the same sign as the whole sample",
    },
    falsifier: {
      by: "2026-12-31",
      text: "no pre-registered cell beats its price-only control, run across about 500 liquid stocks from the OCC's whole-market file with dates clustered",
    },
    status: { kind: "not-run" },
  },
];

/** What a Store card says about a candidate's back-test, in words. */
export function backtestWords(status: BacktestStatus): string {
  switch (status.kind) {
    case "not-run":
      return "Back-test: not run yet.";
    case "passed":
      return `Back-test: passed on ${status.on}.`;
    case "killed":
      return `Back-test: killed on ${status.on} — ${status.because}.`;
    case "underpowered":
      return `Back-test: underpowered on ${status.on} (${status.clusters} independent days of the ${status.needed} needed). Not a kill; it needs more history.`;
  }
}

/** The whole card line: never trades, then the back-test status, then what proves it wrong. */
export function candidateLine(candidate: CandidatePlaybook): string {
  return `Candidate — it never places or suggests an order. ${backtestWords(candidate.status)} Dead if, by ${candidate.falsifier.by}, ${candidate.falsifier.text}.`;
}

/** Why a candidate's declaration is not one research can back-test — empty when it is. */
export function candidateProblems(candidate: CandidatePlaybook): readonly string[] {
  const { steps, instruments, falsifier, status } = candidate;
  const problems: string[] = [];
  const fixed = (text: string) => /\d/.test(text) && !/\be\.g\./i.test(text);
  if (!fixed(steps.threshold)) problems.push("step 1: the threshold is not a fixed number");
  const { sdPct, effectPct, zBar, zPower } = steps.power;
  if (!(sdPct > 0 && effectPct > 0 && zBar > 0 && zPower >= 0))
    problems.push("step 2: the power estimate needs positive numbers");
  if (!steps.control.trim()) problems.push("step 3: no control");
  if (!steps.confoundFilter.trim()) problems.push("step 4: no confound filter");
  if (!steps.grouping.trim()) problems.push("step 5: no grouping");
  if (!instruments.length) problems.push("no instrument computes its inputs");
  for (const instrument of instruments)
    if (!/^node scripts\/research\/[\w-]+\.mjs <SYM>/.test(instrument))
      problems.push(`'${instrument}' is not one research script run on <SYM>`);
  if (!(/^\d{4}-\d{2}-\d{2}$/.test(falsifier.by) && falsifier.text.trim()))
    problems.push("the falsifier needs a date and an observation");
  if (status.kind === "killed" && !status.because.trim())
    problems.push("a killed candidate says why");
  if (status.kind === "underpowered" && status.clusters >= status.needed)
    problems.push("underpowered, yet it had the clusters it needed");
  return problems;
}
