import type { AlpacaPosition } from "../alpaca/alpaca-trading-client.js";

/**
 * What a POSITION is, and the single conversion from the broker's payload into it.
 *
 * Alpaca sends every number as a string; somewhere that has to become arithmetic. Doing it in one
 * place is load-bearing rather than tidy: the board's blotter and the order desk's review screen
 * must agree on what you hold, or an order could be checked against different numbers than the ones
 * that were shown — the exact failure a review step exists to prevent.
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

export function positionsFrom(positions: readonly AlpacaPosition[]): PositionView[] {
  return positions.map((position) => {
    const lastday = Number(position.lastday_price);
    return {
      symbol: position.symbol,
      quantity: Number(position.qty),
      avgPrice: Number(position.avg_entry_price),
      marketValue: Number(position.market_value),
      ...(Number.isFinite(lastday) && lastday > 0 ? { lastdayPrice: lastday } : {}),
    };
  });
}
