import { AlpacaApiError } from "../alpaca/alpaca-trading-client.js";
import type { AlpacaTradingTransport } from "../alpaca/trading-transport.js";

/** A news article, trimmed to what the sentiment pipeline needs. */
export interface NewsArticle {
  readonly headline: string;
  readonly summary: string;
  readonly symbols: readonly string[];
  readonly createdAt: string;
}

interface RawArticle {
  readonly headline?: string;
  readonly summary?: string;
  readonly symbols?: string[];
  readonly created_at?: string;
}

/**
 * Reads recent market news from Alpaca's news API (`/v1beta1/news` on the data host).
 * Uses the same key/secret transport as trading — point it at `https://data.alpaca.markets`.
 * All HTTP goes through the injected transport, so this is unit-testable with a fake.
 */
export class AlpacaNewsClient {
  private readonly transport: AlpacaTradingTransport;

  constructor(transport: AlpacaTradingTransport) {
    this.transport = transport;
  }

  async getNews(symbols: readonly string[], limit = 20): Promise<NewsArticle[]> {
    const query = `?symbols=${symbols.join(",")}&limit=${limit}&sort=desc`;
    const response = await this.transport.get(`/v1beta1/news${query}`);
    if (response.status < 200 || response.status >= 300) {
      throw new AlpacaApiError(response.status, response.body);
    }
    const body = response.body as { news?: RawArticle[] };
    return (body.news ?? []).map((article) => ({
      headline: article.headline ?? "",
      summary: article.summary ?? "",
      symbols: article.symbols ?? [],
      createdAt: article.created_at ?? "",
    }));
  }
}
