import type { NewsArticle } from "../../src/news/alpaca-news-client.js";
import {
  detectTacoSignals,
  TACO_DEFAULT_WATCHLIST,
  TACO_TIMING,
  type TacoSignal,
  type TacoWindow,
  tacoWatchlist,
  tacoWindow,
} from "../../src/news/taco-signal.js";

const AT = "2026-08-28T14:00:00Z";

const article = (over: Partial<NewsArticle> = {}): NewsArticle => ({
  headline: "Trump touts DJT, promises record growth",
  summary: "",
  symbols: ["DJT"],
  createdAt: AT,
  ...over,
});

const signal = (over: Partial<TacoSignal> = {}): TacoSignal => ({
  symbol: "DJT",
  detectedAt: AT,
  strength: 1,
  headline: "Trump touts DJT",
  ...over,
});

/** Minutes after the event timestamp, as an ISO instant. */
const later = (minutes: number): string =>
  new Date(Date.parse(AT) + minutes * 60_000).toISOString();

describe("detectTacoSignals", () => {
  it("fires on a positive Trump story tagged with a watchlisted ticker", () => {
    const [found, ...rest] = detectTacoSignals(article());
    expect(rest).toHaveLength(0);
    expect(found?.symbol).toBe("DJT");
    expect(found?.detectedAt).toBe(AT);
    expect(found?.strength).toBeGreaterThan(0);
    expect(found?.headline).toContain("Trump");
  });

  it("ignores a story that never names Trump", () => {
    expect(detectTacoSignals(article({ headline: "DJT posts record growth" }))).toEqual([]);
  });

  it("does not treat 'trumped' or 'trumpet' as a mention", () => {
    expect(detectTacoSignals(article({ headline: "DJT trumped rivals on record growth" }))).toEqual(
      [],
    );
  });

  it("ignores a negative Trump story — a pump is directional", () => {
    expect(
      detectTacoSignals(article({ headline: "Trump-linked DJT plunges on downgrade and lawsuit" })),
    ).toEqual([]);
  });

  it("ignores a merely-lukewarm story below the pump floor", () => {
    // 2 positive ("record", "growth") vs 1 negative ("weak") = 0.33, under the 3:1 floor.
    expect(
      detectTacoSignals(
        article({ headline: "Trump cites DJT record growth despite weak quarter" }),
      ),
    ).toEqual([]);
  });

  it("ignores a symbol outside the watchlist", () => {
    expect(detectTacoSignals(article({ symbols: ["XYZ"] }))).toEqual([]);
  });

  it("honours an explicitly widened watchlist", () => {
    const found = detectTacoSignals(article({ symbols: ["XYZ"] }), ["DJT", "XYZ"]);
    expect(found.map((s) => s.symbol)).toEqual(["XYZ"]);
  });

  it("yields nothing when the article has no usable timestamp", () => {
    expect(detectTacoSignals(article({ createdAt: "" }))).toEqual([]);
  });

  it("emits one signal per watchlisted ticker, never a duplicate", () => {
    const found = detectTacoSignals(article({ symbols: ["DJT", "DJT", "XYZ"] }));
    expect(found.map((s) => s.symbol)).toEqual(["DJT"]);
  });

  it("defaults to the maintained watchlist rather than inferring adjacency", () => {
    expect(TACO_DEFAULT_WATCHLIST).toEqual(["DJT"]);
  });
});

describe("tacoWindow", () => {
  it("opens entry immediately on the event", () => {
    const state: TacoWindow = tacoWindow(signal(), AT);
    expect(state).toBe("enter");
  });

  it("still allows entry at the edge of the entry window", () => {
    expect(tacoWindow(signal(), later(TACO_TIMING.entryMinutes))).toBe("enter");
  });

  it("refuses a late entry — past the window the move is assumed made", () => {
    expect(tacoWindow(signal(), later(TACO_TIMING.entryMinutes + 1))).toBe("hold");
  });

  it("holds through the time-boxed life of the position", () => {
    expect(tacoWindow(signal(), later(TACO_TIMING.holdMinutes))).toBe("hold");
  });

  it("expires once the hold is over, so the play converges to flat", () => {
    expect(tacoWindow(signal(), later(TACO_TIMING.holdMinutes + 1))).toBe("expired");
  });

  it("expires a signal timestamped in the future rather than opening an endless window", () => {
    expect(tacoWindow(signal(), later(-5))).toBe("expired");
  });

  it("expires when either timestamp is unparseable", () => {
    expect(tacoWindow(signal({ detectedAt: "not-a-date" }), AT)).toBe("expired");
    expect(tacoWindow(signal(), "not-a-date")).toBe("expired");
  });

  it("enters faster than it exits — decisive on entry, time-boxed on exit", () => {
    expect(TACO_TIMING.entryMinutes).toBeLessThan(TACO_TIMING.holdMinutes);
  });
});

describe("tacoWatchlist", () => {
  it("falls back to the default when the env is unset or empty", () => {
    expect(tacoWatchlist({})).toEqual(TACO_DEFAULT_WATCHLIST);
    expect(tacoWatchlist({ SKYNET_TACO_WATCHLIST: "  ,  " })).toEqual(TACO_DEFAULT_WATCHLIST);
  });

  it("parses and upper-cases an explicit list", () => {
    expect(tacoWatchlist({ SKYNET_TACO_WATCHLIST: "djt, xyz " })).toEqual(["DJT", "XYZ"]);
  });
});
