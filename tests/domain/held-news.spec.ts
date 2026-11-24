import { HELD_NEWS_MAX, heldNews } from "../../src/domain/held-news.js";
import type { NewsArticle } from "../../src/news/alpaca-news-client.js";

const NOW = new Date("2026-11-24T14:05:00Z");

function article(over: Partial<NewsArticle> & { id: string }): NewsArticle {
  return {
    headline: `Story ${over.id}`,
    summary: "a summary the strip never shows",
    symbols: ["NVDA"],
    createdAt: "2026-11-24T13:58:00Z",
    url: `https://news.example.com/${over.id}`,
    source: "benzinga",
    ...over,
  };
}

describe("heldNews", () => {
  // Criterion 1: held names only, newest first, each with headline, source, time, https link, names.
  it("keeps stories on held names, newest first, with their source, time, link and names", () => {
    const items = heldNews(
      [
        article({ id: "1", createdAt: "2026-11-23T10:00:00Z", symbols: ["SPY"] }),
        article({ id: "2", createdAt: "2026-11-24T13:58:00Z", symbols: ["NVDA", "AMD"] }),
        article({ id: "3", symbols: ["TSLA"] }),
      ],
      ["NVDA", "SPY"],
      NOW,
    );
    expect(items.map((i) => i.id)).toEqual(["alpaca-2", "alpaca-1"]);
    expect(items[0]).toEqual({
      id: "alpaca-2",
      headline: "Story 2",
      url: "https://news.example.com/2",
      source: "benzinga",
      at: "2026-11-24T13:58:00.000Z",
      symbols: ["NVDA"],
      evidence: "reported",
    });
  });

  it("drops stories older than 7 days", () => {
    const items = heldNews(
      [article({ id: "old", createdAt: "2026-11-17T14:04:59Z" })],
      ["NVDA"],
      NOW,
    );
    expect(items).toEqual([]);
  });

  // Criterion 2: a contract's underlying is the held name the caller passes; a story names it.
  it("lists the underlying a story names in its symbols", () => {
    const items = heldNews([article({ id: "1", symbols: ["aapl"] })], ["AAPL"], NOW);
    expect(items[0]?.symbols).toEqual(["AAPL"]);
  });

  // Criterion 3: never shown without its source.
  it("drops a story with no https link, an empty headline or a time that does not parse", () => {
    const items = heldNews(
      [
        article({ id: "http", url: "http://news.example.com/x" }),
        article({ id: "nourl", url: undefined }),
        article({ id: "junk", url: "not a url" }),
        article({ id: "blank", headline: "   " }),
        article({ id: "time", createdAt: "yesterday-ish" }),
        article({ id: "ok" }),
      ],
      ["NVDA"],
      NOW,
    );
    expect(items.map((i) => i.id)).toEqual(["alpaca-ok"]);
  });

  it("names the link's hostname when the feed gives no source", () => {
    const items = heldNews([article({ id: "1", source: undefined })], ["NVDA"], NOW);
    expect(items[0]?.source).toBe("news.example.com");
  });

  // Criterion 4: one story once, keeping the earliest.
  it("lists one story once by id or by headline folded for case and punctuation", () => {
    const items = heldNews(
      [
        article({ id: "9", headline: "Nvidia beats, again!", createdAt: "2026-11-24T12:00:00Z" }),
        article({ id: "9", headline: "Nvidia beats, again!", createdAt: "2026-11-24T13:00:00Z" }),
        article({ id: "10", headline: "NVIDIA BEATS AGAIN", createdAt: "2026-11-24T13:30:00Z" }),
      ],
      ["NVDA"],
      NOW,
    );
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe("alpaca-9");
    expect(items[0]?.at).toBe("2026-11-24T12:00:00.000Z");
  });

  it("returns at most 10 stories", () => {
    const many = Array.from({ length: 14 }, (_, n) =>
      article({ id: String(n), createdAt: new Date(NOW.getTime() - n * 60_000).toISOString() }),
    );
    const items = heldNews(many, ["NVDA"], NOW);
    expect(items).toHaveLength(HELD_NEWS_MAX);
    expect(items[0]?.id).toBe("alpaca-0");
  });

  // Criterion 12: what happened, never what to do.
  it("carries exactly the seven keys: no score, stance, rating or suggested action", () => {
    const [item] = heldNews([article({ id: "1" })], ["NVDA"], NOW);
    expect(Object.keys(item ?? {}).sort()).toEqual(
      ["at", "evidence", "headline", "id", "source", "symbols", "url"].sort(),
    );
  });
});
