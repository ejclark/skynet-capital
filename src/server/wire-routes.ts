import type { ServerResponse } from "node:http";
import type { TradeActivityRecord } from "../observatory/activity-store.js";
import { buildWirePnlRows, buildWireTradeRows } from "../observatory/wire-data.js";
import { wireJsonView } from "../observatory/wire-json-view.js";
import type { FeedbackLogEntry } from "./feedback-log.js";
import type { FetchFeedbackStatuses } from "./feedback-status.js";
import type { ObservatoryHub } from "./observatory-hub.js";

/**
 * What `/wire` needs from the server config — inherited into `DashboardServerConfig` the same way
 * `FeedbackRouteDeps` is, so the two definitions can't drift apart (never import
 * `DashboardServerConfig` back here — that would make dashboard-server.ts and this file
 * circularly dependent on each other's types for no reason).
 */
export interface WireRouteDeps {
  readonly hub: ObservatoryHub;
  /** All participants' durable trade activity — omit to render the trading column's honest empty
   *  state instead of a feed. */
  readonly readAllTradeActivity?: () => Promise<readonly TradeActivityRecord[]>;
  /** Every member's filed feedback, not just one member's own — omit to render the pulse column's
   *  honest empty state instead of a feed. */
  readonly readAllFeedback?: () => Promise<readonly FeedbackLogEntry[]>;
  readonly fetchFeedbackStatus?: FetchFeedbackStatuses;
}

/**
 * `/wire`'s shared assembly — read-only: every dependency above is optional, so a deployment with
 * feedback or the activity ledger unwired still renders an honest empty state rather than an
 * error. Fed to the shell's Wire (`serveWireJson`, #738 phase 5a) — the only remaining consumer.
 */
async function assembleWire(config: WireRouteDeps): Promise<{
  trades: ReturnType<typeof buildWireTradeRows>;
  pnl: ReturnType<typeof buildWirePnlRows>;
  feedback: FeedbackLogEntry[];
  feedbackStatuses?: Awaited<ReturnType<NonNullable<WireRouteDeps["fetchFeedbackStatus"]>>>;
}> {
  const { participants } = config.hub.getState();
  const records = config.readAllTradeActivity ? await config.readAllTradeActivity() : [];
  const feedback = config.readAllFeedback ? await config.readAllFeedback() : [];
  // Newest first, then bounded — `list()`'s own order is filesystem-dependent, so sort before
  // slicing or the 40 shown could be an arbitrary 40 rather than the most recent 40.
  const feedbackForStatus = [...feedback]
    .sort((a, b) => b.filedAt.localeCompare(a.filedAt))
    .slice(0, 40);
  const feedbackStatuses =
    config.fetchFeedbackStatus && feedbackForStatus.length
      ? await config.fetchFeedbackStatus(feedbackForStatus.map((e) => e.issueNumber))
      : undefined;
  return {
    trades: buildWireTradeRows(records, participants, 60),
    pnl: buildWirePnlRows(participants),
    feedback: feedbackForStatus,
    ...(feedbackStatuses ? { feedbackStatuses } : {}),
  };
}

/** The shell's Wire, as JSON. */
export async function serveWireJson(
  res: ServerResponse,
  config: WireRouteDeps,
  feedbackEnabled: boolean,
): Promise<void> {
  const assembled = await assembleWire(config);
  res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
  res.end(
    JSON.stringify({
      wire: wireJsonView(
        assembled.trades,
        assembled.pnl,
        assembled.feedback,
        feedbackEnabled,
        assembled.feedbackStatuses,
      ),
    }),
  );
}
