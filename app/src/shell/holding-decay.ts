import type { OptionPositions } from "../live/options";

/**
 * One held contract's time decay (#3689 slice 6), from the option book's per-holding theta: the
 * contract's theta × signed contracts × 100 (`src/server/option-positions-view.ts`). Its sign is
 * the holder's, so it is negative on an option bought (time costs it) and positive on an option
 * sold (time pays it, #5023).
 */
export interface HoldingDecay {
  /** Dollars a day, signed as the book signs it. */
  readonly perDay: number;
  /** "−$12/day" / "+$11/day": the desktop Decay column. */
  readonly signed: string;
  /** "$12/day": the size alone, for copy that says the direction in a word. */
  readonly amount: string;
}

const dollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** Per held contract. A contract the feed didn't quote has no entry, so its cell reads "—"
 *  rather than a made-up zero. */
export function decayBySymbol(
  statement: OptionPositions | undefined,
): ReadonlyMap<string, HoldingDecay> {
  const out = new Map<string, HoldingDecay>();
  if (!statement?.available) return out;
  for (const row of statement.rows) {
    const theta = row.positionGreeks?.theta;
    if (theta === undefined || !Number.isFinite(theta)) continue;
    const amount = `${dollars.format(Math.abs(theta))}/day`;
    out.set(row.symbol, { perDay: theta, signed: `${theta < 0 ? "−" : "+"}${amount}`, amount });
  }
  return out;
}

/** The phone card's words for it (#5023): "loses ~$12/day to time" on an option bought, "earns
 *  ~$11/day from time" on one sold. The verb carries the direction, so no sign follows it. Under
 *  half a dollar a day the card says nothing rather than "~$0". */
export function decayClause(decay: HoldingDecay | undefined): string | undefined {
  if (!decay || Math.round(Math.abs(decay.perDay)) === 0) return undefined;
  return decay.perDay < 0 ? `loses ~${decay.amount} to time` : `earns ~${decay.amount} from time`;
}
