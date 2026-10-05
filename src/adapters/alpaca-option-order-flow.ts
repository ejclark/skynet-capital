import type {
  ContractSnapshot,
  PlaceMultiLegOrderParams,
  PlaceOptionOrderParams,
} from "../alpaca/alpaca-options-client.js";
import {
  type AlpacaAccount,
  AlpacaApiError,
  type AlpacaOrder,
  type AlpacaPosition,
} from "../alpaca/alpaca-trading-client.js";
import {
  CLIENT_ORDER_ID_PATTERN,
  optionOrderProblems,
  positionIntentOf,
} from "../domain/option-order.js";
import type { OptionOrderIntent, OrderIntent, OrderResult, Side } from "../domain/types.js";
import { QUOTE_STALE_MS } from "../options/position-guidance-rules.js";
import type { OptionOrderTracker } from "../ports/option-market.js";
import {
  freshBandProblem,
  freshBookProblem,
  levelProblem,
  optionsBuyingPowerOf,
  ordersOn,
} from "./alpaca-option-preflight.js";
import { filledQuantityOf, isTerminalOrder, settledOptionResult } from "./alpaca-option-result.js";
import { portfolioFromAlpaca } from "./alpaca-portfolio.js";
import type { PendingOptionOrders } from "./pending-option-orders.js";

/**
 * How a bot's option order reaches Alpaca (#4642 slice 5) — the one path, behind
 * `AlpacaBrokerAdapter.submit`. Every order is a DAY limit stamped with the trader's client order
 * id, and is checked again on fresh broker state just before it is sent:
 *
 *   0. no client order id → refused, never sent unstamped;
 *   1. an order already carrying this id is ADOPTED, never sent twice;
 *   2. preflight: the account's options level (opens), no stacking on an underlying with an order
 *      already working (a close cancels this bot's own working orders there first), the book
 *      re-checked with the guards' own arithmetic, and the limit still inside a fresh quote;
 *   3. placed — one leg as a single order, two as one `mleg` order with the signed net limit
 *      exactly as decided; a POST that throws is looked up by its id before it is called failed;
 *   4–6. given `waitMs` to fill, then canceled, then re-read until the cancel is confirmed;
 *   7. reported as what the broker last said: filled, unfilled, rejected, or still `working` —
 *      which is kept pending and rechecked at the top of the next live cycle (`settle`).
 *
 * Only orders this bot stamped are ever canceled — by their client order id prefix.
 */

/** The slice of `AlpacaTradingClient` this flow reads — structural, so specs pass a fake. */
export interface OptionFlowTradingClient {
  getAccount(): Promise<AlpacaAccount>;
  getPositions(): Promise<AlpacaPosition[]>;
  listOrders(params: {
    status?: "open" | "closed" | "all";
    nested?: boolean;
    limit?: number;
  }): Promise<AlpacaOrder[]>;
  getOrder(id: string, params?: { nested?: boolean }): Promise<AlpacaOrder>;
  cancelOrder(id: string): Promise<void>;
  getOrderByClientOrderId(clientOrderId: string): Promise<AlpacaOrder | undefined>;
}

/** The slice of `AlpacaOptionsClient` this flow uses. */
export interface OptionFlowOptionsClient {
  placeOptionOrder(params: PlaceOptionOrderParams): Promise<AlpacaOrder>;
  placeMultiLegOrder(params: PlaceMultiLegOrderParams): Promise<AlpacaOrder>;
  getContractSnapshots(occSymbols: readonly string[]): Promise<Map<string, ContractSnapshot>>;
}

export interface OptionOrderTiming {
  /** How long a placed limit is given to fill before it is canceled. */
  readonly waitMs: number;
  readonly pollMs: number;
  /** Re-reads after a cancel, `settleDelayMs` apart, before it is called unconfirmed. */
  readonly settleAttempts: number;
  readonly settleDelayMs: number;
  /** The oldest feed stamp a quote may carry at submit. */
  readonly quoteMaxAgeMs: number;
}

export const DEFAULT_OPTION_ORDER_TIMING: OptionOrderTiming = {
  waitMs: 15_000,
  pollMs: 1_000,
  settleAttempts: 6,
  settleDelayMs: 500,
  quoteMaxAgeMs: QUOTE_STALE_MS,
};

/** What a submit tells the activity feed — one per leg, the leg's own contract and side. */
export interface OptionLegSubmission {
  readonly orderId: string;
  readonly symbol: string;
  readonly side: Side;
  readonly quantity: number;
  readonly at: string;
}

export interface AlpacaOptionOrderFlowDeps {
  readonly trading: OptionFlowTradingClient;
  readonly options: OptionFlowOptionsClient;
  readonly pending: PendingOptionOrders;
  /** `clientOrderIdPrefix(persona)` — what makes an order this bot's own. */
  readonly clientOrderIdPrefix: string;
  readonly onSubmitted?: (info: OptionLegSubmission) => void;
  readonly now?: () => number;
  readonly sleep?: (ms: number) => Promise<void>;
  readonly timing?: Partial<OptionOrderTiming>;
}

const NOTHING_LIVE: ReadonlySet<string> = new Set();
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const refuse = (intent: OrderIntent, reason: string): OrderResult => ({
  intent,
  status: "rejected",
  reason,
});

/** Broker statuses that mean a just-placed order is already over with nothing traded. */
const DEAD_ON_ARRIVAL: ReadonlySet<string> = new Set(["rejected", "canceled"]);

export class AlpacaOptionOrderFlow implements OptionOrderTracker {
  private readonly trading: OptionFlowTradingClient;
  private readonly options: OptionFlowOptionsClient;
  private readonly pending: PendingOptionOrders;
  private readonly prefix: string;
  private readonly onSubmitted?: (info: OptionLegSubmission) => void;
  private readonly now: () => number;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly timing: OptionOrderTiming;

  constructor(deps: AlpacaOptionOrderFlowDeps) {
    this.trading = deps.trading;
    this.options = deps.options;
    this.pending = deps.pending;
    this.prefix = deps.clientOrderIdPrefix;
    if (deps.onSubmitted) this.onSubmitted = deps.onSubmitted;
    this.now = deps.now ?? Date.now;
    this.sleep = deps.sleep ?? sleep;
    this.timing = { ...DEFAULT_OPTION_ORDER_TIMING, ...deps.timing };
  }

  async submit(order: OrderIntent): Promise<OrderResult> {
    const option = order.option;
    const cid = order.clientOrderId;
    if (!(cid && CLIENT_ORDER_ID_PATTERN.test(cid))) return refuse(order, "unstamped option order");
    const problems = optionOrderProblems(order);
    if (!option || problems.length > 0) {
      return refuse(order, `not a well-formed option order: ${problems.join("; ")}`);
    }
    let placed = await this.findByClientId(cid);
    if (!placed) {
      const refusal = await this.preflight(order, option);
      if (refusal) return refuse(order, refusal);
      const sent = await this.place(order, option, cid);
      if (typeof sent === "string") return refuse(order, sent);
      placed = sent;
    }
    if (DEAD_ON_ARRIVAL.has(placed.status) && filledQuantityOf(placed) === 0) {
      return {
        intent: order,
        status: "rejected",
        reason: `order ${placed.status}`,
        orderId: placed.id,
      };
    }
    this.announce(order, option, placed);
    const last = await this.waitOrCancel(placed);
    const result = settledOptionResult(order, last, this.timing.waitMs);
    if (result.status === "working") {
      this.pending.add({ orderId: placed.id, clientOrderId: cid, underlying: order.symbol });
    }
    return result;
  }

  /**
   * Re-reads every order a submit left working: forgets the ended, cancels the live again and
   * returns their underlyings, so the trader attempts nothing new there. An order the broker no
   * longer knows (404, e.g. after a rotation onto another account) is forgotten; any other failed
   * read keeps its underlying blocked — unknown is never read as safe. No network when nothing is
   * pending.
   */
  async settle(): Promise<ReadonlySet<string>> {
    const pending = this.pending.list();
    if (pending.length === 0) return NOTHING_LIVE;
    const live = new Set<string>();
    for (const entry of pending) {
      let order: AlpacaOrder;
      try {
        order = await this.trading.getOrder(entry.orderId, { nested: true });
      } catch (error) {
        if (error instanceof AlpacaApiError && error.status === 404) {
          this.pending.forget(entry.orderId);
        } else {
          live.add(entry.underlying);
        }
        continue;
      }
      if (isTerminalOrder(order)) {
        // A late fill is not written back into the old record: the positions show it.
        this.pending.forget(entry.orderId);
        continue;
      }
      await this.cancel(entry.orderId);
      live.add(entry.underlying);
    }
    return live;
  }

  /**
   * Cancels every open order this bot stamped — what a crashed process may have left behind. One
   * nested list read; anything without this bot's client order id prefix is never touched. Throws
   * when the list cannot be read, so the caller can say the sweep did not run.
   */
  async sweepOrphans(): Promise<readonly string[]> {
    const open = await this.trading.listOrders({ status: "open", nested: true, limit: 500 });
    const ours = open.filter((o) => o.client_order_id?.startsWith(this.prefix) === true);
    for (const order of ours) await this.cancel(order.id);
    return ours.map((o) => o.client_order_id ?? o.id);
  }

  private async findByClientId(cid: string): Promise<AlpacaOrder | undefined> {
    try {
      return await this.trading.getOrderByClientOrderId(cid);
    } catch {
      // Unknown is safe here: Alpaca refuses a second order with the same client order id, so a
      // POST below cannot duplicate one that exists — it fails and is looked up again.
      return undefined;
    }
  }

  private async preflight(
    order: OrderIntent,
    option: OptionOrderIntent,
  ): Promise<string | undefined> {
    const underlying = order.symbol;
    let account: AlpacaAccount;
    let positions: AlpacaPosition[];
    let open: AlpacaOrder[];
    let snapshots: Map<string, ContractSnapshot>;
    try {
      [account, positions, open, snapshots] = await Promise.all([
        this.trading.getAccount(),
        this.trading.getPositions(),
        this.trading.listOrders({ status: "open", nested: true, limit: 100 }),
        this.options.getContractSnapshots(option.legs.map((leg) => leg.occSymbol)),
      ]);
    } catch (error) {
      return `could not re-check the account before sending: ${String(error)}`;
    }
    const level = levelProblem(option, account.options_trading_level);
    if (level) return level;
    const fence = ordersOn(open, underlying, this.prefix);
    if (fence.any.length > 0) {
      if (option.effect === "open")
        return `an order is already working on ${underlying} — not stacking`;
      // A close must not starve behind this bot's own earlier order: cancel ours, then re-read
      // what is actually held. Someone else's order never blocks a close.
      if (fence.ours.length > 0) {
        if (!(await this.cancelAndConfirm(fence.ours))) {
          return `an earlier order on ${underlying} would not cancel — not stacking`;
        }
        try {
          positions = await this.trading.getPositions();
        } catch (error) {
          return `could not re-read positions before sending: ${String(error)}`;
        }
      }
    }
    const portfolio = portfolioFromAlpaca(account, positions);
    const buyingPower = optionsBuyingPowerOf(account.options_buying_power);
    return (
      freshBookProblem(order, option, portfolio, buyingPower) ??
      freshBandProblem(option, snapshots, this.now(), this.timing.quoteMaxAgeMs)
    );
  }

  private async place(
    order: OrderIntent,
    option: OptionOrderIntent,
    cid: string,
  ): Promise<AlpacaOrder | string> {
    const [only, second] = option.legs;
    try {
      if (only && !second) {
        return await this.options.placeOptionOrder({
          occSymbol: only.occSymbol,
          contracts: order.quantity,
          side: only.side,
          type: "limit",
          limitPrice: option.limitPrice,
          positionIntent: positionIntentOf(option.effect, only.side),
          timeInForce: "day",
          clientOrderId: cid,
        });
      }
      return await this.options.placeMultiLegOrder({
        legs: option.legs.map((leg) => ({
          occSymbol: leg.occSymbol,
          ratioQty: leg.ratio,
          side: leg.side,
          positionIntent: positionIntentOf(option.effect, leg.side),
        })),
        quantity: order.quantity,
        // Alpaca's sign, as decided: + debit paid, − credit received. Never re-signed here.
        netLimitPrice: option.limitPrice,
        timeInForce: "day",
        clientOrderId: cid,
      });
    } catch (error) {
      // The POST may have landed although its answer did not (a timeout, a 5xx after the write,
      // or Alpaca's 422 for a client order id it already holds): look before calling it failed.
      return (await this.findByClientId(cid)) ?? String(error);
    }
  }

  /** One activity line per leg, the leg's own contract — a notification, never a gate. */
  private announce(order: OrderIntent, option: OptionOrderIntent, placed: AlpacaOrder): void {
    if (!this.onSubmitted) return;
    const at = new Date(this.now()).toISOString();
    for (const [i, leg] of option.legs.entries()) {
      const orderId =
        option.legs.length === 1
          ? placed.id
          : (placed.legs?.find((l) => l.symbol === leg.occSymbol)?.id ?? `${placed.id}#${i}`);
      try {
        this.onSubmitted({
          orderId,
          symbol: leg.occSymbol,
          side: leg.side,
          quantity: order.quantity * leg.ratio,
          at,
        });
      } catch {
        // A listener's failure is its own to log; it never turns a live order into a rejection.
      }
    }
  }

  private async read(orderId: string): Promise<AlpacaOrder | undefined> {
    try {
      return await this.trading.getOrder(orderId, { nested: true });
    } catch {
      return undefined;
    }
  }

  /** A cancel the broker refuses (422: already filled or canceled; 404) is not an error here —
   *  the re-read that follows says what the order became. */
  private async cancel(orderId: string): Promise<void> {
    try {
      await this.trading.cancelOrder(orderId);
    } catch {
      // See above.
    }
  }

  /** Re-reads until the order has ended or the settle budget is spent; the last read wins. */
  private async settleOrder(orderId: string, last: AlpacaOrder): Promise<AlpacaOrder> {
    let current = last;
    for (let i = 0; i < this.timing.settleAttempts && !isTerminalOrder(current); i++) {
      await this.sleep(this.timing.settleDelayMs);
      current = (await this.read(orderId)) ?? current;
    }
    return current;
  }

  private async waitOrCancel(placed: AlpacaOrder): Promise<AlpacaOrder> {
    let last = placed;
    for (let waited = 0; waited < this.timing.waitMs && !isTerminalOrder(last); ) {
      await this.sleep(this.timing.pollMs);
      waited += this.timing.pollMs;
      last = (await this.read(placed.id)) ?? last;
    }
    if (isTerminalOrder(last)) return last;
    await this.cancel(placed.id);
    return this.settleOrder(placed.id, last);
  }

  /** Cancels each order and waits for every cancel to be confirmed. */
  private async cancelAndConfirm(orders: readonly AlpacaOrder[]): Promise<boolean> {
    let allEnded = true;
    for (const order of orders) {
      await this.cancel(order.id);
      if (!isTerminalOrder(await this.settleOrder(order.id, order))) allEnded = false;
    }
    return allEnded;
  }
}
