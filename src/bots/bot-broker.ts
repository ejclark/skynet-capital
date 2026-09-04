import type { BotOrderSubmission } from "../adapters/alpaca-broker-adapter.js";
import { AlpacaBrokerAdapter } from "../adapters/alpaca-broker-adapter.js";
import { AlpacaTradingClient } from "../alpaca/alpaca-trading-client.js";
import { FetchAlpacaTradingTransport } from "../alpaca/trading-transport.js";
import { ALPACA_PAPER_BASE_URL, type Bot } from "./bot.js";

/**
 * Wire a bot's credentials into a live `BrokerPort` (Alpaca paper). This is the one
 * place that assembles the transport → client → adapter chain, so callers just hand it
 * a bot and get something the engine can drive. `deps` passes straight through to the
 * adapter — optional, so every existing caller is unaffected (#1211 slice 2).
 */
export function createBotBroker(
  bot: Bot,
  deps?: { onSubmitted?: (info: BotOrderSubmission) => void },
): AlpacaBrokerAdapter {
  const transport = new FetchAlpacaTradingTransport({
    baseUrl: bot.credentials.baseUrl ?? ALPACA_PAPER_BASE_URL,
    apiKey: bot.credentials.apiKey,
    apiSecret: bot.credentials.apiSecret,
  });
  return new AlpacaBrokerAdapter(new AlpacaTradingClient(transport), deps);
}
