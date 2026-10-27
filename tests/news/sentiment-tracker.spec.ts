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

  // #4781: every news poll re-reads the newest 20 articles, so a story already counted comes back
  // each minute. The window holds distinct stories, never copies of the newest one.
  describe("each article counts once (#4781)", () => {
    const nvda = new Set(["NVDA"]);
    const story = (id: string, headline: string, createdAt: string): NewsArticle => ({
      id,
      headline,
      summary: "",
      symbols: ["NVDA"],
      createdAt,
    });
    const surge = story("1", "NVDA surges", "2026-07-24T14:00:00Z"); // +1
    const plunge = story("2", "NVDA plunges", "2026-07-24T14:05:00Z"); // -1

    it("skips an article it already ingested, so a repeat poll moves nothing", () => {
      const tracker = new SentimentTracker();
      for (let poll = 0; poll < 5; poll++) tracker.ingestAll([plunge, surge], nvda);
      expect(tracker.snapshot().NVDA).toEqual([1, -1]);
      expect(tracker.sentiment("NVDA")).toBeCloseTo(0, 10);
    });

    it("tells two id-less articles apart by time and headline, and a repeat of one by the same", () => {
      const tracker = new SentimentTracker();
      const bare = (headline: string) => article(headline, ["NVDA"]);
      tracker.ingest(bare("NVDA surges"), nvda);
      tracker.ingest(bare("NVDA plunges"), nvda);
      tracker.ingest(bare("NVDA surges"), nvda);
      expect(tracker.snapshot().NVDA).toEqual([1, -1]);
    });

    it("ingests a poll oldest first, so a full window keeps the newest stories", () => {
      const tracker = new SentimentTracker(1);
      tracker.ingestAll([plunge, surge], nvda); // the poll's newest-first order
      expect(tracker.snapshot().NVDA).toEqual([-1]);
    });

    it("remembers what it has seen across a restart", () => {
      const before = new SentimentTracker();
      before.ingestAll([surge, plunge], nvda);
      const after = new SentimentTracker();
      after.restore(before.snapshot(), before.seenArticles());
      after.ingestAll([plunge, surge], nvda);
      expect(after.snapshot().NVDA).toEqual([1, -1]);
    });

    it("keeps a bounded memory of seen articles, newest last", () => {
      const tracker = new SentimentTracker();
      for (let i = 0; i < 600; i++) {
        tracker.ingest(story(String(i), "NVDA flat", "2026-07-24T14:00:00Z"), nvda);
      }
      const seen = tracker.seenArticles();
      expect(seen).toHaveLength(500);
      expect(seen.at(-1)).toBe("599");
    });
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
