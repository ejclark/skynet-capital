import { FEEDBACK_STATUS_LABEL, type FeedbackStatus } from "../server/feedback-status.js";
import { humanizeOptionSymbol } from "../trading/option-symbols.js";
import { formatPrice } from "./desk-data.js";
import type { DevelopmentFeedItem } from "./development-event-feed.js";
import type { FeedbackFeedItem } from "./feedback-event-feed.js";
import { FEEDBACK_KIND_ICON, FEEDBACK_KIND_WORD } from "./feedback-view.js";
import type { MemberMilestone } from "./milestone-event-feed.js";
import { formatActivityTime, formatSigned, plClass } from "./render-atoms.js";
import { spreadNetWords } from "./spread-activity.js";
import type { WireTradeVitals } from "./vitals.js";
import type { WirePnlRow } from "./wire-data.js";
import type { WireTradeReasoning, WireTradeWithReasoning } from "./wire-reasoning.js";

/**
 * THE WIRE AS DATA — `/api/wire`, the JSON twin behind the shell's Activity page. Four arrays,
 * two roles since #784 slice 3: `trades`, `feedback` and `development` are the KINDS of one feed the
 * page interleaves (`app/src/live/activity-feed.ts`), and `pnl` is the standing snapshot it renders as
 * a summary strip. They stay separate arrays here because the trade half has a second consumer that
 * wants it alone — the options ticket's who-else-traded row (`fetchWireForSymbol`) — and because
 * the kinds page differently (see that module's header). Adding the third kind added an array and a
 * flag and changed nothing else, which is the shape slices 1–3 were built to make possible. Same honesty seams throughout
 * (reconstructed provenance, feedback-unwired banner, pseudonymous filings), with every displayed
 * figure formatted here. The filterable raws (side, kind, symbol, name) ride along as plain
 * strings — the browser matches text, it never re-derives a number.
 */

interface WireTradeView {
  readonly key: string;
  readonly side: "buy" | "sell";
  /** The broker's own symbol — a ticker, an OCC contract, or none (`""`) for a bot's spread. */
  readonly symbol: string;
  /** What the row names, as the account's Activity names it: a ticker, a contract in words, or a
   *  spread in words (`spread-activity.ts`). */
  readonly display: string;
  /** Whole spreads on a spread's row; shares or contracts filled on any other. */
  readonly quantity: number;
  /** Per share — a spread's net per share. */
  readonly price: string;
  /** A spread's net cash, once (`"$335.00 paid"`) — absent on every other row, and on a spread
   *  whose fill the decision never confirmed. */
  readonly net?: string;
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

/** One merged pull request as the feed renders it (#784 slice 4). `author` stays absent when GitHub
 *  named none — the row then says what shipped without claiming who shipped it. */
interface WireDevelopmentView {
  readonly pullRequest: number;
  readonly icon: string;
  /** The row's leading word, the trade row's BUY/SELL and the filing row's "Bug" equivalent. */
  readonly kindLabel: string;
  readonly title: string;
  readonly url: string;
  readonly author?: string;
  readonly meta: string;
  /** The merge instant, raw — the other two kinds' `at` twin, for the same interleave reason. */
  readonly at: string;
}

/** One member's earned milestone as the feed renders it (#784 slice 5). `points` stays absent for a
 *  milestone the course score does not count — a figure the Learn page never adds up would be a
 *  number with nothing behind it. */
interface WireMilestoneView {
  /** Participant + milestone: an earn happens once, so the pair is the row's identity. */
  readonly key: string;
  readonly icon: string;
  /** The row's leading word — the event ("Earned"), where the chip names the category. */
  readonly kindLabel: string;
  readonly who: string;
  readonly whoId: string;
  /** The milestone's achievement title, as the Learn page words it ("Buy your first stock"). */
  readonly title: string;
  readonly points?: number;
  readonly meta: string;
  /** The instant the proving fill (or expiry, or close) happened, raw — the interleave field. */
  readonly at: string;
}

export interface WireView {
  readonly trades: readonly WireTradeView[];
  readonly pnl: readonly WirePnlView[];
  readonly feedbackEnabled: boolean;
  readonly feedback: readonly WireFeedbackView[];
  /** False when this deployment cannot read GitHub's merges at all — the page says so rather than
   *  letting an empty list imply the league has never shipped anything. */
  readonly developmentEnabled: boolean;
  readonly development: readonly WireDevelopmentView[];
  /** False when this deployment cannot read every milestone source — the page says so rather than
   *  let an empty list imply nobody has earned anything. */
  readonly milestonesEnabled: boolean;
  readonly milestones: readonly WireMilestoneView[];
}

/** A filing whose payload named a kind this app doesn't file — the row still belongs on the
 *  league's record, so it is badged neutrally rather than dropped (`feedback-event-feed.ts`). */
const UNKNOWN_KIND_ICON = "📄";
const UNKNOWN_KIND_WORD = "Filing";

/** Every development row is the same kind of thing — a merged pull request — so the word and the icon
 *  are constants here rather than a per-row lookup like the filing kinds'. "Merged", not "Shipped":
 *  a filing row can already carry a "Shipped" STATUS pill, and two different things wearing one word
 *  on the same list is exactly the confusion the leading word exists to remove. */
const DEVELOPMENT_ICON = "🚀";
const DEVELOPMENT_WORD = "Merged";

/** Every milestone row is one kind of thing, so word and icon are constants, as the merge row's are.
 *  "Earned", because the chip already says "Milestones" (chips name the category, rows the event),
 *  and because no other kind's row or pill wears it — the collision slice 4 learned to check for. */
const MILESTONE_ICON = "🏅";
const MILESTONE_WORD = "Earned";

export function wireJsonView(
  trades: readonly WireTradeWithReasoning[],
  pnl: readonly WirePnlRow[],
  /** Decoded off the `ActivityEvent` bus (#784 slice 2) — the pulse used to arrive here as a
   *  `FeedbackLogEntry[]` joined against a separately-fetched status map, which is the second
   *  data model this slice removed. Status now rides on the item as a facet of one schema. */
  feedback: readonly FeedbackFeedItem[],
  feedbackEnabled: boolean,
  /** The third kind (#784 slice 4). ABSENT, not empty, when this deployment has no GitHub read —
   *  one optional argument rather than a list plus a flag, because "unwired" and "nothing merged yet"
   *  are different sentences on the page and an empty array cannot tell them apart. */
  development?: readonly DevelopmentFeedItem[],
  /** The fourth kind (#784 slice 5) — absent, not empty, when a milestone source is unwired, for the
   *  reason `development` is. */
  milestones?: readonly MemberMilestone[],
): WireView {
  return {
    trades: trades.map((row, index) => ({
      // The ledger has no per-row id after collapse; participant+time+symbol is stable enough
      // for a read-only list where duplicates would mean two real fills.
      key: `${row.participantId}:${row.at}:${row.symbol}:${index}`,
      side: row.side,
      symbol: row.symbol,
      display: row.spread?.display ?? humanizeOptionSymbol(row.symbol),
      quantity: row.quantity,
      price: row.price !== undefined ? formatPrice(row.price) : "—",
      ...(row.spread?.net ? { net: spreadNetWords(row.spread.net) } : {}),
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
    developmentEnabled: development !== undefined,
    // Sorted here as well as by the decoder, for the same reason the pulse is: newest-first is this
    // view's own contract and should not depend on which caller assembled the list.
    development: [...(development ?? [])]
      .sort((a, b) => b.mergedAt.localeCompare(a.mergedAt))
      .map((item) => ({
        pullRequest: item.pullRequest,
        icon: DEVELOPMENT_ICON,
        kindLabel: DEVELOPMENT_WORD,
        title: item.title,
        url: item.url,
        ...(item.author ? { author: item.author } : {}),
        meta: `#${item.pullRequest} · ${new Date(item.mergedAt).toLocaleDateString()}`,
        at: item.mergedAt,
      })),
    milestonesEnabled: milestones !== undefined,
    milestones: [...(milestones ?? [])]
      .sort((a, b) => b.at.localeCompare(a.at))
      .map((item) => ({
        key: `${item.participantId}:${item.milestoneId}`,
        icon: MILESTONE_ICON,
        kindLabel: MILESTONE_WORD,
        who: item.participantName,
        whoId: item.participantId,
        title: item.title,
        ...(item.points !== undefined ? { points: item.points } : {}),
        meta: `${item.points !== undefined ? `+${item.points} pts · ` : ""}${new Date(item.at).toLocaleDateString()}`,
        at: item.at,
      })),
  };
}
