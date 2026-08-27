import { AlpacaApiError } from "../../src/alpaca/alpaca-trading-client.js";
import type { AlpacaTradingTransport } from "../../src/alpaca/trading-transport.js";
import type { JsonResponse } from "../../src/http/fetch-json.js";
import { AlpacaNewsClient } from "../../src/news/alpaca-news-client.js";

class FakeTransport implements AlpacaTradingTransport {
  lastPath = "";
  constructor(private readonly response: JsonResponse) {}
  get(path: string): Promise<JsonResponse> {
    this.lastPath = path;
    return Promise.resolve(this.response);
  }
  post(_path: string, _body: unknown): Promise<JsonResponse> {
    return Promise.resolve({ status: 404, body: null });
  }
  delete(_path: string): Promise<JsonResponse> {
    return Promise.resolve({ status: 404, body: null });
  }
}

describe("AlpacaNewsClient.getNews", () => {
  it("requests the symbols and maps articles", async () => {
    const transport = new FakeTransport({
      status: 200,
      body: {
        news: [
          {
            headline: "NVDA beats estimates",
            summary: "profit surges",
            symbols: ["NVDA"],
            created_at: "2026-07-24T14:00:00Z",
          },
        ],
      },
    });
    const client = new AlpacaNewsClient(transport);

    const news = await client.getNews(["NVDA", "AAPL"]);

    expect(transport.lastPath).toContain("symbols=NVDA,AAPL");
    expect(news[0]).toMatchObject({ headline: "NVDA beats estimates", symbols: ["NVDA"] });
  });

  it("throws AlpacaApiError on a non-2xx response", async () => {
    const client = new AlpacaNewsClient(
      new FakeTransport({ status: 403, body: { message: "no" } }),
    );
    await expect(client.getNews(["NVDA"])).rejects.toBeInstanceOf(AlpacaApiError);
  });
});
