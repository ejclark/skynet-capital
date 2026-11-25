/**
 * HELD NEWS — recent stories on the names a member's paper account holds, newest first (#8203).
 *
 * Pure: the feed's articles, the held names and a clock go in; the stories a member sees come out.
 * The route (`src/server/held-news-route.ts`) does the reading and the caching; this decides what
 * is shown, so the home strip (#8189) and the game master (#8191) can't tell one story two ways.
 *
 * WHAT HAPPENED, NEVER WHAT TO DO. An item carries exactly `id, headline, url, source, at, symbols,
 * evidence`: no sentiment score, stance, rating or suggested trade (criterion 12; a spec pins the
 * keys). The bots' `scoreSentiment` stays off this path, and nothing is ranked beyond time.
 *
 * HONEST OR DROPPED. The headline as the feed wrote it, the feed's own source and time, an https
 * link to the story. A story missing any of those is dropped rather than shown without its source
 * (criterion 3). Every item is `reported`: press, never a primary filing — the grammar of
 * `campaign-news.ts`, whose MEASURED / REPORTED rule this reuses.
 *
 * Paper only; educational. News informs; it never places or sizes an order.
 */
import type { NewsArticle } from "../news/alpaca-news-client.js";

/** How far back a story counts as recent. */
export const HELD_NEWS_DAYS = 7;
/** The most stories one answer carries. */
export const HELD_NEWS_MAX = 10;

const DAY_MS = 86_400_000;

/** One story on a held name. The key set is the contract: nothing else rides along (criterion 12). */
export interface HeldNewsItem {
  /** `alpaca-<feed id>`. */
  readonly id: string;
  /** The headline as the feed wrote it, never re-worded. */
  readonly headline: string;
  /** The story's own https link. */
  readonly url: string;
  /** The feed's source name, else the link's hostname. */
  readonly source: string;
  /** When the feed says it was published: ISO-8601 UTC. */
  readonly at: string;
  /** Only the held names this story names, in the order they are held. */
  readonly symbols: readonly string[];
  /** Press is always reported, never measured. */
  readonly evidence: "reported";
}

/** A headline with case and punctuation folded, so a re-send with a stray comma is the same story. */
function foldHeadline(headline: string): string {
  return headline
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function httpsUrl(raw: string | undefined): URL | undefined {
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The stories from the last `HELD_NEWS_DAYS` whose feed symbols name a held name, each once (the
 * same id, or the same folded headline, keeps the earliest), newest first, at most `HELD_NEWS_MAX`.
 */
export function heldNews(
  articles: readonly NewsArticle[],
  held: readonly string[],
  now: Date,
): HeldNewsItem[] {
  const floor = now.getTime() - HELD_NEWS_DAYS * DAY_MS;
  const candidates: { item: HeldNewsItem; ms: number; fold: string }[] = [];
  for (const article of articles) {
    const headline = article.headline.trim();
    const url = httpsUrl(article.url);
    const ms = Date.parse(article.createdAt);
    // No id, no stable key to tell a re-send from a new story, so it is dropped like a bad link.
    const sourced = Boolean(headline && url && article.id);
    const recent = !Number.isNaN(ms) && ms >= floor;
    if (!(sourced && recent && url)) continue;
    const named = new Set(article.symbols.map((s) => s.toUpperCase()));
    const symbols = held.filter((s) => named.has(s.toUpperCase()));
    if (symbols.length === 0) continue;
    const source = article.source?.trim() || url.hostname;
    candidates.push({
      ms,
      fold: foldHeadline(headline),
      item: {
        id: `alpaca-${article.id}`,
        headline,
        url: url.href,
        source,
        at: new Date(ms).toISOString(),
        symbols,
        evidence: "reported",
      },
    });
  }
  // Earliest first, so the first sighting of an id or a folded headline is the one kept.
  candidates.sort((a, b) => a.ms - b.ms);
  const seenIds = new Set<string>();
  const seenHeadlines = new Set<string>();
  const kept: (typeof candidates)[number][] = [];
  for (const c of candidates) {
    if (seenIds.has(c.item.id) || seenHeadlines.has(c.fold)) continue;
    seenIds.add(c.item.id);
    seenHeadlines.add(c.fold);
    kept.push(c);
  }
  return kept
    .sort((a, b) => b.ms - a.ms)
    .slice(0, HELD_NEWS_MAX)
    .map((c) => c.item);
}
