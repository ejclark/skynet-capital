import { contractMultiplier } from "../trading/option-symbols.js";
import type { TradeActivityRecord } from "./activity-record.js";
import type { EquitySample } from "./history-record.js";

/**
 * INFERRED CAPITAL FLOWS — a paper-balance top-up (or reset down) told apart from trading (#4563).
 *
 * Every member holds their own Alpaca paper dashboard, and our onboarding teaches them its reset
 * dialog, which accepts any figure at any date. Standings rank raw equity, so a refund from $700k
 * to $1M moved a member up the ladder with nothing saying capital arrived. Alpaca's portfolio
 * history is flow-adjusted (`month-return-sync.ts` relies on that); our own two records are not —
 * but they disagree when a flow happens, and that disagreement is the signal:
 *
 *   - **Cash** moves only by fills, flows and a few broker events. Subtract the cash our journal
 *     explains (`fillCashBetween`) and what is left is unexplained.
 *   - **Equity** moves by market P&L and flows, never by a fill (a buy swaps cash for shares).
 *
 * A flow is inferred only when BOTH exceed the tolerance: unexplained cash alone is an assignment
 * or an unjournaled fill (equity holds), an equity move alone is the market (cash holds). The amount
 * is the equity change — a reset that also clears held positions moves cash by far more than the
 * capital that arrived — with the unexplained cash kept beside it for tuning.
 *
 * This is a deduction from our records, never a broker report, so every line says `inferred`.
 * The samples are the hub's book, so the hub must fold a fill the way the journal prices it — an
 * option contract at 100 shares (`reduce.ts`). Known sources a line can still be wrong from:
 *
 *   - **A spread.** The hub folds no multi-leg fill (its parent order has no symbol) until the next
 *     broker sync, so for up to a minute the book and the journal disagree by the spread's net
 *     cash. A window holding a spread leg, or within `SPREAD_SETTLE_MS` after one, is skipped.
 *   - **An unjournaled cash event** (an assignment's share leg, an expiry, a fee) in the same
 *     five-minute window as a market move beyond tolerance.
 *   - **A restart gap** whose orders outran the broker's recent-order window; the watch only
 *     bridges a gap that window covers (`capital-flow-watch.ts`).
 *
 * Slice 1 records in shadow precisely so the tolerance can be tuned against the recorded series —
 * with these sources named — before a member sees a line. Slice 2 built the rendering (the row's
 * mark in `capital-flow-mark.ts`, served from `capital-flow-ledger.ts`) but holds it behind
 * `FLOWS_SHOWN_FROM` below until that tuning lands (tracked on #4563).
 */
export interface CapitalFlow {
  readonly participantId: string;
  /** The window the flow landed in: the earlier sample's time… */
  readonly from: string;
  /** …and the later one's. */
  readonly at: string;
  /** Signed dollars: positive when capital was added, negative when removed. */
  readonly amount: number;
  readonly direction: "added" | "removed";
  /** The cash change our fill journal did not explain — the second witness, kept for tuning. */
  readonly unexplainedCash: number;
  /** Always inferred: deduced from two of our own records, not reported by the broker. */
  readonly basis: "inferred";
}

/** Where inferred flows are kept. Interface-first, like `HistoryStore`, so tests stay I/O-free. */
export interface CapitalFlowStore {
  record(flow: CapitalFlow): Promise<void>;
  /** All flows (order not guaranteed); one participant's when given. */
  list(participantId?: string): Promise<CapitalFlow[]>;
}

/** The issue's recommended default: a flow must clear both $1,000 and 0.5% of equity, so a
 *  rounding difference, a dividend or a fee is never recorded as capital arriving. */
export function flowTolerance(equity: number): number {
  return Math.max(1_000, Math.abs(equity) * 0.005);
}

/**
 * The instant from which a recorded flow is SHOWN to members — on the standings row and the equity
 * curve (#4563). `null` holds every mark back: the ledger keeps recording, nothing renders. A false
 * line would tell the whole league that an earned gain was not earned, so the marks wait until
 * `flowTolerance` has been tuned against a week of shadow lines. The tuning step sets this to the
 * instant the tuned tolerance ships, so a line recorded under the untuned default is never shown.
 */
export const FLOWS_SHOWN_FROM: string | null = null;

/** Dollars of filled notional one order had reached by `when` — its most-filled journal line at or
 *  before that instant. The journal is append-only, so an order can sit on several lines. */
function notionalBy(lines: readonly TradeActivityRecord[], when: string): number {
  let best: TradeActivityRecord | undefined;
  for (const line of lines) {
    if (line.at > when) continue;
    if (!best || line.filledQuantity >= best.filledQuantity) best = line;
  }
  if (!best || best.price === undefined) return 0;
  return best.filledQuantity * best.price * contractMultiplier(best.symbol);
}

/**
 * Net cash the journaled fills moved in the window `(from, to]`: a sell raises cash, a buy spends
 * it, options scaled by their multiplier. A partial fill counts only the notional it added inside
 * the window. Lines without a price (a lifecycle `$0` line, an unfilled order) move nothing.
 */
export function fillCashBetween(
  records: readonly TradeActivityRecord[],
  from: string,
  to: string,
): number {
  const byOrder = new Map<string, TradeActivityRecord[]>();
  for (const record of records) {
    const lines = byOrder.get(record.orderId) ?? [];
    lines.push(record);
    byOrder.set(record.orderId, lines);
  }
  let cash = 0;
  for (const lines of byOrder.values()) {
    const moved = notionalBy(lines, to) - notionalBy(lines, from);
    const sign = lines[0]?.side === "sell" ? 1 : -1;
    cash += sign * moved;
  }
  return cash;
}

/** How long a spread fill can leave the hub's book behind the journal: the hub folds no `mleg`
 *  fill, so it catches up on the next broker sync (every 60s, `broker-sync.ts`) — doubled for a
 *  slow sync. */
export const SPREAD_SETTLE_MS = 2 * 60_000;

/** Did a spread fill land in `(from − SPREAD_SETTLE_MS, to]`? A leg line carries its parent; a
 *  parent line from a broker read carries no symbol. Either way the window cannot be read. */
export function spreadNear(
  records: readonly TradeActivityRecord[],
  from: string,
  to: string,
): boolean {
  const start = Date.parse(from) - SPREAD_SETTLE_MS;
  const end = Date.parse(to);
  return records.some((record) => {
    if (record.parentOrderId === undefined && record.symbol !== "") return false;
    if (record.price === undefined || record.filledQuantity <= 0) return false;
    const at = Date.parse(record.at);
    return at > start && at <= end;
  });
}

/**
 * The capital flow between two consecutive samples of one participant, or undefined when the
 * journaled fills explain the move (or nothing moved beyond tolerance, or a spread makes the
 * window unreadable). Pure — the watch that feeds it samples and fills lives in
 * `capital-flow-watch.ts`.
 */
export function inferCapitalFlow(
  prev: EquitySample,
  next: EquitySample,
  records: readonly TradeActivityRecord[],
): CapitalFlow | undefined {
  if (prev.participantId !== next.participantId) return undefined;
  const tolerance = flowTolerance(prev.equity);
  const equityMove = next.equity - prev.equity;
  const unexplainedCash = next.cash - prev.cash - fillCashBetween(records, prev.at, next.at);
  if (Math.abs(equityMove) <= tolerance || Math.abs(unexplainedCash) <= tolerance) return undefined;
  if (spreadNear(records, prev.at, next.at)) return undefined;
  return {
    participantId: next.participantId,
    from: prev.at,
    at: next.at,
    amount: equityMove,
    direction: equityMove > 0 ? "added" : "removed",
    unexplainedCash,
    basis: "inferred",
  };
}

/** Cheap pre-check: could this pair carry a flow at all? Equity must have moved beyond tolerance
 *  (a necessary condition of `inferCapitalFlow`), so the watch skips reading the fill journal on
 *  every quiet tick. Cash is deliberately not pre-checked: a top-up and a same-window buy can
 *  cancel in the cash total while the unexplained part is still the whole top-up. */
export function mightCarryFlow(prev: EquitySample, next: EquitySample): boolean {
  return (
    prev.participantId === next.participantId &&
    Math.abs(next.equity - prev.equity) > flowTolerance(prev.equity)
  );
}
