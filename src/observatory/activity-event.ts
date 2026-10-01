import type { FeedbackLogEntry } from "../server/feedback-log.js";
import type { FeedbackStatus } from "../server/feedback-status.js";
import type { OrderAuditRecord } from "../server/order-audit-log.js";
import type { TradeActivityRecord } from "./activity-record.js";

/**
 * THE UNIFIED EVENT ENVELOPE — one shape every activity emitter can publish onto the event bus
 * (`activity-bus.ts`), so a member's self-service view, Moneypenny's context, Eric's triage, and
 * Claude's debugging all read the same schema instead of each ledger inventing its own (#1211).
 *
 * `visibility` gates who a *subscriber* is authorized to receive an event as — not what gets
 * captured. Every event carries as much as its source honestly knows; a narrower audience is a
 * narrower subscription, never a thinner record.
 */
export type ActivityVisibility = "public" | "owner-only" | "admin-only";

/** Did the action this event describes succeed? A ledger line about a *state* (a fill landed, an
 *  order reached a status) is always `"success"` — the record itself is the successful observation;
 *  a failed attempt would be a different event entirely (e.g. `order.rejected`), not this one. */
export type ActivityOutcome = "success" | "failure" | "error";

/** Who acted. `kind`/`email` are omitted rather than guessed when the source record doesn't carry
 *  them — a capsule names what it doesn't know instead of inventing it. */
export interface ActivityActor {
  readonly participantId: string;
  readonly kind?: "human" | "bot" | "system";
  readonly email?: string;
}

/** What the action was about. */
export interface ActivityTarget {
  readonly kind: string;
  readonly id: string;
}

export interface ActivityEvent {
  /** Deterministic from the source record, so translating the same line twice never double-publishes. */
  readonly id: string;
  /** Past-tense, dot-namespaced: `order.filled`, `order.submitted` (docs/research grounding in #1211). */
  readonly eventType: string;
  readonly actor: ActivityActor;
  readonly target: ActivityTarget;
  readonly at: string;
  /** Chains related events on the same underlying thing — an order's id today. */
  readonly correlationId: string;
  /** Provenance of how this event was captured (reuses `ActivitySource`, widened for non-fill sources). */
  readonly source: string;
  readonly outcome: ActivityOutcome;
  readonly visibility: ActivityVisibility;
  /** Event-specific fields a plain-language renderer or a filter facet reads — never redefines the
   *  envelope fields above. */
  readonly payload: Readonly<Record<string, unknown>>;
}

// --- the bus interface --------------------------------------------------------------------------
//
// Defined here, alongside the envelope it carries, rather than in `activity-bus.ts` — so the
// file-backed (`activity-bus.ts`) and in-memory (`in-memory-activity-event-bus.ts`) implementations
// both depend on this shared shape without depending on EACH OTHER. Mirrors `activity-record.ts`
// holding both `TradeActivityRecord` and the `ActivityStore` interface for the same reason.

export type PublishedListener = (event: ActivityEvent) => void;

export interface ActivitySubscription {
  unsubscribe(): void;
}

export interface ActivityEventBus {
  publish(event: ActivityEvent): Promise<void>;
  /** All events (order not guaranteed); one participant's when given. */
  list(participantId?: string): Promise<ActivityEvent[]>;
  /** Live fan-out only — call `list()` first for anything already published. */
  subscribe(listener: PublishedListener): ActivitySubscription;
}

/** Filter a subscriber to the visibility tiers it's authorized for — the mechanism that lets every
 *  event carry as much data as its source knows while a narrower audience gets a narrower feed
 *  (#1211 settled forks). Wrap `subscribe`/`list` results through this rather than trusting a
 *  subscriber to self-filter. */
export function forVisibility(
  tiers: readonly ActivityVisibility[],
): (event: ActivityEvent) => boolean {
  const allowed = new Set(tiers);
  return (event) => allowed.has(event.visibility);
}

/**
 * `order.filled` when the line reflects a completed fill, `order.updated` for every other lifecycle
 * line (new/partially_filled/canceled/…). Deliberately coarse for slice 1 (#1211 slicing sketch:
 * "no new event types yet") — a richer taxonomy is slice 5's job, once non-trading emitters exist to
 * make a bigger vocabulary worth designing.
 */
function tradeEventType(record: TradeActivityRecord): string {
  return record.status === "filled" ? "order.filled" : "order.updated";
}

/** One `TradeActivityRecord` journal line → one bus event. `visibility: "public"` matches today's
 *  `/wire` behavior exactly (cross-member, unredacted) — slice 1 changes the schema, not who sees what. */
export function activityEventFromTradeRecord(record: TradeActivityRecord): ActivityEvent {
  const eventType = tradeEventType(record);
  return {
    id: `${record.orderId}:${eventType}:${record.at}:${record.filledQuantity}`,
    eventType,
    actor: { participantId: record.participantId },
    target: { kind: "order", id: record.orderId },
    at: record.at,
    correlationId: record.orderId,
    source: record.source,
    outcome: "success",
    visibility: "public",
    payload: {
      symbol: record.symbol,
      side: record.side,
      quantity: record.quantity,
      filledQuantity: record.filledQuantity,
      ...(record.price !== undefined ? { price: record.price } : {}),
      status: record.status,
    },
  };
}

/**
 * One `OrderAuditRecord` submission line → one bus event. `visibility: "owner-only"`: who submitted
 * an order (the confirming member's email, the play tag) is more sensitive than the public fill and
 * has no current reader, so slice 1 can apply the correct tier from day one without changing any
 * observed behavior (#1211 settled forks: visibility gates the subscription, not the capture).
 */
export function activityEventFromAuditRecord(record: OrderAuditRecord): ActivityEvent {
  return {
    id: `${record.orderId}:order.submitted:${record.at}`,
    eventType: "order.submitted",
    actor: {
      participantId: record.participantId,
      ...(record.ownerEmail ? { email: record.ownerEmail } : {}),
    },
    target: { kind: "order", id: record.orderId },
    at: record.at,
    correlationId: record.orderId,
    // Only orders the app's own ticket submitted reach this ledger at all (`desk-gate.ts`).
    source: "app",
    outcome: "success",
    visibility: "owner-only",
    payload: {
      ...(record.symbol ? { symbol: record.symbol } : {}),
      ...(record.side ? { side: record.side } : {}),
      ...(record.code ? { code: record.code } : {}),
      ...(record.intent ? { intent: record.intent } : {}),
    },
  };
}

// --- feedback (#784 slice 2) ---------------------------------------------------------------------
//
// The second KIND on the bus, and the first that is not a trade. Both translators key the event's
// identity off the issue number, which is what a filing and every later observation of it have in
// common — `correlationId: "feedback:<n>"` is therefore the chain a slice-3 feed row groups on,
// exactly as an order id chains a fill to its submission.
//
// ONE THING A LATER SLICE MUST NOT ASSUME: `actor.participantId` here is NOT a hub participant id.
// A filing's actor is the member's `opaqueMemberId` (`feedback-attribution.ts`) and a status
// observation's actor is `"system"`; neither will ever match a trade event's `participantId`. The
// two id spaces are deliberately separate — the attribution ruling (Eric, 2026-08-19) is that a
// filing correlates pseudonymously and nothing finer. A one-feed slice joins these kinds by
// `target`, never by actor.

/** Who a status observation is attributed to. GitHub changed the state and the app noticed; no
 *  member acted, so inventing one would be a lie. Also the bus's file key, which is why it is one
 *  constant and not a per-issue id — `JsonlActivityEventBus` writes one file per
 *  `actor.participantId`, and a file per filing would be a directory that grows without bound. */
const SYSTEM_ACTOR = "system";

/**
 * One member filing → one bus event. `visibility: "public"` matches today's `/api/wire` pulse
 * exactly (every member's filings, cross-member, pseudonymous) — this slice changes the schema,
 * not who sees what, the same posture `activityEventFromTradeRecord` took in slice 1.
 *
 * Carrying `opaqueMemberId` on a public-tier event is no new exposure: that same id is already
 * written into the GitHub issue's own public body and its `member-<id>` label
 * (`feedback-attribution.ts`). The pulse still never renders it — the envelope captures what the
 * source honestly knows, and a narrower audience is a narrower subscription (#1211 settled forks).
 */
export function activityEventFromFeedbackEntry(entry: FeedbackLogEntry): ActivityEvent {
  return {
    id: `feedback:${entry.issueNumber}:feedback.filed:${entry.filedAt}`,
    eventType: "feedback.filed",
    actor: { participantId: entry.opaqueMemberId, kind: "human" },
    target: { kind: "feedback", id: String(entry.issueNumber) },
    at: entry.filedAt,
    correlationId: `feedback:${entry.issueNumber}`,
    source: "app",
    outcome: "success",
    visibility: "public",
    payload: {
      issueNumber: entry.issueNumber,
      kind: entry.kind,
      title: entry.title,
      url: entry.url,
    },
  };
}

/**
 * One observed change in a filing's state → one bus event. `at` is when the APP observed the
 * status, not when GitHub changed it: the poll (`feedback-status.ts`) reads a current state, and
 * labels carry no timestamp, so a change time would be invented. The id includes `at` for that
 * reason too — a filing that is shipped, reopened, then shipped again is three honest observations,
 * and an id keyed on the status alone would silently collapse the second shipping into the first.
 *
 * Only a real transition is published (`publishingFeedbackStatuses`); a filing sitting in the queue
 * does not re-emit on every poll.
 */
export function activityEventFromFeedbackStatus(
  issueNumber: number,
  status: FeedbackStatus,
  at: string,
): ActivityEvent {
  return {
    id: `feedback:${issueNumber}:feedback.status-changed:${status}:${at}`,
    eventType: "feedback.status-changed",
    actor: { participantId: SYSTEM_ACTOR, kind: "system" },
    target: { kind: "feedback", id: String(issueNumber) },
    at,
    correlationId: `feedback:${issueNumber}`,
    // GitHub is the source of truth for a filing's state and stays external to this app
    // (`feedback-status.ts`) — the provenance of this line is the poll, not the app's own write.
    source: "github",
    outcome: "success",
    visibility: "public",
    payload: { issueNumber, status },
  };
}

/** One bot order the broker actually accepted. A structural (not imported) shape — mirrors
 *  `AlpacaBrokerAdapter`'s `BotOrderSubmission` without this schema module depending on the
 *  adapters layer; TypeScript's structural typing means the adapter's own shape satisfies
 *  this one with no cast needed at the one real call site (`autonomous-live-wiring.ts`). */
export interface BotOrderSubmissionInfo {
  readonly participantId: string;
  readonly orderId: string;
  readonly symbol: string;
  readonly side: "buy" | "sell";
  readonly quantity: number;
  readonly at: string;
}

/**
 * One bot-autonomous order → one bus event — closes #1211 slice 2 (`AlpacaBrokerAdapter.submit`
 * wrote no audit line at all for a bot's own orders, "a blind spot for reconstructing what a bot
 * actually did"). `visibility: "owner-only"` matches `activityEventFromAuditRecord`'s tier for
 * the same reason: who/what submitted an order is more sensitive than the public fill and has no
 * current reader, so this can start at the correct tier from day one. `actor.kind: "bot"` is the
 * one thing this translator knows that the human-desk one doesn't — the audit log's `ownerEmail`
 * has no bot equivalent, so `actor.email` is simply never set here.
 */
export function activityEventFromBotOrder(info: BotOrderSubmissionInfo): ActivityEvent {
  return {
    id: `${info.orderId}:order.submitted:${info.at}`,
    eventType: "order.submitted",
    actor: { participantId: info.participantId, kind: "bot" },
    target: { kind: "order", id: info.orderId },
    at: info.at,
    correlationId: info.orderId,
    source: "bot",
    outcome: "success",
    visibility: "owner-only",
    payload: { symbol: info.symbol, side: info.side, quantity: info.quantity },
  };
}
