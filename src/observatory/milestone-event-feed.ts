import { type MilestoneCard, milestoneCard } from "../domain/milestone-catalog.js";
import { deriveEarned } from "../domain/progression.js";
import type { LadderProgressEntry } from "../server/ladder-progress-log.js";
import type { OrderAuditRecord } from "../server/order-audit-log.js";
import {
  type ActivityEvent,
  activityEventFromEarnedMilestone,
  activityEventFromLadderEntry,
  forVisibility,
} from "./activity-event.js";
import { collapseActivity, type TradeActivityRecord } from "./activity-store.js";
import type { ParticipantSnapshot } from "./participant-snapshot.js";

/**
 * MILESTONE EVENTS → FEED ROWS — the fourth sibling of `trade-event-feed.ts`,
 * `feedback-event-feed.ts` and `development-event-feed.ts`, for #784's last kind (slice 5): given
 * envelopes, who in the league earned what?
 *
 * Two sources reach the same decoder, matching the two regimes `activity-event.ts` describes:
 *
 * - **Logged earns** arrive off the bus (published by `publishingLadderProgressLog`) unioned with the
 *   ladder progress log itself, by `mergeLadderLogIntoEvents` — the bridge slices 1 and 2 built, for
 *   the same reason: the log predates its publisher, and the bus alone would drop every earn logged
 *   before this deploy.
 * - **Derived earns** are synthesized here, at read time, by `deriveMilestoneEvents` — the same
 *   `deriveEarned` over the same two ledgers the Learn page reads (`progression-service.ts`), so a
 *   feed row exists exactly when the member's own ladder says the rung is earned. Nothing is written.
 *
 * THE HONESTY RULE THIS KIND HAS TO KEEP (#784's criterion; progression's own rule — "proof is a
 * fill, never a claim"): no row for a milestone that was not earned. Both sources carry the order
 * that proved the earn, and neither has a path from a client request to an event, so the rule holds
 * by construction rather than by a filter someone could forget.
 */

const PUBLIC_ONLY = forVisibility(["public"]);

/** One earn as the feed needs it — who, which milestone, the order that proved it, and when. */
export interface MilestoneFeedItem {
  readonly participantId: string;
  readonly milestoneId: string;
  readonly orderId: string;
  readonly at: string;
}

/** A decoded earn with the words a reader sees: a member's name and the milestone's title. */
export interface MemberMilestone extends MilestoneFeedItem, MilestoneCard {
  readonly participantName: string;
}

/**
 * One event → one earn, or null when the event is not a public milestone or its payload cannot
 * honestly yield one. Null is the normal answer on a mixed bus, never an error.
 */
export function milestoneFromEvent(event: ActivityEvent): MilestoneFeedItem | null {
  if (!(event.eventType === "milestone.earned" && PUBLIC_ONLY(event))) return null;
  if (event.target.kind !== "milestone") return null;
  const participantId = event.actor.participantId;
  const { milestoneId, orderId } = event.payload;
  if (!participantId) return null;
  if (typeof milestoneId !== "string" || !milestoneId) return null;
  // An earn with no evidence is a claim, and a claim is exactly what this kind may never render.
  if (typeof orderId !== "string" || !orderId) return null;
  return { participantId, milestoneId, orderId, at: event.at };
}

/**
 * Fold a mixed event list into one row per (participant, milestone), newest earn first. The EARLIEST
 * instant wins a duplicate — a detector that re-logged a milestone, or a backfilled earlier fill,
 * must never move an earn later than it happened (`earliestPerMilestone`, `deriveEarned`: same rule).
 */
export function collapseMilestoneEvents(events: readonly ActivityEvent[]): MilestoneFeedItem[] {
  const byEarn = new Map<string, MilestoneFeedItem>();
  for (const event of events) {
    const earn = milestoneFromEvent(event);
    if (!earn) continue;
    const key = `${earn.participantId}:${earn.milestoneId}`;
    const held = byEarn.get(key);
    if (!held || earn.at < held.at) byEarn.set(key, earn);
  }
  return [...byEarn.values()].sort((a, b) => b.at.localeCompare(a.at));
}

/**
 * THE BRIDGE WHILE THE BUS IS YOUNGER THAN THE LOG — `mergeLedgerIntoEvents`'s twin for the ladder
 * progress log. Deliberately NOT deduplicated on event id, unlike the trade bridge: a milestone's id
 * carries no instant, so an id-based skip could keep a re-logged LATER line off the bus and drop the
 * log's earlier one. The fold above keeps the earliest per earn, so a plain union is already exact.
 */
export function mergeLadderLogIntoEvents(
  events: readonly ActivityEvent[],
  entries: readonly LadderProgressEntry[],
): ActivityEvent[] {
  return [...events, ...entries.map(activityEventFromLadderEntry)];
}

function byParticipant<T extends { readonly participantId: string }>(
  rows: readonly T[],
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    const held = grouped.get(row.participantId);
    if (held) held.push(row);
    else grouped.set(row.participantId, [row]);
  }
  return grouped;
}

/**
 * The trade ladder's earns, synthesized at read time from the two ledgers `deriveEarned` reads on
 * the Learn page — per participant, because a fill only proves a rung for whoever filled it. An
 * untagged option fill (pre-tag history, a bot's) earns nothing here exactly as it earns nothing
 * there, so the feed and the ladder cannot disagree about who has done what.
 */
export function deriveMilestoneEvents(
  records: readonly TradeActivityRecord[],
  tags: readonly OrderAuditRecord[],
): ActivityEvent[] {
  const tagsByParticipant = byParticipant(tags);
  return [...byParticipant(records)].flatMap(([participantId, journal]) =>
    deriveEarned(collapseActivity(journal), tagsByParticipant.get(participantId) ?? []).map(
      (earned) => activityEventFromEarnedMilestone(participantId, earned),
    ),
  );
}

/**
 * Keep the earns the league-wide feed can honestly say: a MEMBER's (the ladder is a member's
 * curriculum — a bot's first buy is a strategy firing, not a lesson learned), on the current roster
 * (a row must name who earned it, and an id with no roster entry has no name to give), for a
 * milestone this app can title (a bare id is not a title). Order is preserved.
 */
export function toMemberMilestones(
  items: readonly MilestoneFeedItem[],
  participants: readonly ParticipantSnapshot[],
): MemberMilestone[] {
  const members = new Map(
    participants.filter((p) => p.kind === "human").map((p) => [p.id, p.displayName]),
  );
  return items.flatMap((item) => {
    const participantName = members.get(item.participantId);
    const card = milestoneCard(item.milestoneId);
    return participantName && card ? [{ ...item, ...card, participantName }] : [];
  });
}
