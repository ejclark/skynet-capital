/**
 * THE ORDER TICKET — the pure decision layer behind "execute a trade" and "close a position".
 *
 * Every brokerage worth copying puts a **review step between intent and execution**: you say what
 * you want, the platform shows you what it will cost and what it leaves you with, and only then
 * does a second, explicit action send it. That review is where a fat-fingered quantity dies. This
 * module is that review, as a total function — no I/O, no clock, no broker — so the refusal rules
 * are unit-tested rather than trusted.
 *
 * The split that matters:
 *  - **refusals** block the order. Something is wrong and no amount of confirming fixes it.
 *  - **warnings** inform it. The order is legal but the trader should see the consequence first
 *    (market closed, closing out the whole position, spending most of the cash).
 *
 * Deliberately conservative, because this is an educational paper account and the point is to
 * teach the disciplined version of the action: no shorting from the desk (a sell is capped at what
 * you hold, matching `engine/guards.ts`), no fractional shares, no spending cash you don't have.
 */

export type TicketAction = "buy" | "sell";

export interface TicketHolding {
  readonly symbol: string;
  readonly quantity: number;
  readonly avgPrice: number;
  readonly marketValue: number;
}

export interface TicketRequest {
  readonly symbol: string;
  readonly quantity: number;
  readonly action: TicketAction;
}

export interface TicketContext {
  /** Settled cash available to spend. */
  readonly cash: number;
  readonly positions: readonly TicketHolding[];
  /**
   * Whether member-initiated trading is switched on for this deployment. Off by default: the
   * mechanism ships, the authorization to place live (paper-broker) orders from a browser session
   * is the owner's to grant. A disabled desk still renders — it just refuses to send.
   */
  readonly tradingEnabled: boolean;
  /** Market clock, when known. Undefined means "not checked" and produces no claim either way. */
  readonly marketOpen?: boolean;
  /** The viewer is acting on their own account. Anything else is refused outright. */
  readonly isSelf: boolean;
}

export interface TicketPreview {
  readonly action: TicketAction;
  readonly symbol: string;
  readonly quantity: number;
  /** True when the order may be submitted — no refusals. */
  readonly ok: boolean;
  /** Last known price per share, from the held position's mark. Undefined when unheld. */
  readonly estPrice?: number;
  /** Estimated dollars in (buy) or out (sell). Undefined when no price is known. */
  readonly estNotional?: number;
  /** Cash after the estimated fill. Undefined when no price is known. */
  readonly estCashAfter?: number;
  /** Shares of this symbol held after the fill, when the symbol is held. */
  readonly positionAfter?: number;
  readonly refusals: string[];
  readonly warnings: string[];
}

/** Ticker sanity: 1–6 uppercase letters, optionally dotted (BRK.B). Not a universe check. */
const SYMBOL_PATTERN = /^[A-Z]{1,5}(\.[A-Z]{1,2})?$/;

/** A buy that would leave under this share of cash gets a heads-up, not a refusal. */
const CASH_WARNING_SHARE = 0.9;

export function normalizeSymbol(raw: string): string {
  return raw.trim().toUpperCase();
}

/** Mark price implied by a holding — market value per share, falling back to entry cost. */
export function markPrice(holding: TicketHolding | undefined): number | undefined {
  if (!holding || holding.quantity <= 0) return undefined;
  const mark = holding.marketValue / holding.quantity;
  if (Number.isFinite(mark) && mark > 0) return mark;
  return Number.isFinite(holding.avgPrice) && holding.avgPrice > 0 ? holding.avgPrice : undefined;
}

function validateQuantity(quantity: number, refusals: string[]): void {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    refusals.push("Quantity must be a positive number of shares.");
    return;
  }
  if (!Number.isInteger(quantity)) {
    refusals.push("Whole shares only — fractional quantities aren't supported on this desk.");
  }
}

function validateSell(
  quantity: number,
  held: TicketHolding | undefined,
  refusals: string[],
  warnings: string[],
): void {
  if (!held || held.quantity <= 0) {
    refusals.push("You don't hold this symbol — this desk doesn't open short positions.");
    return;
  }
  if (quantity > held.quantity) {
    refusals.push(
      `You hold ${held.quantity.toLocaleString("en-US")} share${held.quantity === 1 ? "" : "s"} — selling more would open a short, which this desk doesn't do.`,
    );
    return;
  }
  if (quantity === held.quantity) {
    warnings.push("This closes the position completely.");
  }
}

function validateBuy(
  notional: number | undefined,
  cash: number,
  refusals: string[],
  warnings: string[],
): void {
  if (notional === undefined) {
    warnings.push("No recent price for this symbol — cost is an estimate the broker will settle.");
    return;
  }
  if (notional > cash) {
    refusals.push(
      `Estimated cost is more than your available cash — trim the quantity or free up cash first.`,
    );
    return;
  }
  if (cash > 0 && notional / cash > CASH_WARNING_SHARE) {
    warnings.push("This spends nearly all of your available cash.");
  }
}

/**
 * Review a ticket against the account. Always returns a preview — a refused order is a rendered
 * explanation, never an exception, so the desk can show *why* without a failure path.
 */
export function previewOrder(request: TicketRequest, context: TicketContext): TicketPreview {
  const symbol = normalizeSymbol(request.symbol);
  const quantity = request.quantity;
  const refusals: string[] = [];
  const warnings: string[] = [];

  if (!context.isSelf) {
    refusals.push("You can only trade your own account.");
  }
  if (!context.tradingEnabled) {
    refusals.push("Trading from the desk is switched off for this deployment.");
  }
  if (!SYMBOL_PATTERN.test(symbol)) {
    refusals.push("That doesn't look like a stock symbol.");
  }
  validateQuantity(quantity, refusals);

  const held = context.positions.find((p) => p.symbol === symbol);
  const estPrice = markPrice(held);
  const estNotional =
    estPrice !== undefined && Number.isFinite(quantity) && quantity > 0
      ? estPrice * quantity
      : undefined;

  if (request.action === "sell") {
    validateSell(quantity, held, refusals, warnings);
  } else {
    validateBuy(estNotional, context.cash, refusals, warnings);
  }

  if (context.marketOpen === false) {
    warnings.push("The market is closed — this order queues until the next session opens.");
  }

  const signedCash =
    estNotional === undefined
      ? undefined
      : context.cash + (request.action === "sell" ? estNotional : -estNotional);
  const positionAfter =
    held === undefined
      ? undefined
      : held.quantity + (request.action === "sell" ? -quantity : quantity);

  return {
    action: request.action,
    symbol,
    quantity,
    ok: refusals.length === 0,
    ...(estPrice !== undefined ? { estPrice } : {}),
    ...(estNotional !== undefined ? { estNotional } : {}),
    ...(signedCash !== undefined ? { estCashAfter: signedCash } : {}),
    ...(positionAfter !== undefined && Number.isFinite(positionAfter) ? { positionAfter } : {}),
    refusals,
    warnings,
  };
}

/** Closing a position is a sell ticket for the full held quantity — the one-click version. */
export function previewClose(
  symbol: string,
  context: TicketContext,
  quantity?: number,
): TicketPreview {
  const held = context.positions.find((p) => p.symbol === normalizeSymbol(symbol));
  return previewOrder(
    { symbol, action: "sell", quantity: quantity ?? held?.quantity ?? 0 },
    context,
  );
}

/**
 * Why rolling isn't offered yet, in one place so every surface tells the same story. A roll closes
 * one option contract and opens another in a single order; this account path is equity-only
 * (`AlpacaTradingClient.placeOrder` submits share orders), so there is no leg to roll. Rendering a
 * disabled "Roll" affordance with this reason is honest; rendering an enabled one that quietly
 * does something else would not be.
 */
export const ROLL_UNAVAILABLE_REASON =
  "Rolling moves an options contract to a later expiry or a new strike. This desk trades shares only — the options order path isn't built yet, so there's nothing to roll.";
