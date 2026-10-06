import type { AlpacaBrokerAdapter, BotOrderSubmission } from "../adapters/alpaca-broker-adapter.js";
import { AlpacaOptionMarket } from "../adapters/alpaca-option-market.js";
import type { OptionOrderTiming } from "../adapters/alpaca-option-order-flow.js";
import { PendingOptionOrders } from "../adapters/pending-option-orders.js";
import { PendingShareOrders } from "../adapters/pending-share-orders.js";
import type { AlpacaOptionsClient } from "../alpaca/alpaca-options-client.js";
import type { AlpacaCredentials } from "../alpaca/credentials.js";
import type { UnsettledOrder } from "../autonomous/decision-db-settlements.js";
import type { OrderSettlement } from "../domain/order-settlement.js";
import type {
  OptionMarket,
  OptionMarketRequest,
  OrderIntent,
  OrderResult,
  Portfolio,
} from "../domain/types.js";
import type { BrokerPort, OpenShareOrder } from "../ports/broker.js";
import type { OptionMarketPort, OptionOrderTracker } from "../ports/option-market.js";
import type { Bot } from "./bot.js";
import { botOptionsClient, createBotBroker } from "./bot-broker.js";

/** Passed straight through to `createBotBroker` on every (re)build — see there and
 *  `alpaca-broker-adapter.ts` for what fires and when (#1211 slice 2). */
export interface SwappableBotBrokerDeps {
  readonly onSubmitted?: (info: BotOrderSubmission) => void;
  /** An option quote read that failed (`AlpacaOptionMarket`), for a log line. Default: silent. */
  readonly onOptionReadError?: (what: string, error: unknown) => void;
  /** The option flow's waits — specs pass zeros so a submit runs instantly. */
  readonly optionOrderTiming?: Partial<OptionOrderTiming>;
  /** What an order a submit left `working` became once the broker ended it (#4650). */
  readonly onSettled?: (settlement: OrderSettlement) => void;
}

/**
 * A `BrokerPort` whose underlying Alpaca client can be rebuilt in place, so a credential
 * rotation swaps the client a bot trades with without restarting the bots process — and
 * therefore without losing that bot's (or any other bot's) in-memory momentum/sentiment/
 * cooldown state, none of which lives here or is touched by a swap.
 *
 * Satisfies the same `BrokerPort` interface `createBotBroker` already returns, so nothing
 * downstream (`AutonomousTrader`, `LiveCycleRunner`) needs to change — they hold this
 * object exactly as they'd hold the broker it wraps.
 *
 * It is also the bot's option market and option order tracker (#4642 slice 5), because it is the
 * one object that owns the credentials AND outlives a rotation: the quote caches and the option
 * orders a submit left working belong to the bot, not to whichever client is current — options and
 * shares alike, and those a restart hands back from the decision store (`resume`).
 */
export class SwappableBotBroker implements BrokerPort, OptionMarketPort, OptionOrderTracker {
  private readonly bot: Bot;
  private readonly deps?: SwappableBotBrokerDeps;
  private readonly pending = new PendingOptionOrders();
  private readonly pendingShares = new PendingShareOrders();
  private readonly market: AlpacaOptionMarket;
  private credentials: AlpacaCredentials;
  private current: AlpacaBrokerAdapter;

  constructor(bot: Bot, deps?: SwappableBotBrokerDeps) {
    this.bot = bot;
    if (deps) this.deps = deps;
    this.credentials = bot.credentials;
    this.current = this.build();
    // Reads with whatever credentials are in force at that moment, so a rotation needs no rebuild.
    this.market = new AlpacaOptionMarket(
      () => botOptionsClient(this.credentials),
      deps?.onOptionReadError ? { onReadError: deps.onOptionReadError } : {},
    );
  }

  private build(): AlpacaBrokerAdapter {
    return createBotBroker(
      { ...this.bot, credentials: this.credentials },
      {
        ...(this.deps?.onSubmitted ? { onSubmitted: this.deps.onSubmitted } : {}),
        ...(this.deps?.optionOrderTiming ? { optionOrderTiming: this.deps.optionOrderTiming } : {}),
        ...(this.deps?.onSettled ? { onSettled: this.deps.onSettled } : {}),
        pendingOptionOrders: this.pending,
        pendingShareOrders: this.pendingShares,
      },
    );
  }

  getPortfolio(): Promise<Portfolio> {
    return this.current.getPortfolio();
  }

  submit(order: OrderIntent): Promise<OrderResult> {
    return this.current.submit(order);
  }

  /** Forwarded, never dropped: without it the trader would read this bot as having nothing open,
   *  and buy again over an order still queued at the broker (#4678). */
  openShareOrders(): Promise<readonly OpenShareOrder[]> {
    return this.current.openShareOrders();
  }

  readOptionMarket(request: OptionMarketRequest): Promise<OptionMarket | undefined> {
    return this.market.readOptionMarket(request);
  }

  settle(): Promise<ReadonlySet<string>> {
    return this.current.settle();
  }

  /**
   * Boot, before the first cycle: the orders an earlier run left `working` that no settlement has
   * closed, back into the settle loop — the broker may have filled them while no process watched.
   * An option order is tracked by its client order id (the flow's key), so one without is skipped.
   */
  resume(orders: readonly UnsettledOrder[]): void {
    for (const order of orders) {
      if (order.option && order.clientOrderId) {
        this.pending.add({
          ...(order.orderId ? { orderId: order.orderId } : {}),
          clientOrderId: order.clientOrderId,
          underlying: order.symbol,
        });
      } else if (!order.option && order.orderId) {
        this.pendingShares.add({ orderId: order.orderId, symbol: order.symbol });
      }
    }
  }

  /** Cancels every open order this bot stamped — once at boot, before the first cycle. */
  sweepOrphanOptionOrders(): Promise<readonly string[]> {
    return this.current.sweepOrphanOptionOrders();
  }

  /** The broker's newest option expiry/assignment reports for this bot's account, read with the
   *  credentials in force now — a rotation onto another account reads that account's. */
  readOptionLifecycle(): ReturnType<AlpacaOptionsClient["readOptionLifecycleActivities"]> {
    return botOptionsClient(this.credentials).readOptionLifecycleActivities();
  }

  /** The reload seam: rebuilds the underlying client via the same, unchanged construction
   *  path a fresh boot would use — there is exactly one place credentials ever become a
   *  broker. Takes effect on the *next* call; a submit already in flight finishes on the
   *  broker it started on. The pending option orders and the quote caches carry over. */
  replaceCredentials(credentials: AlpacaCredentials): void {
    this.credentials = credentials;
    this.current = this.build();
  }
}
