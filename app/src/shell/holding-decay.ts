import type { OptionPositions } from "../live/options";
import { MINUS } from "./quote-change";

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

/**
 * Per held contract, what a $1 rise in the stock does to the holding in dollars (#5059): the
 * book's per-holding delta, which is already the contract's delta × signed contracts × 100. A
 * sold put with a −0.40 delta is +$40 per $1; a bought put is negative. Unquoted: no entry.
 */
export function deltaBySymbol(statement: OptionPositions | undefined): ReadonlyMap<string, number> {
  const out = new Map<string, number>();
  if (!statement?.available) return out;
  for (const row of statement.rows) {
    const delta = row.positionGreeks?.delta;
    if (delta !== undefined && Number.isFinite(delta)) out.set(row.symbol, delta);
  }
  return out;
}

/** The phone card's greeks line, in parts so the figures can carry the weight. */
export interface GreeksParts {
  /** "earns" on an option sold, "costs" on one bought, then the size: "$11/day". */
  readonly theta?: { readonly verb: "earns" | "costs"; readonly amount: string };
  /** "+$40" / "−$38": the holding's dollars for a $1 rise in the stock. */
  readonly delta?: string;
}

/**
 * The phone card's greeks line (#5059, Eric's row spec; wording settled on #5037): "θ earns
 * $11/day" on an option sold and "θ costs $12/day" on one bought (#5023: the verb carries the
 * direction, so no sign follows it), then "Δ +$40 per $1". A figure under half a dollar is left out
 * rather than printed as $0, and a contract the feed didn't quote has no line at all.
 */
export function greeksParts(
  decay: HoldingDecay | undefined,
  delta: number | undefined,
): GreeksParts {
  const theta =
    decay && Math.round(Math.abs(decay.perDay)) !== 0
      ? { verb: decay.perDay < 0 ? ("costs" as const) : ("earns" as const), amount: decay.amount }
      : undefined;
  const move =
    delta !== undefined && Math.round(Math.abs(delta)) !== 0
      ? `${delta < 0 ? MINUS : "+"}${dollars.format(Math.abs(delta))}`
      : undefined;
  return { ...(theta ? { theta } : {}), ...(move ? { delta: move } : {}) };
}
