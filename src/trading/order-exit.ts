/**
 * THE EXIT AT ENTRY — the rules for a whole-share limit buy that carries its own way out (#8249): a
 * take-profit (a sell limit above the entry) and a stop (a sell stop below it), held by the broker
 * as one bracket order. And the one stop-limit warning. Pure, like the ticket it extends
 * (`order-ticket.ts`), so every refusal is unit-tested rather than trusted.
 *
 * Alpaca's bracket rules (docs.alpaca.markets, "Bracket Orders"), as this desk applies them:
 *   - the take-profit's limit must be at least $0.01 above the entry's base price, and the stop at
 *     least $0.01 below it; for a limit entry the base price is the limit;
 *   - no extended hours: the take-profit and stop act only between 9:30am and 4pm ET.
 * This desk adds its own narrowing: a LIMIT BUY entry only (a market entry has no price to measure
 * the exits against before it fills, and a sell is already an exit), whole shares, good-till-cancelled
 * (an exit that expired at the close would protect nothing overnight).
 *
 * The dollars each leg makes or loses are measured against the limit, the price the member asked
 * for: quantity × (exit price − limit). The stop's is "about": once triggered it sells at the market.
 */

export interface TicketExit {
  /** The take-profit's sell limit. Missing or not positive refuses. */
  readonly takeProfit?: number;
  /** The stop's trigger price. Missing or not positive refuses. */
  readonly stop?: number;
}

export interface ExitPreview {
  readonly takeProfit: number;
  readonly stop: number;
  /** Dollars the take-profit makes against the limit, when the limit is known. */
  readonly takeProfitDollars?: number;
  /** Dollars (negative) the stop loses against the limit, when the limit is known — an estimate. */
  readonly stopDollars?: number;
}

/** The entry the exit rides — the fields of the ticket request the rules read. */
export interface ExitEntry {
  readonly action: "buy" | "sell";
  readonly orderType: string;
  readonly quantity: number;
  readonly limitPrice?: number;
  readonly timeInForce?: "day" | "gtc";
}

const cents = (dollars: number): number => Math.round(dollars * 100);
/** Printed through the same cent rounding the rules use, so a sentence never names a price the
 *  rule didn't judge (49.995 is judged as $50.00, and says so). */
const usd = (dollars: number): string => `$${(cents(dollars) / 100).toFixed(2)}`;
const positive = (n: number | undefined): n is number =>
  n !== undefined && Number.isFinite(n) && n > 0;

/** The entry-shape refusals: what the exit may ride at all. */
function entryRefusals(entry: ExitEntry, refusals: string[]): void {
  if (entry.action !== "buy") {
    refusals.push("An exit rides a buy only — a sell is already the way out.");
  } else if (entry.orderType !== "limit") {
    refusals.push(
      "An exit needs a limit entry — set the price you'll buy at, and the take-profit and stop are placed against it.",
    );
  }
  if (entry.timeInForce === "day") {
    refusals.push(
      "An order with an exit is good-till-cancelled — a take-profit and stop that expired at the close would protect nothing overnight.",
    );
  }
}

/** The price refusals: each exit priced, and each on its side of the limit by at least a cent. */
function priceRefusals(exit: TicketExit, limit: number | undefined, refusals: string[]): void {
  if (!positive(exit.takeProfit)) {
    refusals.push("Enter a take-profit price greater than zero.");
  } else if (positive(limit) && cents(exit.takeProfit) < cents(limit) + 1) {
    refusals.push(
      `The take-profit (${usd(exit.takeProfit)}) must be at least $0.01 above the limit (${usd(limit)}).`,
    );
  }
  if (!positive(exit.stop)) {
    refusals.push("Enter a stop price greater than zero.");
  } else if (positive(limit) && cents(exit.stop) > cents(limit) - 1) {
    refusals.push(
      `The stop (${usd(exit.stop)}) must be at least $0.01 below the limit (${usd(limit)}).`,
    );
  }
}

/**
 * Check an exit against the entry it rides. Pushes every refusal; returns the echo the preview
 * carries when both prices are real numbers (so a refused exit still shows what was asked).
 */
export function reviewExit(
  exit: TicketExit,
  entry: ExitEntry,
  refusals: string[],
): ExitPreview | undefined {
  entryRefusals(entry, refusals);
  const limit = entry.orderType === "limit" ? entry.limitPrice : undefined;
  priceRefusals(exit, limit, refusals);
  if (!(positive(exit.takeProfit) && positive(exit.stop))) return undefined;
  const shares = Number.isFinite(entry.quantity) && entry.quantity > 0 ? entry.quantity : undefined;
  if (!positive(limit) || shares === undefined) {
    return { takeProfit: exit.takeProfit, stop: exit.stop };
  }
  return {
    takeProfit: exit.takeProfit,
    stop: exit.stop,
    takeProfitDollars: ((cents(exit.takeProfit) - cents(limit)) * shares) / 100,
    stopDollars: ((cents(exit.stop) - cents(limit)) * shares) / 100,
  };
}

/**
 * A stop-limit whose limit sits on the far side of its stop may never fill once triggered: a buy
 * triggers as the price rises through the stop, and a limit below the stop then asks for a price
 * the market has just left. A warning, never a refusal (the member may mean it).
 */
export function stopLimitWarning(
  action: "buy" | "sell",
  stop: number,
  limit: number,
): string | undefined {
  if (action === "buy" && cents(limit) < cents(stop)) {
    return `The limit (${usd(limit)}) is below the stop (${usd(stop)}) — once the stop triggers, this buy may not fill.`;
  }
  if (action === "sell" && cents(limit) > cents(stop)) {
    return `The limit (${usd(limit)}) is above the stop (${usd(stop)}) — once the stop triggers, this sell may not fill.`;
  }
  return undefined;
}
