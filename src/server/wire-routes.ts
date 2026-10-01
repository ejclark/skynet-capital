import type { ServerResponse } from "node:http";
import type { DecisionRecord } from "../autonomous/decision-record.js";
import type { OrderIntent } from "../domain/types.js";
import type { ActivityEvent } from "../observatory/activity-event.js";
import type { TradeActivityRecord } from "../observatory/activity-store.js";
import {
  collapseFeedbackEvents,
  type FeedbackFeedItem,
  mergeFeedbackLogIntoEvents,
  mergeFeedbackStatusesIntoEvents,
} from "../observatory/feedback-event-feed.js";
import type { EquitySample } from "../observatory/history-store.js";
import { mergeLedgerIntoEvents } from "../observatory/trade-event-feed.js";
import { buildWirePnlRows, buildWireTradeRows } from "../observatory/wire-data.js";
import { wireJsonView } from "../observatory/wire-json-view.js";
import { attachWireReasoning } from "../observatory/wire-reasoning.js";
import { UNDERLYING_PATTERN } from "../trading/option-symbols.js";
import type { FeedbackLogEntry } from "./feedback-log.js";
import type { FetchFeedbackStatuses } from "./feedback-status.js";
import type { ObservatoryHub } from "./observatory-hub.js";
import { nextLinkHeader, resolvePageSize } from "./pagination.js";

/**
 * What `/wire` needs from the server config — inherited into `DashboardServerConfig` the same way
 * `FeedbackRouteDeps` is, so the two definitions can't drift apart (never import
 * `DashboardServerConfig` back here — that would make dashboard-server.ts and this file
 * circularly dependent on each other's types for no reason).
 */
export interface WireRouteDeps {
  readonly hub: ObservatoryHub;
  /**
   * Every participant's events off the activity bus (#1211) — the feed's primary source since #784
   * slice 1. Omit and the feed falls back to the durable ledger below, which is what every
   * deployment did before the bus existed.
   */
  readonly readAllActivityEvents?: () => Promise<readonly ActivityEvent[]>;
  /**
   * All participants' durable trade activity, read ALONGSIDE the bus above and not instead of it:
   * the event log only begins at #1211's deploy, so every fill booked before that lives here and
   * nowhere else. `mergeLedgerIntoEvents` folds these in on the bus's own schema, deduplicated on
   * the deterministic event id — see its header for why the union can't double-count and when this
   * leg retires.
   *
   * Omitting BOTH this and `readAllActivityEvents` renders the trading column's honest empty state
   * instead of a feed. Omitting only this one is not an empty state — it is a feed quietly missing
   * every pre-bus fill, so drop it only once the bus is confirmed to hold the ledger's full history.
   */
  readonly readAllTradeActivity?: () => Promise<readonly TradeActivityRecord[]>;
  /**
   * Every member's filed feedback, not just one member's own — read ALONGSIDE the bus above and
   * not instead of it, for the same reason `readAllTradeActivity` is: the event log only begins
   * when #784 slice 2 deploys, so every filing before that lives here and nowhere else.
   * `mergeFeedbackLogIntoEvents` folds these in on the bus's own schema, deduplicated on the
   * deterministic event id. Omit to render the pulse column's honest empty state instead of a feed.
   */
  readonly readAllFeedback?: () => Promise<readonly FeedbackLogEntry[]>;
  readonly fetchFeedbackStatus?: FetchFeedbackStatuses;
  /** The exact order-id join into the decision store (PR 6, issue #2287) — omit to render every
   *  row with no reasoning/vitals attached, never a fabricated one. */
  readonly findByOrderId?: (
    orderId: string,
  ) => { readonly record: DecisionRecord; readonly intent: OrderIntent } | undefined;
  /** One participant's equity history — the "Loss headroom" gauge's input. Omit and every gauge
   *  renders its honest "not yet measured" state instead of guessing. */
  readonly readHistory?: (participantId: string) => Promise<readonly EquitySample[]>;
}

/**
 * `/wire`'s shared assembly — read-only: every dependency above is optional, so a deployment with
 * feedback or the activity ledger unwired still renders an honest empty state rather than an
 * error. Fed to the shell's Wire (`serveWireJson`, #738 phase 5a) — the only remaining consumer.
 *
 * `underlyingFilter`, when given, narrows the trade feed to that one underlying (stock or option)
 * BEFORE `buildWireTradeRows`'s own page bound (#2017 Phase 1 slice 12) — see its own header
 * comment for why the order matters. Omitted, this is byte-identical to the plain Wire.
 *
 * `limit` (PR 5, issue #2287) is the one `per_page` value shared by BOTH the trade feed and the
 * feedback-status fetch below — the two used to disagree (a bare `60` and a bare `40` on the same
 * page), which is exactly the two-bounds-on-one-view smell PR 5 exists to remove.
 */
interface AssembledWire {
  readonly trades: {
    readonly rows: ReturnType<typeof attachWireReasoning>;
    readonly nextCursor?: string;
  };
  readonly pnl: ReturnType<typeof buildWirePnlRows>;
  readonly feedback: readonly FeedbackFeedItem[];
}

/**
 * The pulse, off the same envelope the trade rows now read (#784 slice 2). Two phases, because the
 * status poll needs to know WHICH filings are on the page before it can refresh them:
 *
 * 1. Bridge the durable feedback log into the bus's schema and fold — that gives the page's
 *    filings, newest first. (The bridge is `mergeLedgerIntoEvents`'s twin; see its header for why
 *    the bus alone would drop every pre-slice-2 filing.)
 * 2. Refresh those filings' GitHub state. That call is also the bus's status emitter
 *    (`publishingFeedbackStatuses`), so folding its result back in on the same schema is what
 *    keeps this render from being one request behind its own writer.
 */
async function assembleFeedbackPulse(
  config: WireRouteDeps,
  events: readonly ActivityEvent[],
  filings: readonly FeedbackLogEntry[],
  limit: number,
): Promise<readonly FeedbackFeedItem[]> {
  const withFilings = mergeFeedbackLogIntoEvents(events, filings);
  const page = collapseFeedbackEvents(withFilings).slice(0, limit);
  if (!(config.fetchFeedbackStatus && page.length)) return page;
  const statuses = await config.fetchFeedbackStatus(page.map((item) => item.issueNumber));
  const observed = mergeFeedbackStatusesIntoEvents(withFilings, statuses, new Date().toISOString());
  return collapseFeedbackEvents(observed).slice(0, limit);
}

async function assembleWire(
  config: WireRouteDeps,
  limit: number,
  underlyingFilter?: string,
  before?: string,
): Promise<AssembledWire> {
  const { participants } = config.hub.getState();
  // Both in flight at once: two independent full-ledger reads, so awaiting them in series would
  // pay for the union twice over on a `no-store` page. (Each is still a full read — a bounded read
  // is a real design question for the feed redesign, #784 slice 3, not something to fake here.)
  const [published, records] = await Promise.all([
    config.readAllActivityEvents ? config.readAllActivityEvents() : [],
    config.readAllTradeActivity ? config.readAllTradeActivity() : [],
  ]);
  const events = mergeLedgerIntoEvents(published, records);
  const filings = config.readAllFeedback ? await config.readAllFeedback() : [];
  // `collapseFeedbackEvents` sorts newest-first before this is bounded — `list()`'s own order is
  // filesystem-dependent, so the page shown would otherwise be an arbitrary slice.
  // `published`, not `events`: the trade ledger's translated lines carry no feedback kind, so
  // handing them to the pulse would only make its fold walk them for nothing.
  const feedback = await assembleFeedbackPulse(config, published, filings, limit);
  const page = buildWireTradeRows(events, participants, { limit, before }, underlyingFilter);

  // "the why" and "the vitals" (PR 6, issue #2287) — only bot rows can resolve either, and only
  // when both deps are wired; a plain deployment renders every row exactly as before this PR.
  const botParticipantIds = [
    ...new Set(page.rows.filter((r) => r.kind === "bot").map((r) => r.participantId)),
  ];
  const historyByParticipant = config.readHistory
    ? new Map(
        await Promise.all(
          botParticipantIds.map(
            async (id) => [id, await config.readHistory?.(id)] as [string, readonly EquitySample[]],
          ),
        ),
      )
    : undefined;
  const rows = attachWireReasoning(page.rows, {
    ...(config.findByOrderId ? { findByOrderId: config.findByOrderId } : {}),
    ...(historyByParticipant ? { historyByParticipant } : {}),
  });

  return {
    trades: { rows, ...(page.nextCursor !== undefined ? { nextCursor: page.nextCursor } : {}) },
    pnl: buildWirePnlRows(participants),
    feedback,
  };
}

/**
 * The shell's Wire, as JSON. `?symbol=` (#2017 Phase 1 slice 12) scopes the trade feed to one
 * underlying — used by the options ticket's "who else traded this" row, never a dedicated
 * single-purpose endpoint like `serveChain`/`serveQuote`: the full Wire page hits this with no
 * params on every load, so an absent or malformed `symbol` is silently treated as "no filter"
 * rather than 400ing the whole page. `?per_page=`/`?before=` (PR 5, issue #2287) follow the same
 * posture — clamp, never error — and a full page carries a `Link: <url>; rel="next"` header
 * (GitHub's own convention, per Eric's call to use GitHub's pagination defaults/limits).
 */
export async function serveWireJson(
  res: ServerResponse,
  url: string,
  config: WireRouteDeps,
  feedbackEnabled: boolean,
): Promise<void> {
  const params = new URL(url, "http://localhost").searchParams;
  const requested = (params.get("symbol") ?? "").trim().toUpperCase();
  const underlyingFilter = UNDERLYING_PATTERN.test(requested) ? requested : undefined;
  const limit = resolvePageSize(params.get("per_page"));
  const before = params.get("before") ?? undefined;
  const assembled = await assembleWire(config, limit, underlyingFilter, before);
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "cache-control": "no-store",
  };
  if (assembled.trades.nextCursor !== undefined) {
    headers.link = nextLinkHeader(url, {
      per_page: String(limit),
      before: assembled.trades.nextCursor,
    });
  }
  res.writeHead(200, headers);
  res.end(
    JSON.stringify({
      wire: wireJsonView(assembled.trades.rows, assembled.pnl, assembled.feedback, feedbackEnabled),
    }),
  );
}
