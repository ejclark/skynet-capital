import { AlpacaOptionMarket } from "../adapters/alpaca-option-market.js";
import { parseOptionsLevel } from "../adapters/alpaca-option-preflight.js";
import type { LiveNeedsReads } from "../subscriptions/subscribe-live-needs.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";

/**
 * The live reads a new subscription is judged against (`subscribe-live-needs.ts`), through the
 * SUBSCRIBED account's own broker clients — the same ones the desk uses for it, so a bot's options
 * level and chain are what its own cycles would see. A client the server has none of (offline, no
 * credentials, a test) leaves that read out, which skips its check rather than failing it.
 */
export function subscribeLiveReads(
  config: Pick<DashboardServerConfig, "optionsClientFor" | "tradingClientFor">,
  accountId: string,
): LiveNeedsReads {
  const options = config.optionsClientFor?.(accountId);
  const trading = config.tradingClientFor?.(accountId);
  return {
    ...(options
      ? {
          price: (symbol: string) => options.getUnderlyingPrice(symbol),
          optionMarket: new AlpacaOptionMarket(() => options),
        }
      : {}),
    ...(trading
      ? {
          optionsLevel: async () => {
            try {
              return parseOptionsLevel((await trading.getAccount()).options_trading_level);
            } catch {
              return undefined;
            }
          },
        }
      : {}),
  };
}
