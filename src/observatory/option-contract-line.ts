import type { OrderIntent } from "../domain/types.js";
import {
  humanizeOptionSymbol,
  occExpiryLabel,
  occStrikeLabel,
  parseOccSymbol,
} from "../trading/option-symbols.js";
import { formatPrice } from "./desk-data.js";

/**
 * A bot's option order in one line a member can read, in place of "SELL 1 CRWV" — which would say
 * shares were sold. The verb is the order's own side on an open, CLOSE on a close; the price is per
 * share, as the broker quotes it; a vertical or a close names whether it pays (debit) or receives
 * (credit).
 */

function limitLabel(limitPrice: number): string {
  return Number.isFinite(limitPrice) ? formatPrice(Math.abs(limitPrice)) : "unknown";
}

/** `"NVDA $185/$200 CALL SPREAD · 13 NOV 26"` — a two-leg order named as the spread it is, or
 *  undefined when its legs are not two readable contracts. */
export function spreadContractName(occSymbols: readonly string[]): string | undefined {
  const parts = occSymbols.flatMap((occ) => parseOccSymbol(occ) ?? []);
  const [low, high] = [...parts].sort((a, b) => a.strike - b.strike);
  if (!(low && high && parts.length === 2)) return undefined;
  const strikes = `${occStrikeLabel(low.strike)}/${occStrikeLabel(high.strike)}`;
  return `${low.underlying} ${strikes} ${low.type.toUpperCase()} SPREAD · ${occExpiryLabel(low.expiration)}`;
}

/** `"SELL 1 CRWV $85 PUT · 6 NOV 26 · limit $2.10"` ·
 *  `"BUY 1 NVDA $185/$200 CALL SPREAD · 13 NOV 26 · limit $3.40 debit"` ·
 *  `"CLOSE 1 NVDA $185/$200 CALL SPREAD · 13 NOV 26 · limit $2.80 credit"`. Undefined for a share
 *  intent. */
export function optionContractLine(intent: OrderIntent): string | undefined {
  const option = intent.option;
  if (!option) return undefined;
  const close = option.effect === "close";
  const verb = close ? "CLOSE" : intent.side.toUpperCase();
  const limit = `limit ${limitLabel(option.limitPrice)}`;
  const [first, second] = option.legs;
  if (first && !second) {
    const paid = close ? (intent.side === "buy" ? " debit" : " credit") : "";
    return `${verb} ${intent.quantity} ${humanizeOptionSymbol(first.occSymbol)} · ${limit}${paid}`;
  }
  const spread = spreadContractName(option.legs.map((leg) => leg.occSymbol));
  if (!spread) return `${verb} ${intent.quantity} ${intent.symbol} option order · ${limit}`;
  const net = option.limitPrice > 0 ? "debit" : "credit";
  return `${verb} ${intent.quantity} ${spread} · ${limit} ${net}`;
}
