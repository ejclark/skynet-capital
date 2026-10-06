import type { BotOrderSubmission } from "../adapters/alpaca-broker-adapter.js";
import { AlpacaBrokerAdapter } from "../adapters/alpaca-broker-adapter.js";
import {
  AlpacaOptionOrderFlow,
  type OptionOrderTiming,
} from "../adapters/alpaca-option-order-flow.js";
import { PendingOptionOrders } from "../adapters/pending-option-orders.js";
import { AlpacaOptionsClient } from "../alpaca/alpaca-options-client.js";
import { AlpacaTradingClient } from "../alpaca/alpaca-trading-client.js";
import type { AlpacaCredentials } from "../alpaca/credentials.js";
import { FetchAlpacaTradingTransport } from "../alpaca/trading-transport.js";
import { clientOrderIdPrefix } from "../autonomous/client-order-id.js";
import { ALPACA_DATA_BASE_URL } from "../runtime/data-source.js";
import { ALPACA_PAPER_BASE_URL, type Bot } from "./bot.js";

/** One transport to one Alpaca host with a bot's credentials — the paper trading host unless the
 *  credentials name another, exactly as the share broker has always been built. */
function botTransport(
  credentials: AlpacaCredentials,
  baseUrl = credentials.baseUrl ?? ALPACA_PAPER_BASE_URL,
): FetchAlpacaTradingTransport {
  return new FetchAlpacaTradingTransport({
    baseUrl,
    apiKey: credentials.apiKey,
    apiSecret: credentials.apiSecret,
  });
}

/** A bot's Trading API client: its account, positions and orders. */
export function botTradingClient(credentials: AlpacaCredentials): AlpacaTradingClient {
  return new AlpacaTradingClient(botTransport(credentials));
}

/** A bot's options client: contracts and orders on its trading host, quotes on the data host. */
export function botOptionsClient(credentials: AlpacaCredentials): AlpacaOptionsClient {
  return new AlpacaOptionsClient(
    botTransport(credentials),
    botTransport(credentials, ALPACA_DATA_BASE_URL),
  );
}

/**
 * Wire a bot's credentials into a live `BrokerPort` (Alpaca paper). This is the one
 * place that assembles the transport → client → adapter chain, so callers just hand it
 * a bot and get something the engine can drive. `deps` passes straight through to the
 * adapter — optional, so every existing caller is unaffected (#1211 slice 2).
 *
 * An option order goes through `AlpacaOptionOrderFlow` (#4642 slice 5), which knows this bot's own
 * orders by its persona's client order id prefix. `pendingOptionOrders` comes from an owner that
 * outlives this broker (`SwappableBotBroker`), so an order still working survives a rebuild.
 */
export function createBotBroker(
  bot: Bot,
  deps?: {
    onSubmitted?: (info: BotOrderSubmission) => void;
    pendingOptionOrders?: PendingOptionOrders;
    /** The option flow's waits — specs pass zeros so a submit runs instantly. */
    optionOrderTiming?: Partial<OptionOrderTiming>;
  },
): AlpacaBrokerAdapter {
  const trading = botTradingClient(bot.credentials);
  const onSubmitted = deps?.onSubmitted ? { onSubmitted: deps.onSubmitted } : {};
  const optionFlow = new AlpacaOptionOrderFlow({
    trading,
    options: botOptionsClient(bot.credentials),
    pending: deps?.pendingOptionOrders ?? new PendingOptionOrders(),
    clientOrderIdPrefix: clientOrderIdPrefix(bot.persona.id),
    ...onSubmitted,
    ...(deps?.optionOrderTiming ? { timing: deps.optionOrderTiming } : {}),
  });
  return new AlpacaBrokerAdapter(trading, { ...onSubmitted, optionFlow });
}
