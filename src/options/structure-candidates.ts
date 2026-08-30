import {
  BOUNDARY_SIGMAS,
  type ChainContract,
  expectedMove,
  type Outlook,
  outlookTarget,
  type UnderlyingContext,
} from "./outlook.js";
import type { OptionLeg } from "./payoff-surface.js";
import {
  type AnchorFrame,
  anchorsFor,
  type LegAnchor,
  type StructureKind,
  structuresFor,
} from "./structure-templates.js";

/**
 * CANDIDATE GENERATION — the small, named set of structures a stated view can be expressed with.
 *
 * This is the half of the recommender that decides WHAT to consider; scoring decides which of them
 * fits best. Keeping them apart matters: a generator that quietly filtered on its own guess of
 * "good" would hide the comparison the whole feature exists to show.
 *
 * The shapes themselves live in `structure-templates.ts`; this file is what happens when they meet
 * a real chain. Every candidate is ONE LOT per leg — sizing is not this module's business, and
 * portfolio-Greeks-aware sizing is not built yet.
 *
 * How strikes are chosen, stated so nobody mistakes it for optimisation:
 *
 * - Anchors are prices, in expected moves off spot (`outlook.ts` owns that translation). Each
 *   anchor then SNAPS to the nearest listed strike of the right kind at the chosen expiry, so
 *   every candidate is made of contracts that actually exist — and only when a listed strike is
 *   actually NEAR it; a chain that stops short of where the view points says so by name.
 * - The expiry is the NEAREST ONE AT OR AFTER the horizon. An expiry inside the horizon would be
 *   marked past its own expiration by the payoff engine — a sketch, not a settlement — so the
 *   whole candidate set is reported ABSENT instead.
 * - Two legs that snap to the same strike are a COLLAPSED structure, not a narrower one. Reported
 *   absent by name rather than silently emitted as something with no width.
 *
 * PURE: no I/O, no clock. `chain` is the caller's snapshot; nothing here fetches or filters it.
 */

/** Why a candidate has no honest ranking. Named, so a renderer says WHICH — never just a blank. */
export type CandidateAbsence =
  /** The context cannot describe a distribution — no spot, no volatility, no horizon. */
  | "no-expected-move"
  /** The chain carries no expiry at or after the horizon; a shorter one cannot be marked there. */
  | "no-expiry-at-horizon"
  /** The chosen expiry lists no contract of a kind this structure needs. */
  | "missing-strike"
  /** Two legs snapped to the same listed strike; the structure has no width left. */
  | "strikes-collapsed"
  /** The nearest listed strike is nowhere near the price the view anchors that leg at. */
  | "strike-out-of-reach"
  /** A chosen contract has no honest premium to open it at. */
  | "missing-quote"
  /** A chosen contract has no solved implied volatility, so it cannot be marked forward. */
  | "missing-iv"
  /** The payoff or probability engine could not describe this structure. */
  | "not-scoreable";

/** A structure that could not be built or scored, and the named reason it could not. */
export interface AbsentCandidate {
  readonly kind: StructureKind;
  readonly reason: CandidateAbsence;
}

/** A structure that exists on the chain, built one lot per leg, ready to be scored. */
export interface BuiltCandidate {
  readonly kind: StructureKind;
  readonly legs: readonly OptionLeg[];
  /** Calendar days from today to the shared expiry every leg sits on. */
  readonly daysToExpiry: number;
  /** ISO expiry date, when the chain carried one. */
  readonly expiration?: string;
}

/** A spread's default wing, in expected moves — half a move, floored at the listed strike step. */
const HALF_MOVE_WING = 0.5;

/** The nearest expiry at or after the horizon, in calendar days. `undefined` when none reaches it. */
function expiryAtOrAfter(chain: readonly ChainContract[], horizonDays: number): number | undefined {
  let best: number | undefined;
  for (const contract of chain) {
    const days = contract.daysToExpiry;
    if (!Number.isFinite(days) || days < horizonDays) continue;
    if (best === undefined || days < best) best = days;
  }
  return best;
}

/** The tightest gap between adjacent listed strikes — a spread's narrowest honest wing. */
function listedStrikeStep(contracts: readonly ChainContract[]): number | undefined {
  const strikes = [...new Set(contracts.map((c) => c.strike))].sort((a, b) => a - b);
  let step: number | undefined;
  for (let index = 0; index + 1 < strikes.length; index += 1) {
    const low = strikes[index];
    const high = strikes[index + 1];
    if (low === undefined || high === undefined) continue;
    const gap = high - low;
    if (gap > 0 && (step === undefined || gap < step)) step = gap;
  }
  return step;
}

/** The listed contract of this kind whose strike sits closest to the anchor price. */
function nearestListed(
  contracts: readonly ChainContract[],
  anchor: LegAnchor,
): ChainContract | undefined {
  let best: ChainContract | undefined;
  for (const contract of contracts) {
    if (contract.kind !== anchor.kind) continue;
    if (!(Number.isFinite(contract.strike) && contract.strike > 0)) continue;
    if (
      best === undefined ||
      Math.abs(contract.strike - anchor.price) < Math.abs(best.strike - anchor.price)
    ) {
      best = contract;
    }
  }
  return best;
}

/**
 * Whether the chain can honestly REPRESENT this anchor, rather than merely offer something nearer
 * to it than anything else. `nearestListed` always answers; on a chain that stops at 100 it will
 * happily answer "100" for an anchor at 5, which would emit a naked long put dressed as a spread
 * on a $9,500 width. An anchor counts as representable when a listed strike brackets it, or sits
 * within one strike step of the end of the listed range.
 */
function isWithinReach(
  contracts: readonly ChainContract[],
  anchor: LegAnchor,
  step: number,
): boolean {
  const strikes = contracts.filter((c) => c.kind === anchor.kind).map((c) => c.strike);
  if (strikes.length === 0) return false;
  return anchor.price >= Math.min(...strikes) - step && anchor.price <= Math.max(...strikes) + step;
}

/** Turn one structure's anchors into real legs, or name the reason the chain cannot carry it. */
function buildCandidate(
  kind: StructureKind,
  frame: AnchorFrame,
  contracts: readonly ChainContract[],
  daysToExpiry: number,
): BuiltCandidate | AbsentCandidate {
  const legs: OptionLeg[] = [];
  const claimed = new Set<number>();
  for (const anchor of anchorsFor(kind, frame)) {
    const contract = nearestListed(contracts, anchor);
    if (!contract) return { kind, reason: "missing-strike" };
    if (!isWithinReach(contracts, anchor, frame.step)) {
      return { kind, reason: "strike-out-of-reach" };
    }
    // Keyed on the STRIKE alone, not the strike and the kind: none of the nine structures ever
    // wants two legs on one strike, so a put and a call landing together is a short straddle
    // wearing a strangle's name — the exact mislabelling this guard exists to stop.
    if (claimed.has(contract.strike)) return { kind, reason: "strikes-collapsed" };
    claimed.add(contract.strike);
    if (contract.price === undefined || !Number.isFinite(contract.price)) {
      return { kind, reason: "missing-quote" };
    }
    if (contract.volatility === undefined || !(contract.volatility >= 0)) {
      return { kind, reason: "missing-iv" };
    }
    legs.push({
      kind: anchor.kind,
      quantity: anchor.quantity,
      strike: contract.strike,
      daysToExpiry,
      volatility: contract.volatility,
      entryPrice: contract.price,
    });
  }
  const expiration = contracts.find((c) => c.expiration !== undefined)?.expiration;
  return expiration === undefined
    ? { kind, legs, daysToExpiry }
    : { kind, legs, daysToExpiry, expiration };
}

/** Everything a structure set needs, resolved together so a failure names itself once. */
export interface CandidateSet {
  readonly built: readonly BuiltCandidate[];
  readonly absent: readonly AbsentCandidate[];
  /** The price the stated view points at — carried forward so scoring measures against it. */
  readonly target?: number;
}

/**
 * The candidate structures for one stated view against one chain snapshot. Every structure of the
 * stated direction comes back either BUILT or ABSENT-with-a-reason; none is silently dropped, so a
 * caller can always show what it considered as well as what it ranked.
 */
export function candidateStructures(
  outlook: Outlook,
  context: UnderlyingContext,
  chain: readonly ChainContract[],
): CandidateSet {
  const kinds = structuresFor(outlook.direction);
  const move = expectedMove(context, outlook.horizonDays);
  const target = outlookTarget(outlook, context);
  if (move === undefined || target === undefined) {
    return { built: [], absent: kinds.map((kind) => ({ kind, reason: "no-expected-move" })) };
  }

  const daysToExpiry = expiryAtOrAfter(chain, outlook.horizonDays);
  if (daysToExpiry === undefined) {
    return {
      built: [],
      absent: kinds.map((kind) => ({ kind, reason: "no-expiry-at-horizon" })),
      target,
    };
  }

  const contracts = chain.filter((c) => c.daysToExpiry === daysToExpiry);
  const step = listedStrikeStep(contracts) ?? 0;
  const frame: AnchorFrame = {
    spot: context.spot,
    target,
    hold: BOUNDARY_SIGMAS[outlook.magnitude] * move,
    wing: Math.max(step, HALF_MOVE_WING * move),
    step,
  };
  const built: BuiltCandidate[] = [];
  const absent: AbsentCandidate[] = [];
  for (const kind of kinds) {
    const candidate = buildCandidate(kind, frame, contracts, daysToExpiry);
    if ("legs" in candidate) built.push(candidate);
    else absent.push(candidate);
  }
  return { built, absent, target };
}
