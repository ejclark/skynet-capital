import { alpacaIntradayBars } from "../alpaca/alpaca-intraday-bars.js";
import type { AlpacaCredentials } from "../alpaca/credentials.js";
import { FetchAlpacaTradingTransport } from "../alpaca/trading-transport.js";
import { IntradayBarsFeed } from "../playbooks/intraday-bars-feed.js";
import { ALPACA_DATA_BASE_URL } from "../runtime/data-source.js";

/**
 * The bots' 5-minute bar feed (#5489): Alpaca's market-data host, read with the credential the
 * shared data connections already hold — no new key, no new source (`alpaca-intraday-bars.ts`).
 * Credentials are read per call, so a rotated key is picked up without a restart, the way the
 * cond-scout's daily-bars reader does. Demand-driven (`intraday-bars-feed.ts`): until a dark
 * playbook asks for a ticker, this makes no request at all.
 */
export function intradayBarsFeed(
  credentials: () => AlpacaCredentials,
  log: (line: string) => void = console.log,
): IntradayBarsFeed {
  return new IntradayBarsFeed(
    (symbol, start, end) =>
      alpacaIntradayBars(
        new FetchAlpacaTradingTransport({ ...credentials(), baseUrl: ALPACA_DATA_BASE_URL }),
      )(symbol, start, end),
    { log },
  );
}
