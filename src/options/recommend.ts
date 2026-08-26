import { describeMechanics } from "./candidate-mechanics.js";
import { type CandidateScore, scoreCandidate } from "./candidate-score.js";
import {
  type ChainContract,
  type Outlook,
  type UnderlyingContext,
  type VolRegimeReading,
  volatilityRegime,
} from "./outlook.js";
import type { OptionLeg } from "./payoff-surface.js";
import {
  type AbsentCandidate,
  candidateStructures,
  type StructureKind,
} from "./structure-candidates.js";
import type { RiskHorizon, StructureRisk } from "./structure-risk.js";

/**
 * THE OUTLOOK-FIRST RECOMMENDER — state a view, get a RANKED LIST of ways the chain can express
 * it, each explained by its mechanics.
 *
 * The two existing analogs are IBKR's Strategy Lab (rank candidates by probability and a
 * Sharpe-like ratio given a stated forecast) and tastytrade's bullish/bearish/neutral filter.
 * Neither has existed here. This module is the seam that joins the pieces that already did:
 * `outlook.ts` reads the forecast, `structure-candidates.ts` builds what the chain can carry,
 * `structure-risk.ts` and `probability.ts` mark it, `candidate-score.ts` ranks it, and
 * `candidate-mechanics.ts` says what it does in words nobody can mistake for advice.
 *
 * Three properties are the whole point, and each is load-bearing:
 *
 * - **A LIST, never a suggestion.** The comparison is the product. A single "best" structure hides
 *   the trade-off between a high-probability credit spread and a high-payoff debit spread, which
 *   is exactly the thing a member is here to learn to see.
 * - **Mechanics only.** Every explanation states what the structure does; none states what the
 *   reader should do. Settled posture, inherited — not re-opened here.
 * - **Nothing is silently dropped.** A structure the chain cannot carry, or the engines cannot
 *   mark, comes back in `absent` with a NAMED reason. A shorter list with no explanation would
 *   read as "these were considered and rejected", which is a different and false claim.
 *
 * Sizing is deliberately absent: every candidate is ONE LOT. Portfolio-Greeks-aware sizing is its
 * own piece of work and is not built yet, so this engine ranks shapes, never position sizes.
 *
 * PURE: no I/O, no clock, no randomness. Paper-only, educational.
 */

/** The standing disclosure every ranked list carries, in one place so it cannot drift. */
export const RECOMMENDATION_DISCLOSURE =
  "Educational · paper trading only · modelled mechanics, not financial advice. " +
  "Every number here is a model mark under constant volatility — never a quote, a fill, or a realised P/L.";

/** One structure that could be built, marked, and ranked. */
export interface RankedCandidate {
  readonly kind: StructureKind;
  readonly legs: readonly OptionLeg[];
  /** Calendar days from today to the shared expiry every leg sits on. */
  readonly daysToExpiry: number;
  readonly expiration?: string;
  readonly risk: StructureRisk;
  readonly score: CandidateScore;
  /** The mechanics sentence — what it does, never what to do. */
  readonly mechanics: string;
}

export interface Recommendation {
  /** The view as it was stated, echoed back so a rendering can never mislabel what it answered. */
  readonly outlook: Outlook;
  /** Best-fitting first. Empty when nothing could be built or marked — see `absent`. */
  readonly ranked: readonly RankedCandidate[];
  /** Every structure that was considered and could not be ranked, with the reason it could not. */
  readonly absent: readonly AbsentCandidate[];
  /** Whether premium is rich, middling or cheap for this name — or why that could not be read. */
  readonly volRegime: VolRegimeReading;
  /** The price the stated view points at. ABSENT when no expected move could be described. */
  readonly target?: number;
  readonly disclosure: string;
}

/** Highest composite first; ties broken by name so the same inputs always render the same order. */
function byFit(left: RankedCandidate, right: RankedCandidate): number {
  const gap = right.score.composite - left.score.composite;
  return gap !== 0 ? gap : left.kind.localeCompare(right.kind);
}

/**
 * Rank the ways this chain can express this view. Every structure of the stated direction comes
 * back either RANKED with its mechanics or ABSENT with a named reason; none is dropped in silence,
 * and none is ranked on a number the engines could not actually produce.
 */
export function rankStructures(
  outlook: Outlook,
  context: UnderlyingContext,
  chain: readonly ChainContract[],
): Recommendation {
  const regime = volatilityRegime(context.ivReading);
  const { built, absent, target } = candidateStructures(outlook, context, chain);
  const unranked = [...absent];
  const ranked: RankedCandidate[] = [];

  const horizon: RiskHorizon = {
    spot: context.spot,
    daysForward: outlook.horizonDays,
    volatility: context.volatility,
    ...(context.rate === undefined ? {} : { rate: context.rate }),
  };

  for (const candidate of built) {
    const scored =
      target === undefined
        ? undefined
        : scoreCandidate(candidate.legs, { horizon, target, regime });
    if (!scored) {
      unranked.push({ kind: candidate.kind, reason: "not-scoreable" });
      continue;
    }
    const mechanics = describeMechanics(candidate.kind, candidate.legs, scored.risk, {
      symbol: outlook.symbol,
      horizon,
      ...(candidate.expiration === undefined ? {} : { expiration: candidate.expiration }),
    });
    ranked.push({
      kind: candidate.kind,
      legs: candidate.legs,
      daysToExpiry: candidate.daysToExpiry,
      ...(candidate.expiration === undefined ? {} : { expiration: candidate.expiration }),
      risk: scored.risk,
      score: scored.score,
      mechanics,
    });
  }

  ranked.sort(byFit);
  return {
    outlook,
    ranked,
    absent: unranked,
    volRegime: regime,
    ...(target === undefined ? {} : { target }),
    disclosure: RECOMMENDATION_DISCLOSURE,
  };
}
