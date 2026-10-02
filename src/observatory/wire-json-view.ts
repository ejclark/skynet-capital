import { FEEDBACK_STATUS_LABEL, type FeedbackStatus } from "../server/feedback-status.js";
import { formatPrice } from "./desk-data.js";
import type { FeedbackFeedItem } from "./feedback-event-feed.js";
import { FEEDBACK_KIND_ICON, FEEDBACK_KIND_WORD } from "./feedback-view.js";
import { formatActivityTime, formatSigned, plClass } from "./render-atoms.js";
import type { WireTradeVitals } from "./vitals.js";
import type { WirePnlRow } from "./wire-data.js";
import type { WireTradeReasoning, WireTradeWithReasoning } from "./wire-reasoning.js";

/**
 * THE WIRE AS DATA — `/api/wire`, the JSON twin behind the shell's Activity page. Three arrays,
 * two roles since #784 slice 3: `trades` and `feedback` are the two KINDS of one feed the page
 * interleaves (`app/src/live/activity-feed.ts`), and `pnl` is the standing snapshot it renders as a
 * summary strip. They stay separate arrays here because the trade half has a second consumer that
 * wants it alone — the options ticket's who-else-traded row (`fetchWireForSymbol`) — and because
 * the two kinds page differently (see that module's header). Same honesty seams throughout
 * (reconstructed provenance, feedback-unwired banner, pseudonymous filings), with every displayed
 * figure formatted here. The filterable raws (side, kind, symbol, name) ride along as plain
 * strings — the browser matches text, it never re-derives a number.
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
  /** The raw ISO instant behind `when` (#784 slice 3) — the ONE field the page needs un-formatted,
   *  because one feed of two kinds has to interleave them in time and `when` is a localized phrase
   *  ("3m ago"). Everything else stays formatted here; the browser still never re-derives a number. */
  readonly at: string;
  /** Absent for a human trade, or a bot trade whose decision wasn't found — never fabricated
   *  (`wire-reasoning.ts`). Both fields are already display-ready; nothing here re-derives them. */
  readonly reasoning?: WireTradeReasoning;
  readonly vitals?: WireTradeVitals;
}

interface WirePnlView {
  readonly who: string;
  readonly whoId: string;
  readonly kind: "human" | "bot";
  readonly realized: string;
  readonly tone: "pos" | "neg" | "flat";
}

interface WireFeedbackView {
  /** The filing's issue number — the key its in-app comments hang off (issue #2224 shape 3). */
  readonly issueNumber: number;
  readonly icon: string;
  /** The icon's word ("Bug", "Feature", "Idea", else "Filing") — on one mixed feed the row's first
   *  token has to say what the row is, and an emoji alone doesn't (#784 slice 3). */
  readonly kindLabel: string;
  readonly title: string;
  readonly url: string;
  readonly status?: string;
  readonly statusKey?: FeedbackStatus;
  readonly meta: string;
  /** The filing instant, raw — the trade row's `at` twin, for the same interleave reason. */
  readonly at: string;
}

export interface WireView {
  readonly trades: readonly WireTradeView[];
  readonly pnl: readonly WirePnlView[];
  readonly feedbackEnabled: boolean;
  readonly feedback: readonly WireFeedbackView[];
}

/** A filing whose payload named a kind this app doesn't file — the row still belongs on the
 *  league's record, so it is badged neutrally rather than dropped (`feedback-event-feed.ts`). */
const UNKNOWN_KIND_ICON = "📄";
const UNKNOWN_KIND_WORD = "Filing";

export function wireJsonView(
  trades: readonly WireTradeWithReasoning[],
  pnl: readonly WirePnlRow[],
  /** Decoded off the `ActivityEvent` bus (#784 slice 2) — the pulse used to arrive here as a
   *  `FeedbackLogEntry[]` joined against a separately-fetched status map, which is the second
   *  data model this slice removed. Status now rides on the item as a facet of one schema. */
  feedback: readonly FeedbackFeedItem[],
  feedbackEnabled: boolean,
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
      at: row.at,
      ...(row.reasoning ? { reasoning: row.reasoning } : {}),
      ...(row.vitals ? { vitals: row.vitals } : {}),
    })),
    pnl: pnl.map((row) => ({
      who: row.participantName,
      whoId: row.participantId,
      kind: row.kind,
      realized: formatSigned(row.realizedPl),
      tone: plClass(row.realizedPl),
    })),
    feedbackEnabled,
    // Sorted here as well as by the decoder: newest-first is this view's own contract, and it
    // should not depend on which caller assembled the list.
    feedback: [...feedback]
      .sort((a, b) => b.filedAt.localeCompare(a.filedAt))
      .map((item) => ({
        issueNumber: item.issueNumber,
        icon: item.kind ? FEEDBACK_KIND_ICON[item.kind] : UNKNOWN_KIND_ICON,
        kindLabel: item.kind ? FEEDBACK_KIND_WORD[item.kind] : UNKNOWN_KIND_WORD,
        title: item.title,
        url: item.url,
        ...(item.status
          ? { status: FEEDBACK_STATUS_LABEL[item.status], statusKey: item.status }
          : {}),
        meta: `#${item.issueNumber} · ${new Date(item.filedAt).toLocaleDateString()}`,
        at: item.filedAt,
      })),
  };
}
