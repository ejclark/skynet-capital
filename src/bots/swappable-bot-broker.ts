import type { BotOrderSubmission } from "../adapters/alpaca-broker-adapter.js";
import type { AlpacaCredentials } from "../alpaca/credentials.js";
import type { OrderIntent, OrderResult, Portfolio } from "../domain/types.js";
import type { BrokerPort } from "../ports/broker.js";
import type { Bot } from "./bot.js";
import { createBotBroker } from "./bot-broker.js";

/** Passed straight through to `createBotBroker` on every (re)build — see there and
 *  `alpaca-broker-adapter.ts` for what fires and when (#1211 slice 2). */
export interface SwappableBotBrokerDeps {
  readonly onSubmitted?: (info: BotOrderSubmission) => void;
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
 */
export class SwappableBotBroker implements BrokerPort {
  private readonly bot: Bot;
  private readonly deps?: SwappableBotBrokerDeps;
  private current: BrokerPort;

  constructor(bot: Bot, deps?: SwappableBotBrokerDeps) {
    this.bot = bot;
    this.deps = deps;
    this.current = createBotBroker(bot, deps);
  }

  getPortfolio(): Promise<Portfolio> {
    return this.current.getPortfolio();
  }

  submit(order: OrderIntent): Promise<OrderResult> {
    return this.current.submit(order);
  }

  /** The reload seam: rebuilds the underlying client via the same, unchanged construction
   *  path a fresh boot would use — there is exactly one place credentials ever become a
   *  broker. Takes effect on the *next* call; a submit already in flight finishes on the
   *  broker it started on. */
  replaceCredentials(credentials: AlpacaCredentials): void {
    this.current = createBotBroker({ ...this.bot, credentials }, this.deps);
  }
}
