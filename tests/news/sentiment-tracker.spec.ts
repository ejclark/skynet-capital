import type { MarketContext } from "../../src/domain/types.js";
import type { NewsArticle } from "../../src/news/alpaca-news-client.js";
import { SentimentTracker } from "../../src/news/sentiment-tracker.js";

const article = (headline: string, symbols: string[]): NewsArticle => ({
  headline,
  summary: "",
  symbols,
  createdAt: "2026-07-24T14:00:00Z",
});

const emptyContext = (): MarketContext => ({ asOf: "t", quotes: {} });

describe("SentimentTracker", () => {
  it("attributes an article's sentiment to its tracked symbols", () => {
    const tracker = new SentimentTracker();
    tracker.ingest(article("NVDA profit surges to record", ["NVDA"]), new Set(["NVDA"]));
    expect(tracker.sentiment("NVDA")).toBeGreaterThan(0);
  });

  it("ignores symbols outside the tracked universe", () => {
    const tracker = new SentimentTracker();
    tracker.ingest(article("XYZ plunges on downgrade", ["XYZ"]), new Set(["NVDA"]));
    expect(tracker.sentiment("XYZ")).toBe(0);
  });

  it("averages recent sentiment for a symbol", () => {
    const tracker = new SentimentTracker();
    tracker.ingest(article("NVDA surges", ["NVDA"]), new Set(["NVDA"])); // +1
    tracker.ingest(article("NVDA plunges", ["NVDA"]), new Set(["NVDA"])); // -1
    expect(tracker.sentiment("NVDA")).toBeCloseTo(0, 10);
  });

  it("overlays newsSentiment onto a context", () => {
    const tracker = new SentimentTracker();
    tracker.ingest(article("NVDA beats and surges", ["NVDA"]), new Set(["NVDA"]));
    const ctx = tracker.overlay(emptyContext());
    expect(ctx.newsSentiment?.NVDA).toBeGreaterThan(0);
  });

  describe("restore/snapshot — durability across a process restart", () => {
    it("snapshot returns exactly what was ingested", () => {
      const tracker = new SentimentTracker();
      tracker.ingest(article("NVDA surges", ["NVDA"]), new Set(["NVDA"]));
      expect(tracker.snapshot().NVDA?.length).toBe(1);
    });

    it("restore seeds a fresh tracker so sentiment reads correctly with nothing re-ingested", () => {
      const tracker = new SentimentTracker();
      tracker.restore({ NVDA: [1, 1] });
      expect(tracker.sentiment("NVDA")).toBeCloseTo(1, 10);
    });

    it("trims a restored series to the current window size", () => {
      const tracker = new SentimentTracker(2);
      tracker.restore({ NVDA: [-1, 0, 1] });
      expect(tracker.snapshot().NVDA).toEqual([0, 1]);
    });
  });
});
