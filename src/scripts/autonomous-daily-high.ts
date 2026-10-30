import type { AlpacaCredentials } from "../alpaca/credentials.js";
import { DailyHighFeed } from "../playbooks/daily-high-feed.js";
import { barsClient } from "./autonomous-cond-scout.js";

/**
 * The bots' daily-high feed (#6340): Alpaca's daily bars on the shared data credential — no new key,
 * no new source, the same client the shadow scout reads its bars through (`autonomous-cond-scout.ts`).
 * SPLIT-ADJUSTED on purpose: a split would otherwise read as the price falling by half, which is
 * exactly the dip the long-LEAP play buys on. Credentials are read per call, so a rotated key is
 * picked up without a restart. Demand-driven: until a playbook asks for a ticker, no request.
 */
export function dailyHighFeed(
  credentials: () => AlpacaCredentials,
  log: (line: string) => void = console.log,
): DailyHighFeed {
  return new DailyHighFeed(
    async (symbol, start, end) => {
      const bars = await barsClient(credentials()).getBars(symbol, start, end, 1000, "split");
      return bars?.map((bar) => ({ t: bar.t, c: bar.c }));
    },
    { log },
  );
}
