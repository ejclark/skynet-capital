import type { PositionView } from "../observatory/broker-positions.js";
import { humanizeOptionSymbol, isOccSymbol, parseOccSymbol } from "../trading/option-symbols.js";

/**
 * WHAT THEY HOLD ON THE PAGE'S SYMBOL — the position half of the chat's context stamp (#2224
 * shape 2, slice 2). Slice 1 told her the member is on the NVDA ticket; this tells her whether
 * they already own NVDA shares or contracts, so "should I roll this?" or "is this too much NVDA?"
 * has a referent without a `get_my_positions` round trip.
 *
 * The positions come from the SESSION's own linked desk (`resolveCurrentId` → the hub snapshot,
 * the same read her `get_my_positions` tool makes), never from anything the client sent; the only
 * client-derived input is the symbol, and that has already passed `UNDERLYING_PATTERN`
 * (`pageSymbol`). Broker figures are facts, not member text, so they need no quoting.
 *
 * A failed desk read (`error`) or no desk at all adds nothing: "no position" is only claimed when
 * the read actually succeeded, so she never tells a member they're flat on stale zeros.
 */

const MAX_ROWS = 5;

function usd(value: number): string {
  const abs = Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return value < 0 ? `-$${abs}` : `$${abs}`;
}

function onSymbol(position: PositionView, symbol: string): boolean {
  if (position.symbol === symbol) return true;
  return parseOccSymbol(position.symbol)?.underlying === symbol;
}

function row(position: PositionView): string {
  const side = position.quantity < 0 ? "short " : "";
  const count = Math.abs(position.quantity);
  const worth = `now worth ${usd(position.marketValue)}`;
  if (isOccSymbol(position.symbol)) {
    const noun = count === 1 ? "contract" : "contracts";
    return `${side}${count} ${humanizeOptionSymbol(position.symbol)} ${noun} at ${usd(position.avgPrice)} each, ${worth}`;
  }
  const noun = count === 1 ? "share" : "shares";
  return `${side}${count} ${noun} at ${usd(position.avgPrice)} avg, ${worth}`;
}

export interface DeskRead {
  readonly positions: readonly PositionView[];
  /** Present when the account read failed — the positions are then zeros, not the truth. */
  readonly error?: string;
}

/** One line on the member's own holding in `symbol`, or undefined when there's no symbol, no
 *  desk, or the desk read failed. Pure. */
export function describeHolding(
  symbol: string | undefined,
  desk: DeskRead | undefined,
): string | undefined {
  if (!(symbol && desk) || desk.error) return undefined;
  const held = desk.positions.filter((p) => p.quantity !== 0 && onSymbol(p, symbol));
  if (held.length === 0) return `they hold no open position on ${symbol}`;
  const rows = held.slice(0, MAX_ROWS).map(row);
  const more = held.length > MAX_ROWS ? `; and ${held.length - MAX_ROWS} more` : "";
  return `on ${symbol} they hold ${rows.join("; ")}${more}`;
}
