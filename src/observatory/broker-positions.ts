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
}

export function positionsFrom(positions: readonly AlpacaPosition[]): PositionView[] {
  return positions.map((position) => ({
    symbol: position.symbol,
    quantity: Number(position.qty),
    avgPrice: Number(position.avg_entry_price),
    marketValue: Number(position.market_value),
  }));
}
