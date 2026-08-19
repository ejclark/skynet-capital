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
}

const OPTION_MULTIPLIER = 100;

export function positionsFrom(positions: readonly AlpacaPosition[]): PositionView[] {
  return positions.map((position) => ({
    symbol: position.symbol,
    quantity: Number(position.qty),
    avgPrice:
      Number(position.avg_entry_price) * (isOccSymbol(position.symbol) ? OPTION_MULTIPLIER : 1),
    marketValue: Number(position.market_value),
  }));
}
