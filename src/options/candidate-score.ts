import { SHARES_PER_CONTRACT } from "../trading/option-economics.js";
import type { VolRegimeReading } from "./outlook.js";
import type { StructureLeg } from "./payoff-surface.js";
import { priceOption } from "./pricing.js";
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
 * TWO KINDS OF MISSING NUMBER, HANDLED DIFFERENTLY — the distinction is the whole honesty story of
 * this file, and getting it backwards inverts the ranking:
 *
 * - **Unknown** — the input was never available. IV history that cannot support a rank is the only
 *   case. The vol-fit term is DROPPED and the surviving weights re-based, because scoring it as
 *   "middling" would read as "checked, and it's fine", a different claim from "not checked".
 * - **Uncapped** — the number is missing BECAUSE of what the structure is. A short strangle has no
 *   return on capital because its capital at risk has no ceiling. That is a fact about the trade,
 *   not an absence of information, so it is SCORED AT THE BOTTOM of both capital-based terms and
 *   never renormalised away. Renormalising it would delete the two terms that penalise uncapped
 *   risk and leave the structure ranked on its (high) probability of profit alone — precisely the
 *   misleading answer this app must not give. The dollar RATIO stays absent because there isn't
 *   one; `risk.maxProfit` / `risk.maxLoss` name which side has no ceiling.
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
  /** ABSENT when a leg could not be priced, so no vega could be measured. */
  readonly stance?: VolStance;
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
  /**
   * `targetProfit ÷ capital at risk`. ABSENT when the loss is uncapped, so there is no base to
   * divide by — the composite still scores that axis, at the bottom. See `risk.maxLoss`.
   */
  readonly targetReturn?: number;
  /**
   * `maxProfit ÷ maxLoss`. ABSENT when either bound is uncapped or the loss is zero — again the
   * composite still scores the axis (0 for an uncapped loss, 1 for uncapped profit or no loss);
   * `risk.maxProfit` / `risk.maxLoss` say which side has no ceiling.
   */
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

/**
 * How much of the structure's vega has to survive netting before it counts as a stance. A
 * FRACTION of gross vega, not a dollar figure, so a one-lot butterfly and a fifty-lot condor are
 * judged the same way. Below it the structure genuinely does not care what premium costs.
 */
const VEGA_NEUTRAL_FRACTION = 0.1;

/**
 * The structure's vol stance, read off ACTUAL VEGA from the pricing core rather than off net lots.
 * Net lots is the tempting shortcut and it is wrong for exactly the structures this term exists to
 * judge: a vertical, an iron condor and a butterfly all net to zero lots while carrying real,
 * signed vega — an iron condor is meaningfully SHORT premium, which is the whole reason a desk
 * opens one into a rich IV rank. `undefined` when a leg cannot be priced at all.
 */
function volStance(legs: readonly StructureLeg[], horizon: RiskHorizon): VolStance | undefined {
  let net = 0;
  let gross = 0;
  for (const leg of legs) {
    if (leg.kind === "stock") continue;
    const valuation = priceOption({
      spot: horizon.spot,
      strike: leg.strike,
      daysToExpiry: leg.daysToExpiry,
      volatility: leg.volatility,
      rate: horizon.rate,
      type: leg.kind,
    });
    if (!valuation) return undefined;
    const vega = leg.quantity * SHARES_PER_CONTRACT * valuation.vega;
    net += vega;
    gross += Math.abs(vega);
  }
  if (gross <= 0) return "vega-neutral";
  const share = net / gross;
  if (share > VEGA_NEUTRAL_FRACTION) return "long-vega";
  if (share < -VEGA_NEUTRAL_FRACTION) return "short-vega";
  return "vega-neutral";
}

/**
 * How well the structure's vol stance matches what premium currently costs. A vega-neutral
 * structure scores the middle by construction, not by default — it genuinely does not care.
 */
function volAlignment(
  stance: VolStance | undefined,
  reading: VolRegimeReading,
): number | undefined {
  if (reading.kind === "absent" || stance === undefined) return undefined;
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
  const stance = volStance(legs, horizon);
  const alignment = volAlignment(stance, regime);
  const capital = risk.capitalAtRisk;
  const targetReturn = capital !== undefined && capital > 0 ? targetProfit / capital : undefined;
  // Uncapped loss scores the BOTTOM of this axis; a structure that cannot lose scores the top.
  // Neither is renormalised away — see the two-kinds-of-missing-number note at the top.
  const targetValue =
    targetReturn !== undefined ? saturate(targetReturn) : capital === undefined ? 0 : 1;

  const terms: ScoreTerm[] = [
    { weight: SCORE_WEIGHTS.probabilityOfProfit, value: pop },
    { weight: SCORE_WEIGHTS.rewardToRisk, value: reward.value },
    { weight: SCORE_WEIGHTS.targetOutcome, value: targetValue },
  ];
  if (alignment !== undefined) terms.push({ weight: SCORE_WEIGHTS.volFit, value: alignment });

  const volFit: VolFit = {
    reading: regime,
    ...(stance === undefined ? {} : { stance }),
    ...(alignment === undefined ? {} : { alignment }),
  };
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
