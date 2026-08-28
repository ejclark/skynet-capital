import type { FeedbackLogEntry } from "../server/feedback-log.js";
import { FEEDBACK_STATUS_LABEL, type FeedbackStatus } from "../server/feedback-status.js";
import { formatPrice } from "./desk-data.js";
import { FEEDBACK_KIND_ICON } from "./feedback-view.js";
import { formatActivityTime, formatSigned, plClass } from "./render-atoms.js";
import type { WirePnlRow, WireTradeRow } from "./wire-data.js";

/**
 * THE WIRE AS DATA (#738 phase 5a) — `/api/wire`, the JSON twin behind the shell's Wire. Same
 * three feeds wire-view.ts renders (trading activity, booked P&L, the feedback pulse), same
 * honesty seams (reconstructed provenance, feedback-unwired banner, pseudonymous filings), with
 * every displayed figure formatted here. The filterable raws (side, kind, symbol, name) ride
 * along as plain strings — the browser matches text, it never re-derives a number.
 */

interface WireTradeView {
  readonly key: string;
  readonly side: "buy" | "sell";
  readonly symbol: string;
  readonly quantity: number;
  readonly price: string;
  readonly who: string;
  readonly whoId: string;
  readonly kind: "human" | "bot";
  readonly reconstructed: boolean;
  readonly when: string;
}

interface WirePnlView {
  readonly who: string;
  readonly whoId: string;
  readonly kind: "human" | "bot";
  readonly realized: string;
  readonly tone: "pos" | "neg" | "flat";
}

interface WireFeedbackView {
  readonly icon: string;
  readonly title: string;
  readonly url: string;
  readonly status?: string;
  readonly statusKey?: FeedbackStatus;
  readonly meta: string;
}

export interface WireView {
  readonly trades: readonly WireTradeView[];
  readonly pnl: readonly WirePnlView[];
  readonly feedbackEnabled: boolean;
  readonly feedback: readonly WireFeedbackView[];
}

export function wireJsonView(
  trades: readonly WireTradeRow[],
  pnl: readonly WirePnlRow[],
  feedback: readonly FeedbackLogEntry[],
  feedbackEnabled: boolean,
  statuses?: ReadonlyMap<number, FeedbackStatus>,
): WireView {
  return {
    trades: trades.map((row, index) => ({
      // The ledger has no per-row id after collapse; participant+time+symbol is stable enough
      // for a read-only list where duplicates would mean two real fills.
      key: `${row.participantId}:${row.at}:${row.symbol}:${index}`,
      side: row.side,
      symbol: row.symbol,
      quantity: row.quantity,
      price: row.price !== undefined ? formatPrice(row.price) : "—",
      who: row.participantName,
      whoId: row.participantId,
      kind: row.kind,
      reconstructed: row.reconstructed,
      when: formatActivityTime(row.at),
    })),
    pnl: pnl.map((row) => ({
      who: row.participantName,
      whoId: row.participantId,
      kind: row.kind,
      realized: formatSigned(row.realizedPl),
      tone: plClass(row.realizedPl),
    })),
    feedbackEnabled,
    feedback: [...feedback]
      .sort((a, b) => b.filedAt.localeCompare(a.filedAt))
      .map((entry) => {
        const status = statuses?.get(entry.issueNumber);
        return {
          icon: FEEDBACK_KIND_ICON[entry.kind],
          title: entry.title,
          url: entry.url,
          ...(status ? { status: FEEDBACK_STATUS_LABEL[status], statusKey: status } : {}),
          meta: `#${entry.issueNumber} · ${new Date(entry.filedAt).toLocaleDateString()}`,
        };
      }),
  };
}
