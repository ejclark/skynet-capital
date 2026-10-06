import type { VolRegimeReading } from "./outlook.js";
import type { CandidateAbsence } from "./structure-candidates.js";
import type { RiskBound, StructureRisk } from "./structure-risk.js";

/**
 * THE WORDS A RANKED LIST IS READ IN (#3407, slice 4 — the outlook-to-structure surface).
 *
 * `recommend.ts` is deliberately strict about absence: a structure it could not build or mark comes
 * back in `absent` with a NAMED machine reason (`"strike-out-of-reach"`, `"missing-iv"`), and a vol
 * regime it could not read comes back as `{ kind: "absent", reason }`. Those names are contracts
 * between modules, not sentences a member can read — and the one thing the plan's criteria forbid is
 * rendering an absent value as a dash or a zero. So the translation lives here, in one total
 * mapping, rather than as a `switch` inside a component where a new reason would silently fall
 * through to "—".
 *
 * Two rules the tables hold:
 *
 * - **Every reason says whose limit it is.** "The chain doesn't list a strike near where that leg
 *   would sit" is a fact about the listing; "we couldn't solve an implied volatility from its
 *   premium" is a fact about our own read. A member who can tell those apart knows whether to try
 *   another expiry or ignore the row.
 * - **Nothing here says what to do.** Same settled posture as `candidate-mechanics.ts`: these are
 *   descriptions of why a row is missing, never a nudge toward the rows that are present.
 *
 * PURE: no I/O, no clock, no locale lookup.
 */

/** Why a candidate has no honest ranking, in a member's words. Total over `CandidateAbsence`. */
const ABSENCE_WORDS: Readonly<Record<CandidateAbsence, string>> = {
  "no-expected-move": "we couldn't describe an expected move for this view",
  "no-expiry-at-horizon": "no listed expiry reaches your horizon",
  "missing-strike": "that expiry doesn't list a strike this structure needs",
  "strikes-collapsed": "two of its legs land on the same listed strike, so it has no width",
  "strike-out-of-reach": "the nearest listed strike is nowhere near where that leg would sit",
  "missing-quote": "one of its contracts has no two-sided quote to open at",
  "missing-iv": "we couldn't solve an implied volatility from one contract's premium",
  "not-scoreable": "the payoff model couldn't mark it at your horizon",
};

/**
 * The reason a structure isn't on the list — always a reason, never a blank. The fallback is not
 * defensive clutter: this runs on a value that arrived over the wire, so a reason added to the
 * engine and shipped before a client reload would otherwise render as an empty string after the
 * dash — exactly the blank this module exists to prevent.
 */
export function absenceWords(reason: CandidateAbsence): string {
  return (
    ABSENCE_WORDS[reason] ??
    "the engine couldn't rank it, and gave a reason this app doesn't know yet"
  );
}

/** Why no IV rank could be read. Total over `VolRegimeAbsence` (`IvAbsence` + this app's own). */
const REGIME_ABSENCE_WORDS: Readonly<Record<string, string>> = {
  "no-iv-history": "no IV history is recorded for this name yet",
  "short-history": "its IV history doesn't reach back a full year",
  "gapped-history": "its IV history has a gap too wide to rank against",
  "flat-range": "its IV hasn't moved, so there's no range to rank inside",
};

/**
 * Whether premium is rich, middling or cheap for this name — or the named reason that can't be
 * read. Stated as a sentence either way, because "—" beside a vol-fit score would read as a
 * measured neutral rather than as an unmeasured axis (the scorer drops the term; it never defaults
 * it, see `candidate-score.ts`'s `VolFit`).
 */
export function volRegimeWords(reading: VolRegimeReading): string {
  if (reading.kind === "regime") {
    return `Premium is ${reading.regime} for this name — IV rank ${Math.round(reading.rank)}.`;
  }
  const why = REGIME_ABSENCE_WORDS[reading.reason] ?? "no IV rank could be read";
  return `Premium can't be called rich or cheap here — ${why}.`;
}

/**
 * WHY A RATIO IS ABSENT — read off BOTH bounds the scorer read, never inferred from one of them.
 *
 * `candidate-score.ts` drops each ratio for more than one reason. `targetReturn` goes when there is
 * no capital at risk to divide by, and that happens two ways: the loss is uncapped (`capitalAtRisk`
 * absent) or the structure cannot lose at all (`capitalAtRisk === 0` — a credit at least as wide as
 * the spread). `rewardToRisk` goes for three: either bound uncapped, or that same zero loss.
 *
 * So "is maxLoss unbounded?" alone prints the OPPOSITE claim on the zero-loss case — "profit has no
 * ceiling" beside a stated ceiling, "no capped loss" beside a stated $0.00. These read both bounds.
 */
export function noRatioWords(risk: StructureRisk): string {
  if (risk.maxLoss.kind === "unbounded") return "loss has no ceiling";
  if (risk.maxProfit.kind === "unbounded") return "profit has no ceiling";
  return "nothing at risk to divide by";
}

/** The same distinction for a return measured against capital at risk. */
export function noDenominatorWords(risk: StructureRisk): string {
  if (risk.maxLoss.kind === "amount" && risk.maxLoss.amount <= 0) {
    return "nothing at risk to measure against";
  }
  return "no capped loss to measure against";
}

/** A dollar bound, or the honest admission there isn't one — never a number standing in for ∞. */
export function boundWords(bound: RiskBound): string {
  if (bound.kind === "unbounded") return "unlimited";
  return `$${bound.amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
