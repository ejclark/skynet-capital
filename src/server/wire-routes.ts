import type { ServerResponse } from "node:http";
import type { DecisionRecord } from "../autonomous/decision-record.js";
import type { OrderIntent } from "../domain/types.js";
import type { TradeActivityRecord } from "../observatory/activity-store.js";
import type { EquitySample } from "../observatory/history-store.js";
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
  /** All participants' durable trade activity — omit to render the trading column's honest empty
   *  state instead of a feed. */
  readonly readAllTradeActivity?: () => Promise<readonly TradeActivityRecord[]>;
  /** Every member's filed feedback, not just one member's own — omit to render the pulse column's
   *  honest empty state instead of a feed. */
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
  readonly feedback: FeedbackLogEntry[];
  readonly feedbackStatuses?: Awaited<
    ReturnType<NonNullable<WireRouteDeps["fetchFeedbackStatus"]>>
  >;
}

async function assembleWire(
  config: WireRouteDeps,
  limit: number,
  underlyingFilter?: string,
  before?: string,
): Promise<AssembledWire> {
  const { participants } = config.hub.getState();
  const records = config.readAllTradeActivity ? await config.readAllTradeActivity() : [];
  const feedback = config.readAllFeedback ? await config.readAllFeedback() : [];
  // Newest first, then bounded — `list()`'s own order is filesystem-dependent, so sort before
  // slicing or the page shown could be an arbitrary slice rather than the most recent one.
  const feedbackForStatus = [...feedback]
    .sort((a, b) => b.filedAt.localeCompare(a.filedAt))
    .slice(0, limit);
  const feedbackStatuses =
    config.fetchFeedbackStatus && feedbackForStatus.length
      ? await config.fetchFeedbackStatus(feedbackForStatus.map((e) => e.issueNumber))
      : undefined;
  const page = buildWireTradeRows(records, participants, { limit, before }, underlyingFilter);

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
    feedback: feedbackForStatus,
    ...(feedbackStatuses ? { feedbackStatuses } : {}),
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
      wire: wireJsonView(
        assembled.trades.rows,
        assembled.pnl,
        assembled.feedback,
        feedbackEnabled,
        assembled.feedbackStatuses,
      ),
    }),
  );
}
