import type { MarketContext } from "../domain/types.js";
import type { NewsArticle } from "./alpaca-news-client.js";
import { scoreSentiment } from "./sentiment-scorer.js";

/**
 * Maintains a rolling news-sentiment score per symbol and overlays it onto a `MarketContext`
 * so the news personas (News Fader, Retail, Rumor) can assess it. Each ingested article is
 * scored once and attributed to the tracked symbols it mentions. Pure/stateful — testable
 * without a network.
 */
export class SentimentTracker {
  private readonly window: number;
  private readonly scores = new Map<string, number[]>();

  constructor(window = 10) {
    this.window = Math.max(1, window);
  }

  /** Score an article and attribute it to each of its symbols that we're tracking. */
  ingest(article: NewsArticle, universe: ReadonlySet<string>): void {
    const score = scoreSentiment(`${article.headline} ${article.summary}`);
    for (const symbol of article.symbols) {
      if (universe.has(symbol)) {
        this.record(symbol, score);
      }
    }
  }

  private record(symbol: string, score: number): void {
    const series = this.scores.get(symbol) ?? [];
    series.push(score);
    if (series.length > this.window) {
      series.shift();
    }
    this.scores.set(symbol, series);
  }

  /** Average recent sentiment for a symbol, or 0 if none seen. */
  sentiment(symbol: string): number {
    const series = this.scores.get(symbol);
    if (!series || series.length === 0) {
      return 0;
    }
    return series.reduce((sum, s) => sum + s, 0) / series.length;
  }

  /** Every symbol's current rolling score window, for durable persistence. Read-only. */
  snapshot(): Readonly<Record<string, readonly number[]>> {
    return Object.fromEntries(this.scores);
  }

  /** Seed the tracker from a durable snapshot (e.g. at boot, after a restart) — additive, called
   *  before any live articles are ingested. Each series is trimmed to the configured window. */
  restore(entries: Readonly<Record<string, readonly number[]>>): void {
    for (const [symbol, series] of Object.entries(entries)) {
      this.scores.set(symbol, series.slice(-this.window));
    }
  }

  /** Return a copy of the context with `newsSentiment` filled for every tracked symbol. */
  overlay(context: MarketContext): MarketContext {
    const newsSentiment: Record<string, number> = { ...(context.newsSentiment ?? {}) };
    for (const symbol of this.scores.keys()) {
      newsSentiment[symbol] = this.sentiment(symbol);
    }
    return { ...context, newsSentiment };
  }
}
