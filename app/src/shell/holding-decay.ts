import type { OptionPositionRow, OptionPositions } from "../live/options";
import { MINUS } from "../ui";

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

/** One held contract's θ and Δ for the row (#5960): the feed's quote, else our model's estimate
 *  (`estimated`), else the reason there is neither (`missing`), so a cell never reads a bare dash. */
export interface HoldingGreeks {
  readonly decay?: HoldingDecay;
  /** What a $1 rise in the stock does to the holding, in dollars (#5059): the contract's delta ×
   *  signed contracts × 100. A sold put with a −0.40 delta is +$40 per $1; a bought put negative. */
  readonly delta?: number;
  /** Our pricing model's figures, not the feed's: the row says "est." in words. */
  readonly estimated?: true;
  /** Why there are no figures: "no price for CRWV yet". */
  readonly missing?: string;
}

function decayOf(theta: number | undefined): HoldingDecay | undefined {
  if (theta === undefined || !Number.isFinite(theta)) return undefined;
  const amount = `${dollars.format(Math.abs(theta))}/day`;
  return { perDay: theta, signed: `${theta < 0 ? "−" : "+"}${amount}`, amount };
}

const finite = (n: number | undefined) => (n !== undefined && Number.isFinite(n) ? n : undefined);

function holdingGreeks(row: OptionPositionRow): HoldingGreeks {
  const quoted = row.positionGreeks;
  const figures = quoted ?? row.estimate?.positionGreeks;
  const decay = decayOf(figures?.theta);
  const delta = finite(figures?.delta);
  if (decay || delta !== undefined) {
    return {
      ...(decay ? { decay } : {}),
      ...(delta !== undefined ? { delta } : {}),
      ...(quoted ? {} : { estimated: true as const }),
    };
  }
  return {
    missing:
      row.noEstimate === "no-spot"
        ? `no price for ${row.underlying} yet`
        : "no quote for this contract yet",
  };
}

/** Per held contract, from the option book (#3689 slice 6, #5059, #5960). A contract with no row
 *  in the book (it hasn't answered) has no entry. */
export function greeksBySymbol(
  statement: OptionPositions | undefined,
): ReadonlyMap<string, HoldingGreeks> {
  const out = new Map<string, HoldingGreeks>();
  if (!statement?.available) return out;
  for (const row of statement.rows) out.set(row.symbol, holdingGreeks(row));
  return out;
}

/** The phone card's greeks line, in parts so the figures can carry the weight. */
export interface GreeksParts {
  /** "earns" on an option sold, "costs" on one bought, then the size: "$11/day". */
  readonly theta?: { readonly verb: "earns" | "costs"; readonly amount: string };
  /** "+$40" / "−$38": the holding's dollars for a $1 rise in the stock. */
  readonly delta?: string;
  /** The figures are our model's estimate (#5960): the line ends "est.". */
  readonly estimated?: true;
}

/**
 * The phone card's greeks line (#5059, Eric's row spec; wording settled on #5037): "θ earns
 * $11/day" on an option sold and "θ costs $12/day" on one bought (#5023: the verb carries the
 * direction, so no sign follows it), then "Δ +$40 per $1". A figure under half a dollar is left out
 * rather than printed as $0, and a contract with no figures has no line at all.
 */
export function greeksParts(greeks: HoldingGreeks | undefined): GreeksParts {
  const decay = greeks?.decay;
  const delta = greeks?.delta;
  const theta =
    decay && Math.round(Math.abs(decay.perDay)) !== 0
      ? { verb: decay.perDay < 0 ? ("costs" as const) : ("earns" as const), amount: decay.amount }
      : undefined;
  const move =
    delta !== undefined && Math.round(Math.abs(delta)) !== 0
      ? `${delta < 0 ? MINUS : "+"}${dollars.format(Math.abs(delta))}`
      : undefined;
  return {
    ...(theta ? { theta } : {}),
    ...(move ? { delta: move } : {}),
    ...((theta || move) && greeks?.estimated ? { estimated: true as const } : {}),
  };
}
