import type { FeedbackLogEntry } from "../server/feedback-log.js";
import type { FeedbackStatus } from "../server/feedback-status.js";
import {
  type ActivityEvent,
  activityEventFromFeedbackEntry,
  activityEventFromFeedbackStatus,
  forVisibility,
} from "./activity-event.js";

/**
 * FEEDBACK EVENTS → PULSE ROWS — `trade-event-feed.ts`'s twin for the second kind on the bus
 * (#784 slice 2). Same split: `activity-event.ts` owns the write direction (a filing, an observed
 * status change) and this file owns the inverse — given events, what has the league filed and
 * where did it land?
 *
 * That the two kinds decode in separate files with the same shape is the point of the slice. Before
 * this, Activity's pulse was a `FeedbackLogEntry[]` joined against a `Map<number, FeedbackStatus>`
 * fetched from GitHub in the same request — a second data model sharing a screen with the trade
 * feed (Eric, 2026-09-06: trades and feedback "have no fundamental overlap"). Now both kinds are
 * `ActivityEvent`s, and status is a facet folded out of the envelope rather than a bespoke pill.
 *
 * Two facts this decoder lives with, both inherited from the trade half:
 *
 * - **`payload` is `Record<string, unknown>` by design**, so every field is narrowed here. A line
 *   that cannot yield an issue number, a title and a URL is dropped — the row would be unclickable
 *   and unidentifiable, which is worse than one fewer row.
 * - **A filing accumulates events over its life** (filed, then each observed status change), the
 *   same append-only shape `collapseTradeEvents` folds. `collapseFeedbackEvents` folds on
 *   `target.id` — the issue number, the filing's own identity — never on `correlationId`, for the
 *   reason spelled out in `trade-event-feed.ts`'s header: identity, not grouping, is what a
 *   per-thing fold keys on.
 */

/** Only the public tier reaches the cross-member pulse — the same gate the trade feed applies, and
 *  belt-and-braces beside the event-type checks below. */
const PUBLIC_ONLY = forVisibility(["public"]);

/** One filing as the pulse needs it. `status` is OPTIONAL and stays absent when nothing has
 *  observed one: a filing nobody has polled is honestly "state unknown", never "In the queue"
 *  asserted on its behalf. That matches what the page did before this slice, where a failed or
 *  uncached GitHub read simply left the row without a badge. */
export interface FeedbackFeedItem {
  readonly issueNumber: number;
  /** The filer's pseudonymous id (`feedback-attribution.ts`) — carried because the envelope knows
   *  it; the pulse does not render it, and the attribution ruling says nothing finer exists. */
  readonly filerId: string;
  /** Absent when the payload's kind is not one this app files — the view badges a generic icon
   *  rather than dropping a real filing off the league's record. */
  readonly kind?: FeedbackLogEntry["kind"];
  readonly title: string;
  readonly url: string;
  readonly filedAt: string;
  readonly status?: FeedbackStatus;
}

const FEEDBACK_KINDS: ReadonlySet<string> = new Set(["bug", "feature", "idea"]);

const FEEDBACK_STATUSES: ReadonlySet<string> = new Set([
  "open",
  "needs-info",
  "needs-eric",
  "next-slice",
  "shipped",
  "not-built",
]);

function issueNumberOf(event: ActivityEvent): number | undefined {
  if (event.target.kind !== "feedback") return undefined;
  const parsed = Number(event.target.id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

/** One event → one filing, or null when the event is not a public filing or its payload cannot
 *  honestly yield one. Null is the common, expected answer on a mixed bus — a trade fill, a status
 *  observation, an owner-only line — not an error. */
export function feedbackFilingFromEvent(event: ActivityEvent): FeedbackFeedItem | null {
  if (!(event.eventType === "feedback.filed" && PUBLIC_ONLY(event))) return null;
  const issueNumber = issueNumberOf(event);
  if (issueNumber === undefined) return null;
  const { title, url, kind } = event.payload;
  if (typeof title !== "string" || !title) return null;
  if (typeof url !== "string" || !url) return null;
  return {
    issueNumber,
    filerId: event.actor.participantId,
    ...(typeof kind === "string" && FEEDBACK_KINDS.has(kind)
      ? { kind: kind as FeedbackLogEntry["kind"] }
      : {}),
    title,
    url,
    filedAt: event.at,
  };
}

/** One event → one observed status, or null. Split from the filing decoder because the two answer
 *  different questions off the same chain, and `publishingFeedbackStatuses` needs the status half
 *  on its own to know what it last published. */
export function feedbackStatusFromEvent(
  event: ActivityEvent,
): { readonly issueNumber: number; readonly status: FeedbackStatus; readonly at: string } | null {
  if (!(event.eventType === "feedback.status-changed" && PUBLIC_ONLY(event))) return null;
  const issueNumber = issueNumberOf(event);
  if (issueNumber === undefined) return null;
  const { status } = event.payload;
  if (typeof status !== "string" || !FEEDBACK_STATUSES.has(status)) return null;
  return { issueNumber, status: status as FeedbackStatus, at: event.at };
}

/**
 * The latest observed status per filing — the fold's status half, exported because
 * `publishingFeedbackStatuses` seeds its "what did I last publish?" memory from exactly this. A
 * later `at` wins, and a later line in the input breaks a tie (so a backfilled observation never
 * regresses a live-captured one), the same rule `collapseTradeEvents` uses.
 */
export function latestStatusByIssue(events: readonly ActivityEvent[]): Map<number, FeedbackStatus> {
  const latest = new Map<number, { readonly status: FeedbackStatus; readonly at: string }>();
  for (const event of events) {
    const observed = feedbackStatusFromEvent(event);
    if (!observed) continue;
    const held = latest.get(observed.issueNumber);
    if (!held || observed.at >= held.at) {
      latest.set(observed.issueNumber, { status: observed.status, at: observed.at });
    }
  }
  return new Map([...latest].map(([issueNumber, { status }]) => [issueNumber, status]));
}

/**
 * Fold a mixed event list into one row per filing, newest filing first — the pulse's exact
 * previous ordering (`wire-json-view.ts` sorted on `filedAt` descending), now derived from
 * envelopes. A status observation alone never produces a row: without the filed event there is no
 * title and no URL, so the row could not say what it is about.
 *
 * Non-feedback and unparseable events are dropped by the two decoders above, so a caller can hand
 * this the whole bus.
 */
export function collapseFeedbackEvents(events: readonly ActivityEvent[]): FeedbackFeedItem[] {
  const filings = new Map<number, FeedbackFeedItem>();
  for (const event of events) {
    const filing = feedbackFilingFromEvent(event);
    if (!filing) continue;
    const held = filings.get(filing.issueNumber);
    // A filing is published once; a duplicate means the same issue reached the bus twice (the
    // log bridge below, a replayed backfill). The later line wins, matching the trade fold.
    if (!held || filing.filedAt >= held.filedAt) filings.set(filing.issueNumber, filing);
  }
  const statuses = latestStatusByIssue(events);
  return [...filings.values()]
    .map((filing) => {
      const status = statuses.get(filing.issueNumber);
      return status ? { ...filing, status } : filing;
    })
    .sort((a, b) => b.filedAt.localeCompare(a.filedAt));
}

/**
 * THE BRIDGE WHILE THE BUS IS YOUNGER THAN THE LOG — `mergeLedgerIntoEvents`'s exact twin, for the
 * same reason stated at length in its header: the event log only starts when this slice deploys,
 * and every filing a member made before that lives on the feedback log and nowhere else. Reading
 * the bus alone would drop real filings off the league's record, and a filing that vanishes from
 * Activity is precisely this slice's own falsifier.
 *
 * The union cannot double-count: `activityEventFromFeedbackEntry` derives the event id
 * deterministically from the log entry, so an entry already published arrives with byte-identical
 * identity and is deduplicated on it. The leg retires once the bus is confirmed to hold the log's
 * full history — not before.
 */
export function mergeFeedbackLogIntoEvents(
  events: readonly ActivityEvent[],
  entries: readonly FeedbackLogEntry[],
): ActivityEvent[] {
  const merged = [...events];
  const seen = new Set(events.map((e) => e.id));
  for (const entry of entries) {
    const event = activityEventFromFeedbackEntry(entry);
    if (seen.has(event.id)) continue;
    seen.add(event.id);
    merged.push(event);
  }
  return merged;
}

/**
 * Fold a just-polled set of statuses in on the same schema, so a render is never one request
 * behind its own emitter. `publishingFeedbackStatuses` writes a transition to the bus during this
 * request — after the `list()` that produced `events` already returned — so without this the newly
 * observed status would first appear on the NEXT page load. The observation carries `at`, which is
 * later than anything on the bus, so the fold's latest-wins rule lands on the live state.
 *
 * Deliberately not deduplicated against the bus: an observation that merely confirms what the bus
 * already holds folds to the same status either way, and keeping the merge dumb keeps the one
 * rule — latest observation wins — in a single place.
 */
export function mergeFeedbackStatusesIntoEvents(
  events: readonly ActivityEvent[],
  statuses: ReadonlyMap<number, FeedbackStatus>,
  at: string,
): ActivityEvent[] {
  const merged = [...events];
  for (const [issueNumber, status] of statuses) {
    merged.push(activityEventFromFeedbackStatus(issueNumber, status, at));
  }
  return merged;
}
