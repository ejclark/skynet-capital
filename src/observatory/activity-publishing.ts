import type { FeedbackLogEntry, FeedbackLogStore } from "../server/feedback-log.js";
import type { FeedbackStatus, FetchFeedbackStatuses } from "../server/feedback-status.js";
import type { OrderAuditLog, OrderAuditRecord } from "../server/order-audit-log.js";
import { createBootActivityEventBus } from "./activity-bus.js";
import {
  type ActivityEventBus,
  activityEventFromAuditRecord,
  activityEventFromFeedbackEntry,
  activityEventFromFeedbackStatus,
  activityEventFromTradeRecord,
} from "./activity-event.js";
import {
  type ActivityStore,
  createBootActivityStore,
  type TradeActivityRecord,
} from "./activity-store.js";
import { latestStatusByIssue } from "./feedback-event-feed.js";

/**
 * BUS-PUBLISHING DECORATORS — wrap an existing `ActivityStore`/`OrderAuditLog` so every successful
 * `record()` also translates and publishes onto the event bus, with zero change to the wrapped
 * store's own behavior or callers (#1211 slice 1: "behavior-preserving"). Callers keep using the
 * same interface; construction is the only thing that changes (`serve-dashboard.ts`).
 *
 * The bus write happens after the store write succeeds, and a bus failure never fails the caller's
 * `record()` — the durable ledger these decorators wrap is still the ledger every existing reader
 * depends on; the bus is additive, so a publishing hiccup must never regress it.
 */

/** `process.emitWarning`, not a throw, a swallow, or `console` (library code, which this repo
 *  reserves `console` for scripts) — a lost bus event must stay visible without taking down the
 *  write it's riding on (same reasoning as `jsonl-store.ts`'s malformed-line warning). */
function logBusFailure(context: string, error: unknown): void {
  process.emitWarning(`[activity-bus] ${context} failed to publish: ${error}`);
}

export function publishingActivityStore(
  store: ActivityStore,
  bus: ActivityEventBus,
): ActivityStore {
  return {
    async record(entry: TradeActivityRecord): Promise<void> {
      await store.record(entry);
      try {
        await bus.publish(activityEventFromTradeRecord(entry));
      } catch (error) {
        logBusFailure(`activity ${entry.orderId}`, error);
      }
    },
    list: (participantId) => store.list(participantId),
  };
}

export function publishingOrderAuditLog(log: OrderAuditLog, bus: ActivityEventBus): OrderAuditLog {
  return {
    async record(entry: OrderAuditRecord): Promise<void> {
      await log.record(entry);
      try {
        await bus.publish(activityEventFromAuditRecord(entry));
      } catch (error) {
        logBusFailure(`order-audit ${entry.orderId}`, error);
      }
    },
    list: (participantId) => log.list(participantId),
  };
}

/** A member's filing, onto the bus — the feedback kind's write half (#784 slice 2), wrapping the
 *  same `record()` seam the two decorators above wrap, with the same never-fail-the-caller rule.
 *  A lost bus event must never cost a member the filing they just made. */
export function publishingFeedbackLogStore(
  store: FeedbackLogStore,
  bus: ActivityEventBus,
): FeedbackLogStore {
  return {
    async record(entry: FeedbackLogEntry): Promise<void> {
      await store.record(entry);
      try {
        await bus.publish(activityEventFromFeedbackEntry(entry));
      } catch (error) {
        logBusFailure(`feedback #${entry.issueNumber}`, error);
      }
    },
    list: (opaqueMemberId) => store.list(opaqueMemberId),
  };
}

/**
 * The GitHub status poll, demoted to an emitter. GitHub owns a filing's open/shipped state and
 * stays external to this app (`feedback-status.ts`), so slice 2 does not delete the read — it
 * stops the VIEW depending on it directly and puts what the poll learns onto the bus, where the
 * pulse reads one schema instead of joining a log against a status map.
 *
 * Only a real transition publishes. The baseline for a filing this process has not seen is the
 * state a filing is in by definition the moment `feedback.filed` records it — `"open"` — so the
 * first poll of a filing still sitting in the queue emits nothing, and "status changed" never
 * claims a change that did not happen. Anything the bus already witnessed seeds the memory on
 * first use, so a restart does not re-announce history.
 *
 * `fetch`'s own result is returned untouched, so every existing caller (the pulse, a member's own
 * `/app/feedback` list) is byte-identical to before.
 */
export function publishingFeedbackStatuses(
  fetchStatuses: FetchFeedbackStatuses,
  bus: ActivityEventBus,
  now: () => string = () => new Date().toISOString(),
): FetchFeedbackStatuses {
  let lastKnown: Map<number, FeedbackStatus> | undefined;
  return async (issueNumbers) => {
    const statuses = await fetchStatuses(issueNumbers);
    try {
      lastKnown ??= latestStatusByIssue(await bus.list());
      const at = now();
      for (const [issueNumber, status] of statuses) {
        if ((lastKnown.get(issueNumber) ?? "open") === status) continue;
        // Remembered only after the publish succeeds — a failed write that updated the memory
        // anyway would lose the transition for good, since the next poll would read as a no-op.
        await bus.publish(activityEventFromFeedbackStatus(issueNumber, status, at));
        lastKnown.set(issueNumber, status);
      }
    } catch (error) {
      logBusFailure("feedback status", error);
    }
    return statuses;
  };
}

/**
 * Put both feedback emitters on the bus in one call — the shape `bootPublishingActivityStore` uses
 * below, for the same reason: `serve-dashboard.ts` gets one line per concern, and the pair can't
 * drift apart (a filing published with no status emitter beside it would leave the pulse's rows
 * permanently badge-less). `status` stays absent when the deployment has no GitHub token, exactly
 * as `resolveFeedbackStatus` returns it — wrapping cannot switch a dark dependency on.
 */
export function publishingFeedback(
  bus: ActivityEventBus,
  deps: {
    readonly feedbackLog: FeedbackLogStore;
    readonly feedbackStatus?: FetchFeedbackStatuses;
  },
): { readonly log: FeedbackLogStore; readonly status?: FetchFeedbackStatuses } {
  return {
    log: publishingFeedbackLogStore(deps.feedbackLog, bus),
    ...(deps.feedbackStatus
      ? { status: publishingFeedbackStatuses(deps.feedbackStatus, bus) }
      : {}),
  };
}

/** Boot the trade-activity ledger and its event bus together — the one call site
 *  `serve-dashboard.ts` needs (`createBootActivityStore` + `createBootActivityEventBus` +
 *  `publishingActivityStore`, collapsed so the two boot factories never drift out of step). */
export function bootPublishingActivityStore(
  env: NodeJS.ProcessEnv,
  mode: string,
): { readonly activity: ActivityStore; readonly bus: ActivityEventBus } {
  const bus = createBootActivityEventBus(env, mode);
  return { activity: publishingActivityStore(createBootActivityStore(env, mode), bus), bus };
}
