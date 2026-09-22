import type { RoundTrip } from "./round-trips.js";

/**
 * PLAYBOOK WHIPSAW STATS (#3543 slice 1) — the first real reader of `RoundTrip.playbookId`
 * (#885/#1311) for something other than display: a per-playbook rate of fast, losing round-trips,
 * computed only from CLOSED trips this matcher already reconstructed. Never look-ahead — a trip's
 * own eventual close is what makes it eligible to be counted at all, so there is no way for a
 * still-open position to influence its own rate.
 *
 * Deliberately narrow: this module only classifies and counts. It does not read the Playbook
 * Store, does not gate a subscription, and does not touch `src/playbooks/**` — those are #3543
 * slices 2 and 3.
 */

export interface WhipsawThresholds {
  /** A trip closing within this many ms of opening counts as "fast" — one leg of the whipsaw
   *  definition; the other is a negative `realized`. */
  readonly maxHoldMs: number;
  /** Trips needed before a playbook's rate is reported rather than "not yet measured" — guards
   *  against a misleadingly precise rate from one or two trips. */
  readonly minSampleSize: number;
}

/** 15 minutes / 5 trips — first-cut defaults (#3543's open questions: adjustable, not a fork).
 *  15m comfortably exceeds `AutonomousTrader`'s 5-minute per-symbol cooldown, so two ordinary
 *  cooldown-paced trips never register as one fast whipsaw pair by construction. */
export const DEFAULT_WHIPSAW_THRESHOLDS: WhipsawThresholds = {
  maxHoldMs: 15 * 60 * 1000,
  minSampleSize: 5,
};

export interface PlaybookWhipsawStats {
  readonly playbookId: string;
  /** Closed round-trips attributed to this playbook, whipsaw or not. */
  readonly roundTrips: number;
  readonly whipsaws: number;
  /** True once `roundTrips` reaches the threshold's `minSampleSize`. */
  readonly measured: boolean;
  /** `whipsaws / roundTrips` — present only when `measured`, never a rate computed on a sample
   *  too thin to mean anything. */
  readonly whipsawRate?: number;
}

function isWhipsaw(trip: RoundTrip, thresholds: WhipsawThresholds): boolean {
  return trip.realized < 0 && trip.holdMs <= thresholds.maxHoldMs;
}

/**
 * Group closed round-trips by playbook and rate how many were whipsaws. Trips with no
 * `playbookId` (a manual desk order, or a fill predating attribution) contribute to no playbook's
 * stats — silently, the same honesty doctrine `playbookTagsFromOutcomes` uses for an unattributed
 * outcome. Output is sorted by `playbookId` for a stable read, matching `housePlaybooks()`.
 */
export function whipsawStatsByPlaybook(
  trips: readonly RoundTrip[],
  thresholds: WhipsawThresholds = DEFAULT_WHIPSAW_THRESHOLDS,
): readonly PlaybookWhipsawStats[] {
  const byPlaybook = new Map<string, RoundTrip[]>();
  for (const trip of trips) {
    if (!trip.playbookId) continue;
    const forPlaybook = byPlaybook.get(trip.playbookId);
    if (forPlaybook) {
      forPlaybook.push(trip);
    } else {
      byPlaybook.set(trip.playbookId, [trip]);
    }
  }
  return [...byPlaybook.entries()]
    .map(([playbookId, forPlaybook]) => {
      const roundTrips = forPlaybook.length;
      const whipsaws = forPlaybook.filter((trip) => isWhipsaw(trip, thresholds)).length;
      const measured = roundTrips >= thresholds.minSampleSize;
      return {
        playbookId,
        roundTrips,
        whipsaws,
        measured,
        ...(measured ? { whipsawRate: whipsaws / roundTrips } : {}),
      };
    })
    .sort((a, b) => a.playbookId.localeCompare(b.playbookId));
}
