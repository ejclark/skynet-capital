import type { AlpacaPosition } from "../alpaca/alpaca-trading-client.js";
import { isOccSymbol } from "../trading/option-symbols.js";

/**
 * What a POSITION is, and the single conversion from the broker's payload into it.
 *
 * Alpaca sends every number as a string; somewhere that has to become arithmetic. Doing it in one
 * place is load-bearing rather than tidy: the board's blotter and the order desk's review screen
 * must agree on what you hold, or an order could be checked against different numbers than the ones
 * that were shown — the exact failure a review step exists to prevent.
 *
 * Option rows need one unit correction here and nowhere else: Alpaca's `qty` is CONTRACTS but
 * `avg_entry_price` is PER SHARE, while `market_value` is total dollars. Left raw, every
 * downstream `quantity × avgPrice` basis (unrealized P/L, return %) would be off by the 100×
 * multiplier. Scaling avgPrice to per-CONTRACT keeps quantity × avgPrice = true cost basis, so
 * all existing arithmetic stays correct for both asset types.
 */
export interface PositionView {
  readonly symbol: string;
  readonly quantity: number;
  readonly avgPrice: number;
  readonly marketValue: number;
  /**
   * Yesterday's close for the symbol, from the broker read. Absent on a position the realtime
   * reducer created mid-session (opened today) — the day-change math then measures from entry,
   * which is what "today's move" honestly means for a position that didn't exist yesterday.
   */
  readonly lastdayPrice?: number;
}

/** One option contract controls 100 shares, so every per-share broker price on an OCC symbol is
 *  a per-contract price waiting to be scaled. Exported because the round-trip adapter needs the
 *  SAME multiplier — when only one of the two surfaces scaled, positions and history disagreed
 *  by 100x about the same trade. */
export const OPTION_MULTIPLIER = 100;

export function positionsFrom(positions: readonly AlpacaPosition[]): PositionView[] {
  return positions.map((position) => {
    // The per-share → per-contract multiplier applies to EVERY per-share broker price, so
    // quantity × avgPrice and quantity × lastdayPrice both stay true dollar totals for options.
    const scale = isOccSymbol(position.symbol) ? OPTION_MULTIPLIER : 1;
    const lastday = Number(position.lastday_price) * scale;
    return {
      symbol: position.symbol,
      quantity: Number(position.qty),
      avgPrice: Number(position.avg_entry_price) * scale,
      marketValue: Number(position.market_value),
      ...(Number.isFinite(lastday) && lastday > 0 ? { lastdayPrice: lastday } : {}),
    };
  });
}
