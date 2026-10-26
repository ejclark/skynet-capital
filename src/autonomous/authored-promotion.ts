import type { ShadowReportEntry } from "./authored-shadow-wire.js";

/**
 * WHAT "THE SHADOW TEST PASSED" MEANS (#5457 slice 3) — the promotion bar, as one pure function over
 * the report a shadow-test row already carries. Nothing here reads a clock, a store or the market.
 *
 * A pass says the play does what its author wrote, inside the limits, on the real tape. It is NOT
 * the house research bar: a promoted play keeps the label "no research citation, unvalidated", and
 * there is deliberately no P/L minimum (one round trip is a sample of one).
 *
 *   S  — at least 10 sessions observed on the author's own bot (about one pre-print window).
 *   R  — at least 1 closed would-be round trip (a play that never opened has shown nothing).
 *   Z  — exactly 0 guard refusals (a refusal means the live play would not have traded as written).
 *
 * Held as a proposal with dated falsifiers (2026-12-15): of the first 5 promoted, any live first
 * order differing from the shadow's by side, day or more than one share; fewer than 3 of the first 10
 * started tests passing within 30 days (then S drops to 5); a promoted play's first live order refused
 * by a guard the test never hit. Change the numbers here and nowhere else.
 */
export const PROMOTION_BAR = {
  /** Sessions a pass must have run on the author's own bot. */
  sessions: 10,
  /** Closed would-be round trips. */
  roundTrips: 1,
  /** Guard refusals allowed. */
  refusals: 0,
} as const;

export type PromotionCheckId = "sessions" | "round-trips" | "refusals";

export interface PromotionCheck {
  readonly id: PromotionCheckId;
  readonly met: boolean;
  /** Where the test stands, in the member's words: "6 of 10 sessions watched". */
  readonly progress: string;
}

export interface PromotionVerdict {
  readonly passes: boolean;
  readonly checks: readonly PromotionCheck[];
  /** The first unmet check as a sentence, or undefined when the test passed. */
  readonly blocker?: string;
}

const wordFor = (n: number, one: string, many: string): string => (n === 1 ? one : many);

function sentenceFor(id: PromotionCheckId, sessions: number, refused: number): string {
  switch (id) {
    case "sessions": {
      const left = PROMOTION_BAR.sessions - sessions;
      return `${left} more ${wordFor(left, "session", "sessions")} to watch before it can trade.`;
    }
    case "round-trips":
      return "It hasn't bought and sold yet, so the test has shown nothing to trust.";
    case "refusals":
      return `A guard refused it ${refused} ${wordFor(refused, "time", "times")}, so the live play would not have traded as written.`;
  }
}

/**
 * The verdict on one test's report. No report yet (the bots have not reported on THIS test) reads as
 * zero sessions, never as a pass; an `invalid` play (it no longer clears the model's bounds) never
 * passes whatever it counted.
 */
export function promotionVerdict(entry: ShadowReportEntry | undefined): PromotionVerdict {
  const sessions = entry?.sessions ?? 0;
  const roundTrips = entry?.roundTrips ?? 0;
  const refused = entry?.refused ?? 0;
  const checks: PromotionCheck[] = [
    {
      id: "sessions",
      met: sessions >= PROMOTION_BAR.sessions,
      progress: `${Math.min(sessions, PROMOTION_BAR.sessions)} of ${PROMOTION_BAR.sessions} sessions watched`,
    },
    {
      id: "round-trips",
      met: roundTrips >= PROMOTION_BAR.roundTrips,
      progress: `${roundTrips} closed ${wordFor(roundTrips, "round trip", "round trips")}, ${PROMOTION_BAR.roundTrips} needed`,
    },
    {
      id: "refusals",
      met: refused <= PROMOTION_BAR.refusals,
      progress:
        refused === 0
          ? "no guard refusals"
          : `${refused} guard ${wordFor(refused, "refusal", "refusals")}, ${PROMOTION_BAR.refusals} allowed`,
    },
  ];
  const unmet = checks.find((c) => !c.met);
  if (entry?.state === "invalid") {
    return {
      passes: false,
      checks,
      blocker: "This play no longer clears the limits, so it can't run.",
    };
  }
  return {
    passes: !unmet,
    checks,
    ...(unmet ? { blocker: sentenceFor(unmet.id, sessions, refused) } : {}),
  };
}
