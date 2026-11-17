import { AlpacaApiError } from "../alpaca/alpaca-api-error.js";
import type { AlpacaOrder, AlpacaTradingClient } from "../alpaca/alpaca-trading-client.js";
import { positionsFrom } from "../observatory/broker-positions.js";
import { isOccSymbol } from "../trading/option-symbols.js";
import {
  markPrice,
  normalizeSymbol,
  type TicketHolding,
  validateBuy,
  validateSell,
} from "../trading/order-ticket.js";
import type { Session } from "./auth/session.js";
import { resolveOwnedIds } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { readReview } from "./desk-gate.js";
import { resolveStockRefusal } from "./trade-api-routes.js";

/**
 * THE CHANGE RE-CHECK — what stands between "Send change" on a working order and the broker's
 * PATCH. Until this file, a replace ran none of the desk's checks: a working sell could be raised
 * past the shares held, a buy limit past the cash on hand, and in open mode (no sign-in
 * configured) any caller could change or cancel any account's orders. `trade-service.ts`'s
 * doctrine applies here unchanged: the form is a courtesy, the server is the gate.
 *
 * Two pieces, both reusing submit's own rules rather than restating them:
 *
 *   - `orderActionRefusal` — submit's identity gate (`verifyOwnAccount`), in submit's sentences,
 *     for cancel and replace alike. The route spec pins the sentences equal to that function's.
 *   - `reviewOrderChange` — the order as changed, against the live account: the rung lock
 *     (`resolveStockRefusal`), the no-short rule (`validateSell`), the cash rule (`validateBuy`).
 *
 * One principle settles every edge: **a change that only shrinks the order is never refused.**
 * Fewer shares, a lower buy price, a new time in force can only lower what is at stake, and
 * blocking someone from reducing a bet is a safety bug (the same reason a sell is never
 * feedback-gated). A change that grows the order is a fresh order's worth of risk, so it passes
 * what a fresh submit would.
 */

/** Submit's refusal when this session may not act on this account, else undefined. Trading
 *  switched off refuses first — that is what closes open mode, where no one has signed in —
 *  then any account outside the session's owned set. */
export function orderActionRefusal(
  participantId: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): string | undefined {
  if (!config.tradingEnabled) return "Trading is switched off for this deployment.";
  const owned = config.auth ? resolveOwnedIds(session, config) : [];
  return owned.includes(participantId) ? undefined : "You can only trade your own account.";
}

/** Only the broker's own sentence is the member's to act on; anything else collapses to a fixed
 *  line so no transport internals reach the page (the same rule `desk-gate.ts` applies). */
export function replaceRefusal(error: unknown): string {
  if (error instanceof AlpacaApiError) {
    const reason = (error.body as { message?: unknown } | null)?.message;
    if (error.status === 404) return "That order isn't on the broker any more.";
    if (error.status === 422 || error.status === 403) {
      return `The broker couldn't change this order${
        typeof reason === "string" && reason ? `: ${reason}` : "."
      }`;
    }
    return typeof reason === "string" && reason
      ? `The broker refused the change: ${reason}`
      : "The broker refused the change.";
  }
  return "Couldn't reach the broker to change this order. Try again shortly.";
}

interface OrderChangeRequest {
  readonly participantId: string;
  readonly orderId: string;
  readonly quantity?: number;
  readonly limitPrice?: number;
  readonly stopPrice?: number;
}

const priceOf = (raw: string | null | undefined): number | undefined => {
  const value = raw == null ? Number.NaN : Number(raw);
  return Number.isFinite(value) && value > 0 ? value : undefined;
};

/** The per-share price the order commits to, before and after: its limit when it has one (a
 *  limit's or stop-limit's ceiling), else its stop trigger, else the held mark (a market order
 *  queued while the market is shut). Undefined when none is known — submit's own fail-soft. */
function committedPrices(
  order: AlpacaOrder,
  change: OrderChangeRequest,
  held: TicketHolding | undefined,
): { readonly before?: number; readonly after?: number } {
  const limit = priceOf(order.limit_price);
  if (limit !== undefined) return { before: limit, after: change.limitPrice ?? limit };
  const stop = priceOf(order.stop_price);
  if (stop !== undefined) return { before: stop, after: change.stopPrice ?? stop };
  const mark = markPrice(held);
  return { before: mark, after: mark };
}

/**
 * The pure half: the refusals a stock order earns once changed, against the account's cash and
 * positions. A sell is checked only when its quantity rises; a buy only when its cost does
 * (new quantity × new price against old quantity × old price).
 *
 * The cash bound is the account's `cash` on its own, not cash plus what the old order
 * reserved: the broker's `cash` is not reduced by a working order (only buying power is), so
 * adding the old order back would count that money twice. The changed order must fit the cash
 * the way a fresh submit of it would.
 */
function changeRefusals(
  order: AlpacaOrder,
  change: OrderChangeRequest,
  account: { readonly cash: number; readonly positions: readonly TicketHolding[] },
): { readonly grows: boolean; readonly refusals: string[] } {
  const refusals: string[] = [];
  // The ticket's heads-ups ("nearly all your cash") have no review screen to land on here.
  const warnings: string[] = [];
  const held = account.positions.find((p) => p.symbol === normalizeSymbol(order.symbol));
  const before = Number(order.qty);
  const after = change.quantity ?? before;
  if (order.side === "sell") {
    const grows = after > before;
    if (grows) validateSell(after, held, refusals, warnings);
    return { grows, refusals };
  }
  const price = committedPrices(order, change, held);
  const cost = price.after === undefined ? undefined : after * price.after;
  const reserved = price.before === undefined ? undefined : before * price.before;
  const costGrows = cost !== undefined && reserved !== undefined && cost > reserved;
  if (costGrows) validateBuy(cost, account.cash, refusals, warnings);
  return { grows: after > before || costGrows, refusals };
}

/**
 * The async half: re-read the order and the live account, then run the rung lock and the pure
 * rules above. Answers the refusals, empty when the change may go to the broker.
 *
 * Options orders (an OCC symbol, or a multi-leg parent) pass on the identity gate alone: the
 * option rules (`option-ticket.ts`) price a contract off a live chain quote and options buying
 * power, which is a review of its own, not a few lines here. The broker's own buying-power check
 * still stands behind them.
 */
export async function reviewOrderChange(
  client: AlpacaTradingClient,
  change: OrderChangeRequest,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<string[]> {
  let order: AlpacaOrder;
  try {
    order = await client.getOrder(change.orderId);
  } catch (error) {
    return [replaceRefusal(error)];
  }
  if (order.order_class === "mleg" || isOccSymbol(order.symbol)) return [];
  const read = await readReview(() => Promise.all([client.getAccount(), client.getPositions()]));
  if ("refusals" in read) return read.refusals;
  const [account, positions] = read.preview;
  const checked = changeRefusals(order, change, {
    cash: Number(account.cash),
    positions: positionsFrom(positions),
  });
  if (!checked.grows) return [];
  const rung = await resolveStockRefusal(order.side, change.participantId, config, session);
  return rung ? [rung] : checked.refusals;
}
