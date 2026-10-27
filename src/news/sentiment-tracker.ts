import type { MarketContext } from "../domain/types.js";
import type { NewsArticle } from "./alpaca-news-client.js";
import { scoreSentiment } from "./sentiment-scorer.js";

/**
 * Maintains a rolling news-sentiment score per symbol and overlays it onto a `MarketContext`
 * so the news personas (News Fader, Retail, Rumor) can assess it. Each ingested article is
 * scored once and attributed to the tracked symbols it mentions. Pure/stateful — testable
 * without a network.
 *
 * EACH ARTICLE COUNTS ONCE (#4781). The news poll re-reads the newest 20 stories every minute;
 * without a seen-article check the window filled with copies of the newest one or two, and a
 * "last 10 articles" average was really one story counted ten times. The tracker remembers the
 * last `SEEN_LIMIT` articles it counted — far more than one poll returns, so a story still in the
 * newest 20 is never counted again even after it rolls out of a symbol's window — and that memory
 * is persisted beside the windows so a restart does not re-count either.
 */

/** How many counted articles the tracker remembers. A poll returns 20; this is 25 polls' worth of
 *  distinct stories, and a few KB in the state DB. */
const SEEN_LIMIT = 500;

/** The source's id, or — for a source with none — when it was published and what it said. */
function articleKey(article: NewsArticle): string {
  return article.id ?? `${article.createdAt}|${article.headline}`;
}

export class SentimentTracker {
  private readonly window: number;
  private readonly scores = new Map<string, number[]>();
  /** Keys of the articles counted, oldest first; a Set for the lookup, the array for the order. */
  private readonly seen = new Set<string>();
  private readonly seenOrder: string[] = [];

  constructor(window = 10) {
    this.window = Math.max(1, window);
  }

  /** One poll's articles, oldest first — the poll lists newest first, and a full window should keep
   *  the newest stories, not the oldest of the batch. */
  ingestAll(articles: readonly NewsArticle[], universe: ReadonlySet<string>): void {
    const oldestFirst = [...articles].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    for (const article of oldestFirst) this.ingest(article, universe);
  }

  /** Score an article and attribute it to each of its symbols that we're tracking — once: an
   *  article already counted is skipped. */
  ingest(article: NewsArticle, universe: ReadonlySet<string>): void {
    const key = articleKey(article);
    if (this.seen.has(key)) return;
    this.remember(key);
    const score = scoreSentiment(`${article.headline} ${article.summary}`);
    for (const symbol of article.symbols) {
      if (universe.has(symbol)) {
        this.record(symbol, score);
      }
    }
  }

  private remember(key: string): void {
    this.seen.add(key);
    this.seenOrder.push(key);
    while (this.seenOrder.length > SEEN_LIMIT) {
      const oldest = this.seenOrder.shift();
      if (oldest !== undefined) this.seen.delete(oldest);
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

  /** The keys of the articles already counted, oldest first, for durable persistence. */
  seenArticles(): readonly string[] {
    return [...this.seenOrder];
  }

  /** Seed the tracker from a durable snapshot (e.g. at boot, after a restart) — additive, called
   *  before any live articles are ingested. Each series is trimmed to the configured window, and
   *  `seen` (the articles already counted) keeps a re-poll from counting them again. A snapshot
   *  written before #4781 has no `seen`: its windows may hold repeats, which roll out as distinct
   *  stories arrive. */
  restore(
    entries: Readonly<Record<string, readonly number[]>>,
    seen: readonly string[] = [],
  ): void {
    for (const [symbol, series] of Object.entries(entries)) {
      this.scores.set(symbol, series.slice(-this.window));
    }
    for (const key of seen) {
      if (!this.seen.has(key)) this.remember(key);
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
