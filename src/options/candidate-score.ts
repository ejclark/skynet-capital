import type { VolRegimeReading } from "./outlook.js";
import type { StructureLeg } from "./payoff-surface.js";
import { probabilityOfProfit } from "./probability.js";
import {
  type RiskHorizon,
  type StructureRisk,
  structureProfitAt,
  structureRisk,
} from "./structure-risk.js";

/**
 * CANDIDATE SCORING — how well one structure expresses the view that was stated.
 *
 * IBKR's Strategy Lab ranks on probability of profit and a Sharpe-like ratio; this ranks on four
 * things a member can actually check, each computed off engines already in the repo rather than
 * invented here:
 *
 * 1. **Probability of profit** (`probability.ts`) — the odds the structure is above break-even at
 *    the horizon.
 * 2. **Outcome at the stated target** (`structure-risk.ts`) — what it pays IF the view is right,
 *    as a return on the capital it risks. This is the component that makes the ranking
 *    outlook-FIRST: a high-POP structure that barely pays when the forecast lands is not the best
 *    expression of that forecast, and this term is what says so.
 * 3. **Reward to risk** — the most it can make against the most it can lose.
 * 4. **Vol fit** (`iv-rank.ts`, via `outlook.ts`) — whether a structure that wants cheap premium
 *    is being opened into cheap premium.
 *
 * The weights are DEFENSIBLE, NOT TUNED, and named so a fitting pass is one edit in one place.
 * They have not been fitted against this app's chains, and they are not an edge: two structures
 * separated by a hundredth of a point are not meaningfully ranked.
 *
 * ABSENCE IS A FIRST-CLASS ANSWER, and it is handled by RENORMALISING, never by substituting.
 * When IV history cannot support a rank, the vol-fit term is dropped and the remaining weights are
 * re-based — because scoring it as "middling" would read as "checked, and it's fine", which is a
 * different claim from "not checked". Same for a return on capital that is not bounded.
 *
 * PURE: no I/O, no clock. `undefined` means "no honest answer", never zero.
 */

/** How much each component moves the composite. Defensible starting weights, not fitted. */
export const SCORE_WEIGHTS = {
  probabilityOfProfit: 0.35,
  targetOutcome: 0.35,
  rewardToRisk: 0.2,
  volFit: 0.1,
} as const;

/** What a structure wants from implied volatility, read off its net long/short option lots. */
export type VolStance = "long-vega" | "short-vega" | "vega-neutral";

export interface VolFit {
  readonly stance: VolStance;
  /** The regime read, or the named reason none could be. */
  readonly reading: VolRegimeReading;
  /** 0–1 alignment. ABSENT when the regime is absent — the term is dropped, not defaulted. */
  readonly alignment?: number;
}

export interface CandidateScore {
  /** 0–1 composite over the components that could be measured. */
  readonly composite: number;
  readonly probabilityOfProfit: number;
  /** Marked P/L in dollars at the price the view points at. Can be negative — that is the point. */
  readonly targetProfit: number;
  /** `targetProfit ÷ capital at risk`. ABSENT when the risk is unbounded, so there is no base. */
  readonly targetReturn?: number;
  /** `maxProfit ÷ maxLoss`. ABSENT when either bound is unbounded or the loss is zero. */
  readonly rewardToRisk?: number;
  readonly volFit: VolFit;
}

/** A structure that survived scoring, with the risk profile the score was computed from. */
export interface ScoredStructure {
  readonly risk: StructureRisk;
  readonly score: CandidateScore;
}

export interface ScoreInput {
  readonly horizon: RiskHorizon;
  /** The price the stated view points at — `outlook.ts`'s `outlookTarget`. */
  readonly target: number;
  readonly regime: VolRegimeReading;
}

/** Map a non-negative ratio onto 0–1 without a cliff: 1× lands at 0.5, 3× at 0.75. */
function saturate(ratio: number): number {
  if (!Number.isFinite(ratio) || ratio <= 0) return 0;
  return ratio / (1 + ratio);
}

/** Net option LOTS: positive is net long options (long vega), negative net short. */
function volStance(legs: readonly StructureLeg[]): VolStance {
  let lots = 0;
  for (const leg of legs) if (leg.kind !== "stock") lots += leg.quantity;
  if (lots > 0) return "long-vega";
  if (lots < 0) return "short-vega";
  return "vega-neutral";
}

/**
 * How well the structure's vol stance matches what premium currently costs. A vega-neutral
 * structure scores the middle by construction, not by default — it genuinely does not care.
 */
function volAlignment(stance: VolStance, reading: VolRegimeReading): number | undefined {
  if (reading.kind === "absent") return undefined;
  if (stance === "vega-neutral" || reading.regime === "middling") return 0.5;
  const wants = stance === "long-vega" ? "cheap" : "rich";
  return reading.regime === wants ? 1 : 0;
}

/** The reward-to-risk term: its printable ratio when there is one, and its 0–1 contribution. */
function rewardTerm(risk: StructureRisk): { ratio?: number; value: number } {
  if (risk.maxLoss.kind === "unbounded") return { value: 0 };
  if (risk.maxProfit.kind === "unbounded") return { value: 1 };
  if (risk.maxLoss.amount <= 0) return { value: 1 };
  const ratio = risk.maxProfit.amount / risk.maxLoss.amount;
  return { ratio, value: saturate(ratio) };
}

/** One scored component: how much it counts, and how well this structure did on it. */
interface ScoreTerm {
  readonly weight: number;
  readonly value: number;
}

/** The composite: a weighted mean over the components that are present, re-based on their weights. */
function weightedMean(terms: readonly ScoreTerm[]): number {
  let weighted = 0;
  let total = 0;
  for (const term of terms) {
    weighted += term.weight * term.value;
    total += term.weight;
  }
  return total > 0 ? weighted / total : 0;
}

/**
 * Score one structure against one stated view. `undefined` when the payoff or probability engine
 * cannot describe it — the caller reports it ABSENT with that reason rather than ranking it on a
 * fabricated number.
 */
export function scoreCandidate(
  legs: readonly StructureLeg[],
  input: ScoreInput,
): ScoredStructure | undefined {
  const { horizon, target, regime } = input;
  const risk = structureRisk(legs, horizon);
  const targetProfit = structureProfitAt(legs, horizon, target);
  const pop = probabilityOfProfit(legs, {
    spot: horizon.spot,
    daysForward: horizon.daysForward,
    volatility: horizon.volatility,
    rate: horizon.rate,
  });
  if (!risk || targetProfit === undefined || pop === undefined) return undefined;

  const reward = rewardTerm(risk);
  const stance = volStance(legs);
  const alignment = volAlignment(stance, regime);
  const targetReturn =
    risk.capitalAtRisk !== undefined && risk.capitalAtRisk > 0
      ? targetProfit / risk.capitalAtRisk
      : undefined;

  const terms: ScoreTerm[] = [
    { weight: SCORE_WEIGHTS.probabilityOfProfit, value: pop },
    { weight: SCORE_WEIGHTS.rewardToRisk, value: reward.value },
  ];
  if (targetReturn !== undefined) {
    terms.push({ weight: SCORE_WEIGHTS.targetOutcome, value: saturate(targetReturn) });
  }
  if (alignment !== undefined) terms.push({ weight: SCORE_WEIGHTS.volFit, value: alignment });

  const volFit: VolFit =
    alignment === undefined ? { stance, reading: regime } : { stance, reading: regime, alignment };
  const score: CandidateScore = {
    composite: weightedMean(terms),
    probabilityOfProfit: pop,
    targetProfit,
    ...(targetReturn === undefined ? {} : { targetReturn }),
    ...(reward.ratio === undefined ? {} : { rewardToRisk: reward.ratio }),
    volFit,
  };
  return { risk, score };
}
