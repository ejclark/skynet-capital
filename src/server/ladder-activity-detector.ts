import type { ActivityStore, TradeActivityRecord } from "../observatory/activity-record.js";
import { collapseActivity } from "../observatory/activity-store.js";
import { fillsFrom } from "../observatory/desk-data.js";
import { LIFECYCLE_STATUS } from "../trading/option-lifecycle.js";
import { matchRoundTrips, type RoundTrip } from "../trading/round-trips.js";
import {
  earliestPerMilestone,
  type LadderProgressEntry,
  type LadderProgressLogStore,
  ladderProgressEntry,
} from "./ladder-progress-log.js";

/**
 * THE LADDER AUTO-COMPLETION DETECTOR (#469 slice 3) — the writer the ladder progress log
 * (slice 2, `ladder-progress-log.ts`) was built ahead of. Turns real account activity into the two
 * milestones nothing else in this repo can prove from a fill alone (per the log's own module doc
 * and PR #880's design notes):
 *
 *  - an OTM expiry (`OPEXP` on the durable activity ledger) — a contract expired worthless, a fact
 *    Alpaca reports outside the normal fill flow (`option-lifecycle.ts`);
 *  - a first realized profit — the first FIFO-matched round trip (`round-trips.ts`) that closes
 *    green, which needs lot matching over the whole history to see at all.
 *
 * **Deliberately does NOT touch the four trade-ladder milestones (first buy/sell/CSP/CC).** Those
 * are the 101/102/201/202 `TradeTypeCode` milestones `domain/progression.ts` already derives fresh
 * from the fill + audit ledgers on every read — "never stored" is the honesty invariant Eric ruled
 * on 2026-08-25, and slice 2's own PR (#880) documents this store as the sibling structure for the
 * milestones that invariant doesn't (and shouldn't) cover. Logging them here too would give the
 * ticket gate two sources of truth for the same fact, which is exactly the drift that invariant
 * exists to prevent. Nothing here reads or writes `progression.ts`/`curriculum.ts`.
 *
 * Never self-marked: every entry this detector logs carries the real order id of the activity that
 * proved it (`LadderProgressEvidence`) — there is no path from a client request to a written row.
 */

/** The two milestone ids this detector owns. Not in `curriculum.ts` yet — outcome milestones return
 *  there once #468's short-lot matching is a first-class citizen; the log doesn't validate
 *  `milestoneId` against a catalog (see `ladder-progress-log.ts`), so minting them here is safe and
 *  matches the naming style of the milestones curriculum.ts already has (`first-buy`, `first-sell`). */
export const FIRST_OTM_EXPIRY_MILESTONE = "first-otm-expiry";
export const FIRST_REALIZED_PROFIT_MILESTONE = "first-realized-profit";

/** One completion this detector found in a participant's activity, ready to become a log entry. */
export interface LadderDetection {
  readonly milestoneId: string;
  readonly evidence: LadderProgressEntry["evidence"];
  /** The evidence's own timestamp (when the expiry/close happened), not "now". */
  readonly at: string;
}

/** `round-trips.ts` is broker-shape-free by design and a `RoundTrip` carries no order id — so the
 *  closing order is recovered here, by the ledger key a fill and the trip it closes always share:
 *  same symbol, same instant (`tripFrom` sets `closedAt` to the closing fill's own `at`). Keeps
 *  that module's boundary intact instead of threading an app-specific id through its pure math. */
function closingOrderId(
  collapsed: readonly TradeActivityRecord[],
  trip: RoundTrip,
): string | undefined {
  return collapsed.find((r) => r.symbol === trip.symbol && r.at === trip.closedAt)?.orderId;
}

/**
 * Pure detection over one participant's activity ledger, given the milestone ids already logged
 * for them. I/O-free by design (no store, no clock) so the whole detection surface is specced
 * against plain fixtures — the store-touching wiring (`detectAndRecordLadderProgress`) is a thin
 * shell around this.
 */
export function detectLadderProgress(
  records: readonly TradeActivityRecord[],
  alreadyLogged: ReadonlySet<string>,
): readonly LadderDetection[] {
  const collapsed = collapseActivity(records);
  const detections: LadderDetection[] = [];

  if (!alreadyLogged.has(FIRST_OTM_EXPIRY_MILESTONE)) {
    const expiries = collapsed
      .filter((r) => r.status === LIFECYCLE_STATUS.OPEXP)
      .sort((a, b) => a.at.localeCompare(b.at));
    const first = expiries[0];
    if (first) {
      detections.push({
        milestoneId: FIRST_OTM_EXPIRY_MILESTONE,
        evidence: { kind: "otm-expiry", orderId: first.orderId },
        at: first.at,
      });
    }
  }

  if (!alreadyLogged.has(FIRST_REALIZED_PROFIT_MILESTONE)) {
    // `matchRoundTrips` already returns trips sorted oldest-closed-first.
    const { trips } = matchRoundTrips(fillsFrom(collapsed));
    for (const trip of trips) {
      if (trip.realized <= 0) continue;
      const orderId = closingOrderId(collapsed, trip);
      if (!orderId) continue;
      detections.push({
        milestoneId: FIRST_REALIZED_PROFIT_MILESTONE,
        evidence: { kind: "realized-profit", orderId },
        at: trip.closedAt,
      });
      break;
    }
  }

  return detections;
}

/**
 * The wiring shell: read a participant's activity + already-logged milestones, detect, and record
 * anything new. Safe to call as often as activity arrives — re-running finds nothing new once a
 * milestone is logged, and a race between two concurrent calls is resolved read-side
 * (`earliestPerMilestone`, exactly as `ladder-progress-log.ts`'s own doc describes), never by a
 * write-time lock this store was deliberately built without.
 */
export async function detectAndRecordLadderProgress(
  progressStore: LadderProgressLogStore,
  activityStore: ActivityStore,
  participantId: string,
): Promise<readonly LadderProgressEntry[]> {
  const [records, logged] = await Promise.all([
    activityStore.list(participantId),
    progressStore.list(participantId),
  ]);
  const alreadyLogged = new Set(earliestPerMilestone(logged).keys());
  const detections = detectLadderProgress(records, alreadyLogged);
  const recorded: LadderProgressEntry[] = [];
  for (const detection of detections) {
    const entry = ladderProgressEntry(
      participantId,
      detection.milestoneId,
      detection.evidence,
      detection.at,
    );
    await progressStore.record(entry);
    recorded.push(entry);
  }
  return recorded;
}
