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
