import type { AlpacaTradingClient } from "../alpaca/alpaca-trading-client.js";

/**
 * The trading smoke test — `scripts/smoke.sh` for the order path.
 *
 * Eric's framing, and it is the right one: Sauron's reserve is a *feature*, not a bug. He should stay
 * patient and wait for genuinely ripe conditions. But that leaves a hole — if the bot only acts a
 * handful of times a season, the first time the live order path runs is also the first time it
 * matters, and any bug in it costs a real signal. So the two concerns are decoupled: **verifying the
 * machinery must not depend on a strategy firing.**
 *
 * One share out, one share back. Small enough to be free, real enough to prove every link in the
 * chain: credentials resolve, the market clock is honest, an order reaches Alpaca, a fill comes back,
 * a position appears, and the round trip closes. Anything wrong shows up here rather than in the
 * middle of a play worth taking.
 *
 * It is deliberately NOT a persona: it takes no view, has no strategy, and should never appear on a
 * leaderboard as skill. It is an instrument.
 */

export interface SmokeTradeOptions {
  readonly symbol: string;
  /** Shares per leg. Capped hard — this is an instrument, not a position. */
  readonly quantity?: number;
  /** Skip the round trip's closing leg, leaving the share held (for inspecting a real position). */
  readonly holdOpen?: boolean;
}

interface SmokeTradeLeg {
  readonly side: "buy" | "sell";
  readonly orderId: string;
  readonly status: string;
  readonly filledQuantity: number;
  readonly filledPrice?: number;
}

export interface SmokeTradeResult {
  readonly symbol: string;
  readonly quantity: number;
  readonly legs: SmokeTradeLeg[];
  /** Populated only when both legs filled at a known price. */
  readonly realized?: number;
  readonly notes: string[];
}

/** Hard ceiling. A smoke test that can move real size is not a smoke test. */
export const MAX_SMOKE_QUANTITY = 5;

export class SmokeTradeRefused extends Error {}

const leg = (
  side: "buy" | "sell",
  order: Awaited<ReturnType<AlpacaTradingClient["placeOrder"]>>,
) => ({
  side,
  orderId: order.id,
  status: order.status,
  filledQuantity: Number(order.filled_qty ?? "0"),
  ...(order.filled_avg_price ? { filledPrice: Number(order.filled_avg_price) } : {}),
});

/**
 * Run the round trip. Refuses rather than guesses when a precondition is unmet — a smoke test that
 * silently degrades tells you nothing, which is worse than telling you it could not run.
 */
export async function runSmokeTrade(
  client: AlpacaTradingClient,
  options: SmokeTradeOptions,
): Promise<SmokeTradeResult> {
  const quantity = options.quantity ?? 1;
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_SMOKE_QUANTITY) {
    throw new SmokeTradeRefused(
      `quantity must be a whole number between 1 and ${MAX_SMOKE_QUANTITY} — got ${quantity}`,
    );
  }
  if (!(await client.isMarketOpen())) {
    throw new SmokeTradeRefused(
      "the market is closed — a market order would queue to the next open and prove nothing now",
    );
  }

  const notes: string[] = [];
  const legs: SmokeTradeLeg[] = [];

  const bought = leg(
    "buy",
    await client.placeOrder({ symbol: options.symbol, qty: quantity, side: "buy" }),
  );
  legs.push(bought);
  if (bought.filledQuantity < quantity) {
    notes.push(
      `buy leg reported ${bought.filledQuantity}/${quantity} filled (status ${bought.status}) — a market order usually fills immediately, so investigate before trusting the path`,
    );
  }

  if (options.holdOpen) {
    notes.push("holdOpen: the closing leg was skipped, so the share is still held");
    return { symbol: options.symbol, quantity, legs, notes };
  }

  // Close only what actually filled — selling the requested size after a partial fill would open a
  // short, which is a far bigger event than the test it belongs to.
  const closable = bought.filledQuantity;
  if (closable < 1) {
    notes.push("nothing filled, so nothing to close — no sell leg was sent");
    return { symbol: options.symbol, quantity, legs, notes };
  }

  const sold = leg(
    "sell",
    await client.placeOrder({ symbol: options.symbol, qty: closable, side: "sell" }),
  );
  legs.push(sold);

  const realized =
    bought.filledPrice !== undefined && sold.filledPrice !== undefined
      ? (sold.filledPrice - bought.filledPrice) * sold.filledQuantity
      : undefined;
  if (realized === undefined) {
    notes.push(
      "one leg reported no fill price, so realized P/L is unknown rather than assumed zero",
    );
  }

  return {
    symbol: options.symbol,
    quantity,
    legs,
    ...(realized !== undefined ? { realized } : {}),
    notes,
  };
}
