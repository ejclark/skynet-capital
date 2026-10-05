import type { AlpacaAccount, AlpacaPosition } from "../alpaca/alpaca-trading-client.js";
import type { Portfolio, Position } from "../domain/types.js";

/**
 * Alpaca's account + positions payloads → the engine's `Portfolio`. ONE mapping, shared by the
 * broker adapter's `getPortfolio` and the option order flow's fresh re-check, so the book a guard
 * sized an order against and the book the adapter re-checks it against are read the same way.
 */

/**
 * One position. A short is NEGATIVE here whatever the payload's own sign: Alpaca reports a short's
 * `side` as "short" and has been seen to send its `qty` unsigned, and every option rule in this
 * codebase (`option-book.ts`) reads a sold contract as a negative quantity — a short put read as
 * long would look like something to sell, not something to secure.
 */
export function positionFromAlpaca(position: AlpacaPosition): Position {
  const qty = Number(position.qty);
  // `market_value` is the broker's own dollar mark, already contract-scaled for options — the one
  // mark for a holding the price stream never quotes (#4643). Absent or unparseable leaves it off,
  // so valuation falls back to cost rather than to a false $0.
  const raw: unknown = position.market_value;
  const marketValue = typeof raw === "string" && raw.trim() !== "" ? Number(raw) : Number.NaN;
  return {
    symbol: position.symbol,
    quantity: position.side === "short" && qty > 0 ? -qty : qty,
    avgPrice: Number(position.avg_entry_price),
    ...(Number.isFinite(marketValue) ? { marketValue } : {}),
  };
}

export function portfolioFromAlpaca(
  account: AlpacaAccount,
  positions: readonly AlpacaPosition[],
): Portfolio {
  return { cash: Number(account.cash), positions: positions.map(positionFromAlpaca) };
}
