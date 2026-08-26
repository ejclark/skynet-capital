import type { OptionType } from "../trading/option-symbols.js";

/**
 * UNUSUAL OPTIONS ACTIVITY — traded VOLUME measured against OPEN INTEREST.
 *
 * The classic flow screen, and the one no researched platform bakes in at the base tier
 * (thinkorswim needs a custom thinkScript scanner; IBKR doesn't surface it at all). Open interest
 * is how many contracts were already open when the session started; volume is how many changed
 * hands today. Volume far above open interest means today's tape is *new* positioning rather than
 * existing holders shuffling — the tell a desk watches for.
 *
 * WHAT THIS IS NOT. A high ratio is not a direction, not a trade, and not a claim that anyone
 * "smart" is buying. Prints carry no side: a 5× ratio is equally consistent with a fund opening a
 * hedge and with a market maker's own flow. Everything here is a flag on a contract, worth a
 * *look*; the judgment layer still tells the truth about the bet.
 *
 * PURE BY CONSTRUCTION. No I/O, no clock (`atIso` is passed in), no delivery. Reading the numbers
 * off a feed is `adapters/alpaca-options-flow.ts`'s job; sending an alert about a flag belongs to
 * the alert substrate. This module only decides.
 *
 * ABSENCE RENDERS AS ABSENT. Both inputs are optional because both are genuinely missing
 * sometimes — Alpaca's snapshot feed carries volume but no open interest, the contracts endpoint
 * carries open interest but no volume, and either can be null on a thin listing. A missing number
 * yields `indeterminate`, never a zero that would read as "nothing traded" or "nothing open". A
 * zero ratio and an unknown ratio are different facts and this module keeps them different.
 */

/**
 * One contract's session flow — the (volume, openInterest) pair the signal reads, plus enough
 * identity to name the contract in a flag.
 */
export interface ContractFlow {
  readonly occSymbol: string;
  readonly underlying: string;
  /** ISO date, `YYYY-MM-DD`. */
  readonly expiration: string;
  readonly strike: number;
  readonly type: OptionType;
  /** Contracts traded this session. ABSENT when the feed did not report it. */
  readonly volume?: number;
  /** Contracts open at the session's start. ABSENT when the feed did not report it. */
  readonly openInterest?: number;
}

/** The two dials the screen exposes. Both are deliberately callers' business, not constants. */
export interface UnusualFlowThresholds {
  /** Volume ÷ open interest at or above this flags the contract. */
  readonly minRatio: number;
  /** Contracts traded below this never flag, whatever the ratio. */
  readonly minVolume: number;
}

/**
 * The starting dials — DEFENSIBLE, NOT TUNED. `minRatio: 2` is the common desk convention (volume
 * at twice the open book is more than position churn); `minVolume: 250` is a liquidity floor that
 * stops a 3-lot on an empty strike from screaming. Neither has been fitted against this app's real
 * chains yet — they want a first pass against live Alpaca data before anyone treats a flag count
 * as meaningful. Named constants precisely so that pass is one edit in one place.
 */
export const DEFAULT_UNUSUAL_FLOW_THRESHOLDS: UnusualFlowThresholds = {
  minRatio: 2,
  minVolume: 250,
};

/** Judged unusual, judged ordinary, or not judged at all — the third is not a synonym for the second. */
type FlowVerdict = "unusual" | "ordinary" | "indeterminate";

/**
 * Why the verdict came out the way it did — a code, so a renderer never has to parse prose.
 * Reachable from the public surface as `FlowAssessment["reason"]` / `UnusualFlowFlag["reason"]`
 * rather than exported separately, so there is one name for it and no second one to drift.
 */
type FlowReason =
  | "volume-over-open-interest"
  | "no-open-interest"
  | "below-volume-floor"
  | "ratio-below-threshold"
  | "volume-unreported"
  | "open-interest-unreported";

export interface FlowAssessment {
  readonly verdict: FlowVerdict;
  readonly reason: FlowReason;
  /**
   * volume ÷ open interest. ABSENT when open interest is zero or unreported — never `Infinity`,
   * never a stand-in 0. A contract with no open book has no ratio; it has a story instead.
   */
  readonly ratio?: number;
}

/** A number a feed actually reported: finite and non-negative. Anything else is "unreported". */
const reported = (value: number | undefined): value is number =>
  value !== undefined && Number.isFinite(value) && value >= 0;

/**
 * The whole signal, on one (volume, openInterest) pair. Order matters: the volume floor is checked
 * before the zero-open-interest case, so a brand-new strike with a handful of lots stays ordinary
 * instead of flagging on a technicality.
 */
export function assessFlow(
  volume: number | undefined,
  openInterest: number | undefined,
  thresholds: UnusualFlowThresholds = DEFAULT_UNUSUAL_FLOW_THRESHOLDS,
): FlowAssessment {
  if (!reported(volume)) return { verdict: "indeterminate", reason: "volume-unreported" };
  if (!reported(openInterest)) {
    return { verdict: "indeterminate", reason: "open-interest-unreported" };
  }
  if (volume < thresholds.minVolume) {
    return { verdict: "ordinary", reason: "below-volume-floor" };
  }
  if (openInterest === 0) {
    // Real volume on a strike nobody held: the loudest shape this screen finds, and the one with
    // no ratio to quote. Reported as its own reason rather than dressed as a huge number.
    return { verdict: "unusual", reason: "no-open-interest" };
  }
  const ratio = volume / openInterest;
  return ratio >= thresholds.minRatio
    ? { verdict: "unusual", reason: "volume-over-open-interest", ratio }
    : { verdict: "ordinary", reason: "ratio-below-threshold", ratio };
}

/** One flagged contract, carrying the numbers that flagged it so nobody has to trust the verdict. */
export interface UnusualFlowFlag {
  readonly occSymbol: string;
  readonly expiration: string;
  readonly strike: number;
  readonly type: OptionType;
  readonly volume: number;
  readonly openInterest: number;
  readonly reason: FlowReason;
  /** Absent exactly when `reason` is `no-open-interest`. */
  readonly ratio?: number;
}

/**
 * One scan of one underlying — the append-only record this instrument writes.
 *
 * A scan is recorded whether or not it found anything: `flags: []` with a real `contractsScanned`
 * is the explicit "looked, found nothing" line the no-silent-truncation doctrine asks for. Silence
 * in the ledger means the scan never ran, and that must stay distinguishable from a quiet tape.
 */
export interface UnusualFlowScan {
  readonly at: string;
  readonly underlying: string;
  readonly thresholds: UnusualFlowThresholds;
  /** Contracts the scan looked at. */
  readonly contractsScanned: number;
  /** Contracts it could actually judge (both numbers reported). */
  readonly contractsJudged: number;
  /** Contracts it could not judge, because a feed withheld a number. Never folded into "ordinary". */
  readonly indeterminate: number;
  readonly flags: readonly UnusualFlowFlag[];
}

/**
 * Rank flags loudest-first: by ratio where there is one, then the ratio-less
 * `no-open-interest` flags by volume. Deliberately NOT one merged ordering — sorting a missing
 * ratio as infinity would rank a 250-lot on an empty strike above a 40× print, on a number nobody
 * measured.
 */
function loudestFirst(flags: readonly UnusualFlowFlag[]): UnusualFlowFlag[] {
  const rated = flags.filter((f) => f.ratio !== undefined);
  const unrated = flags.filter((f) => f.ratio === undefined);
  rated.sort((a, b) => (b.ratio ?? 0) - (a.ratio ?? 0) || b.volume - a.volume);
  unrated.sort((a, b) => b.volume - a.volume);
  return [...rated, ...unrated];
}

/**
 * Screen one underlying's contracts and return the scan record — flags plus the census that makes
 * an empty result readable ("scanned 412, judged 388, flagged 0" is a finding; "" is not).
 */
export function detectUnusualFlow(
  underlying: string,
  flows: readonly ContractFlow[],
  atIso: string,
  thresholds: UnusualFlowThresholds = DEFAULT_UNUSUAL_FLOW_THRESHOLDS,
): UnusualFlowScan {
  const flags: UnusualFlowFlag[] = [];
  let indeterminate = 0;
  for (const flow of flows) {
    const assessment = assessFlow(flow.volume, flow.openInterest, thresholds);
    if (assessment.verdict === "indeterminate") {
      indeterminate += 1;
      continue;
    }
    if (assessment.verdict !== "unusual") continue;
    flags.push({
      occSymbol: flow.occSymbol,
      expiration: flow.expiration,
      strike: flow.strike,
      type: flow.type,
      // Both are reported here — `unusual` is unreachable otherwise.
      volume: flow.volume as number,
      openInterest: flow.openInterest as number,
      reason: assessment.reason,
      ...(assessment.ratio === undefined ? {} : { ratio: assessment.ratio }),
    });
  }
  return {
    at: atIso,
    underlying,
    thresholds,
    contractsScanned: flows.length,
    contractsJudged: flows.length - indeterminate,
    indeterminate,
    flags: loudestFirst(flags),
  };
}
