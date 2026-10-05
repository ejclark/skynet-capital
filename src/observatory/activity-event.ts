import type { EarnedMilestone } from "../domain/progression.js";
import type { FeedbackLogEntry } from "../server/feedback-log.js";
import type { FeedbackStatus } from "../server/feedback-status.js";
import type { LadderProgressEntry, LadderProgressEvidence } from "../server/ladder-progress-log.js";
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

// --- development (#784 slice 4) ------------------------------------------------------------------
//
// The third KIND, and the first whose source is not inside this app at all. A merged pull request is
// the league's own record of what got built, which this issue's original notes named and nothing
// ever emitted ("the list/collection of records should contain all activity for skynet capital —
// transactions, feedback, development", Eric 2026-08-28).
//
// WHERE IT COMES FROM, AND WHY NOT A WEBHOOK. #784's brief guessed this would ride "the same GitHub
// webhook infra already wired for Moneypenny's PR-activity subscriptions" and left a build session
// to confirm. There is no such infrastructure: nothing in `src/` receives an inbound GitHub webhook.
// What does exist is three read-only POLLS on the token the app already holds — `feedback-status.ts`,
// `work-status.ts`, `ops-status-deploy-lag.ts` — so this kind is a fourth one
// (`development-activity.ts`), demoted to an emitter exactly as `publishingFeedbackStatuses` demoted
// the feedback status poll. No new credential and no new inbound surface, which is also why it needs
// no bridge: there is no local development ledger that predates the bus, and GitHub itself holds the
// history the poll's window reads.

/** What the merged-PR poll honestly knows about one merge (`development-activity.ts` narrows the
 *  GitHub payload into exactly this, so nothing downstream reads a raw API body). Every field is
 *  something the payload SAID — a merge with no `merged_at`, number, title or URL never becomes an
 *  event, because the row would have to invent what it is about. */
export interface MergedPullRequestInfo {
  readonly number: number;
  readonly title: string;
  /** The GitHub login that opened it, or absent when the payload carried none (a deleted account).
   *  Never defaulted to a person: an unattributed merge is honest, a wrong name is not. */
  readonly author?: string;
  readonly url: string;
  readonly mergedAt: string;
}

/**
 * One merged pull request → one bus event. `at` is the merge instant GitHub reported, not when the
 * poll noticed — unlike a filing's status, a merge HAS a timestamp in the payload, so there is
 * nothing to invent and the row sorts into the feed at the moment it actually happened.
 *
 * `actor` is the system, not the PR's author, for both of the reasons the feedback status emitter
 * gives: no member of this league acted (GitHub merged it, the app observed it), and
 * `JsonlActivityEventBus` writes one file per `actor.participantId`, so a file per GitHub login would
 * be a directory that grows with the contributor list. The author's login rides in the payload,
 * where it is a fact about the merge rather than a claim about a participant.
 *
 * `visibility: "public"` — a merged PR in a public repo is already public, and the whole league's
 * record is what this kind exists to complete.
 */
export function activityEventFromMergedPullRequest(info: MergedPullRequestInfo): ActivityEvent {
  return {
    // No `at` in the id: a merge happens ONCE, so the PR number alone is its identity, and keying on
    // the instant too would let a re-read with a reformatted timestamp publish the same merge twice.
    id: `development:${info.number}:development.pr-merged`,
    eventType: "development.pr-merged",
    actor: { participantId: SYSTEM_ACTOR, kind: "system" },
    target: { kind: "development", id: String(info.number) },
    at: info.mergedAt,
    correlationId: `development:${info.number}`,
    source: "github",
    outcome: "success",
    visibility: "public",
    payload: {
      pullRequest: info.number,
      title: info.title,
      ...(info.author ? { author: info.author } : {}),
      url: info.url,
    },
  };
}

// --- milestones (#784 slice 5) -------------------------------------------------------------------
//
// The fourth KIND, and the one with two honest regimes underneath it — which is why it has two
// translators onto ONE event type rather than one:
//
// - **Logged** (`activityEventFromLadderEntry`): the ladder detector's two outcome milestones, an OTM
//   expiry and a first realized profit. A fill alone cannot prove either, so the detector writes a
//   durable row once it has (`ladder-progress-log.ts`), and that write is what publishes.
// - **Derived** (`activityEventFromEarnedMilestone`): the trade ladder (first buy, first covered
//   call…). These are NEVER stored — `domain/progression.ts` re-derives them from the fill + audit
//   ledgers on every read, Eric's 2026-08-25 ruling that a stored verdict only invites drift. So this
//   translator runs at READ time over those same ledgers and its events are never published: writing
//   them to the bus would be exactly the stored "earned" record that ruling forbids.
//
// Both key identity on (participant, milestone) and nothing else — a milestone is earned ONCE, so an
// instant in the id would let a detector re-log, or a backfilled earlier fill, mint a second row for
// the same earn. The fold (`milestone-event-feed.ts`) keeps the earliest instant, the same rule
// `earliestPerMilestone` and `deriveEarned` both use.
//
// `actor.participantId` IS a hub participant id here, unlike a filing's: the ladder is keyed on the
// roster id (`ladder-progress-log.ts`), so a milestone row can name who earned it the way a trade row
// names who traded.

/** What one earn says, whichever regime proved it. `orderId` is the evidence — the fill, expiry or
 *  closing trade that proved the milestone — never a claim. */
interface MilestoneEarnedInfo {
  readonly participantId: string;
  readonly milestoneId: string;
  readonly orderId: string;
  readonly evidence: LadderProgressEvidence["kind"];
  readonly at: string;
}

function activityEventFromMilestone(info: MilestoneEarnedInfo, source: string): ActivityEvent {
  const identity = `${info.participantId}:${info.milestoneId}`;
  return {
    id: `milestone:${identity}:milestone.earned`,
    eventType: "milestone.earned",
    actor: { participantId: info.participantId },
    target: { kind: "milestone", id: identity },
    at: info.at,
    correlationId: `milestone:${identity}`,
    source,
    outcome: "success",
    // Every earn is proved by a fill or a fill's outcome, and fills are already on the public feed —
    // a milestone row tells the league nothing its trade rows did not, only what it MEANT.
    visibility: "public",
    payload: { milestoneId: info.milestoneId, orderId: info.orderId, evidence: info.evidence },
  };
}

/** One ladder-detector row → one bus event; the write half `publishingLadderProgressLog` rides. */
export function activityEventFromLadderEntry(entry: LadderProgressEntry): ActivityEvent {
  return activityEventFromMilestone(
    {
      participantId: entry.participantId,
      milestoneId: entry.milestoneId,
      orderId: entry.evidence.orderId,
      evidence: entry.evidence.kind,
      at: entry.at,
    },
    "ladder-detector",
  );
}

/** One fill-derived ladder earn → one event, built at read time and never published (see above). */
export function activityEventFromEarnedMilestone(
  participantId: string,
  earned: EarnedMilestone,
): ActivityEvent {
  return activityEventFromMilestone(
    {
      participantId,
      milestoneId: earned.milestoneId,
      orderId: earned.orderId,
      evidence: "fill",
      at: earned.at,
    },
    "derived",
  );
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
