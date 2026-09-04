/**
 * The shared market-clock/news/price-stream connections — all resting on a single bot's
 * credentials (today: bots[0]), a documented gap in the per-bot rotation seam (#1200's own PR
 * body: "the shared market-data/news feed isn't reloaded"). Confirmed live 2026-09-04: rotating
 * the ONE bot supplying this data left isMarketOpen() 401ing forever on the old key, which blocks
 * every bot's eval loop, not just that one's — `replaceCredentials` closes it, one call updating
 * all three in place. Pulled out of run-autonomous.ts to keep that file's own line-count budget
 * (`scripts/arch-scan.mjs`'s sibling lint gate).
 */
import type { AlpacaCredentials } from "../alpaca/credentials.js";
import {
  AlpacaMarketDataStream,
  type MarketDataStreamConfig,
} from "../alpaca/market-data-stream.js";
import { FetchAlpacaTradingTransport } from "../alpaca/trading-transport.js";
import { AlpacaNewsClient, type NewsArticle } from "../news/alpaca-news-client.js";
import { ALPACA_DATA_BASE_URL } from "../runtime/data-source.js";
import { type MarketClock, startMarketClock } from "./autonomous-market-clock.js";

export interface SharedDataConnections {
  readonly marketClock: MarketClock;
  readonly marketDataStream: AlpacaMarketDataStream;
  getNews(symbols: readonly string[]): Promise<NewsArticle[]>;
  /** Applies a rotated credential to the clock, news client, and price stream at once. */
  replaceCredentials(next: AlpacaCredentials): void;
}

function buildNewsClient(creds: AlpacaCredentials): AlpacaNewsClient {
  return new AlpacaNewsClient(
    new FetchAlpacaTradingTransport({
      baseUrl: ALPACA_DATA_BASE_URL,
      apiKey: creds.apiKey,
      apiSecret: creds.apiSecret,
    }),
  );
}

export async function startSharedDataConnections(
  dataCreds: AlpacaCredentials,
  onPriceEvent: MarketDataStreamConfig["onEvent"],
  symbols: readonly string[],
): Promise<SharedDataConnections> {
  let newsClient = buildNewsClient(dataCreds);
  const marketClock = await startMarketClock(dataCreds);
  const marketDataStream = new AlpacaMarketDataStream({
    apiKey: dataCreds.apiKey,
    apiSecret: dataCreds.apiSecret,
    symbols,
    onEvent: onPriceEvent,
    onStatus: (status) => console.log(`[market-data] ${status}`),
  });
  return {
    marketClock,
    marketDataStream,
    getNews: (want) => newsClient.getNews(want),
    replaceCredentials: (next) => {
      newsClient = buildNewsClient(next);
      marketClock.replaceCredentials(next);
      marketDataStream.replaceCredentials(next.apiKey, next.apiSecret);
    },
  };
}
