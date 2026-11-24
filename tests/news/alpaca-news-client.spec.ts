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

  // #4781: the story's own id is how the sentiment tracker tells a re-poll from a new story.
  it("carries the article's id as a string, and leaves it off when the source sends none", async () => {
    const transport = new FakeTransport({
      status: 200,
      body: { news: [{ id: 41_870_112, headline: "a" }, { headline: "b" }] },
    });
    const news = await new AlpacaNewsClient(transport).getNews(["NVDA"]);
    expect(news[0]?.id).toBe("41870112");
    expect(news[1]).not.toHaveProperty("id");
  });

  // #8203: the held-news read shows the link and the publisher, and bounds the read by time.
  it("carries the feed's url and source, and leaves them off when the feed sends none", async () => {
    const transport = new FakeTransport({
      status: 200,
      body: {
        news: [
          { id: 1, headline: "a", url: "https://news.example.com/a", source: "benzinga" },
          { id: 2, headline: "b" },
        ],
      },
    });
    const news = await new AlpacaNewsClient(transport).getNews(["NVDA"]);
    expect(news[0]).toMatchObject({ url: "https://news.example.com/a", source: "benzinga" });
    expect(news[1]).not.toHaveProperty("url");
    expect(news[1]).not.toHaveProperty("source");
  });

  it("sends start when given, and leaves it off when not", async () => {
    const transport = new FakeTransport({ status: 200, body: { news: [] } });
    const client = new AlpacaNewsClient(transport);
    await client.getNews(["NVDA"], 50, "2026-11-17T14:05:00.000Z");
    expect(transport.lastPath).toContain("&start=2026-11-17T14%3A05%3A00.000Z");
    await client.getNews(["NVDA"]);
    expect(transport.lastPath).not.toContain("start=");
  });

  it("throws AlpacaApiError on a non-2xx response", async () => {
    const client = new AlpacaNewsClient(
      new FakeTransport({ status: 403, body: { message: "no" } }),
    );
    await expect(client.getNews(["NVDA"])).rejects.toBeInstanceOf(AlpacaApiError);
  });
});
