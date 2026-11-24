import type { IncomingMessage, ServerResponse } from "node:http";
import { AlpacaApiError } from "../alpaca/alpaca-trading-client.js";
import { HELD_NEWS_DAYS, type HeldNewsItem, heldNews } from "../domain/held-news.js";
import type { AlpacaNewsClient } from "../news/alpaca-news-client.js";
import type { PositionView } from "../observatory/broker-positions.js";
import { parseOccSymbol } from "../trading/option-symbols.js";
import type { Session } from "./auth/session.js";
import { resolveCurrentId } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { requireGet, sendJson } from "./page-shell.js";

/**
 * GET /api/news/held (#8203): recent news on the names the session's own paper account holds,
 * newest first. The home strip (#8189) reads the route; the game master (#8191) calls
 * `heldNewsFor`, which shares the route's cache, so the two can't tell one story two ways.
 *
 * MEMBERS ONLY, OWN BOOK. The route sits behind the auth gate in `serveWriteApis`; held names come
 * from the hub's copy of the session's own account, and the feed is read on that account's own
 * credential (`newsClientFor`), never the bots' shared key. Nothing in the request names a symbol
 * or an account: the query string is never read.
 *
 * WHAT HAPPENED, NEVER WHAT TO DO. Items are `heldNews`'s seven keys and nothing else: no score,
 * no stance, no suggested trade. A failure says so in words (`note`), never as a status code.
 *
 * RATE. One read per account per 5 minutes on success; overlapping requests share one read; a 429
 * earns exactly one retry after 1.1s (the house posture, `alpaca-options-client.ts`), never a loop.
 */
export const HELD_NEWS_PATH = "/api/news/held";
/** How long one account's answer is served without a fresh read. */
export const HELD_NEWS_FRESH_MS = 5 * 60_000;
/** The most held names one read searches; the rest are counted in `namesLeftOut`. */
export const HELD_NEWS_NAMES_MAX = 30;
/** Alpaca's news API allows at most 50 a page; dedupe and the 10-story cap work from these. */
const FEED_LIMIT = 50;
const RATE_LIMIT_PAUSE_MS = 1_100;
const DAY_MS = 86_400_000;

export const HELD_NEWS_NOTES = {
  unlinked:
    "News on what you hold loads through your own paper account, and your session isn't linked to one yet.",
  empty: "You don't hold anything yet, so there's no news on your holdings.",
  quiet: `No news on what you hold in the last ${HELD_NEWS_DAYS} days.`,
  failed: "News couldn't be read right now.",
} as const;

export interface HeldNewsAnswer {
  readonly asOf: string;
  readonly held: readonly string[];
  readonly namesLeftOut: number;
  readonly items: readonly HeldNewsItem[];
  /** Only when there is nothing to show or the read failed. */
  readonly note?: string;
  /** Only on a last good answer served after a failed read; `asOf` is that answer's own time. */
  readonly stale?: true;
}

export type HeldNewsDeps = Pick<DashboardServerConfig, "hub" | "newsClientFor" | "now">;

export interface HeldNewsOptions {
  /** Specs pass a fake pause; production waits for real. */
  readonly sleep?: (ms: number) => Promise<void>;
}

interface AccountCache {
  last?: { readonly key: string; readonly answer: HeldNewsAnswer; readonly readAt: number };
  inFlight?: { readonly key: string; readonly answer: Promise<HeldNewsAnswer> };
}

/** One cache per wired server, keyed on the config object itself (pass the same object every
 *  call), so each spec's config starts empty and production shares one. */
const caches = new WeakMap<object, Map<string, AccountCache>>();

function cacheFor(deps: object, accountId: string): AccountCache {
  let byAccount = caches.get(deps);
  if (!byAccount) {
    byAccount = new Map();
    caches.set(deps, byAccount);
  }
  let entry = byAccount.get(accountId);
  if (!entry) {
    entry = {};
    byAccount.set(accountId, entry);
  }
  return entry;
}

/** The account's names as the feed names them (a contract reads as its underlying), largest
 *  absolute market value first, so a cap keeps the names that matter most to the book. */
export function rankedHeldNames(positions: readonly PositionView[]): string[] {
  const weight = new Map<string, number>();
  for (const p of positions) {
    const name = parseOccSymbol(p.symbol)?.underlying ?? p.symbol;
    const value = Math.abs(Number.isFinite(p.marketValue) ? p.marketValue : 0);
    weight.set(name, (weight.get(name) ?? 0) + value);
  }
  return [...weight.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
}

function nothingToRead(asOf: string, note: string): HeldNewsAnswer {
  return { asOf, held: [], namesLeftOut: 0, items: [], note };
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function readOnce(
  client: AlpacaNewsClient,
  held: readonly string[],
  start: string,
  sleep: (ms: number) => Promise<void>,
) {
  try {
    return await client.getNews(held, FEED_LIMIT, start);
  } catch (error) {
    if (!(error instanceof AlpacaApiError && error.status === 429)) throw error;
    await sleep(RATE_LIMIT_PAUSE_MS);
    return client.getNews(held, FEED_LIMIT, start);
  }
}

/**
 * Held news for one account, through the route's cache. Server code other than the route (the game
 * master, #8191) calls this, never the feed directly (criterion 13).
 */
export function heldNewsFor(
  deps: HeldNewsDeps,
  accountId: string,
  options: HeldNewsOptions = {},
): Promise<HeldNewsAnswer> {
  const now = deps.now?.() ?? new Date();
  const asOf = now.toISOString();
  const client = deps.newsClientFor?.(accountId);
  // Criterion 6: no linked account, or nothing held, answers in words with no feed read.
  if (!client) return Promise.resolve(nothingToRead(asOf, HELD_NEWS_NOTES.unlinked));
  const desk = deps.hub.getState().participants.find((p) => p.id === accountId);
  const ranked = rankedHeldNames(desk?.positions ?? []);
  if (ranked.length === 0) return Promise.resolve(nothingToRead(asOf, HELD_NEWS_NOTES.empty));
  const held = ranked.slice(0, HELD_NEWS_NAMES_MAX);
  const namesLeftOut = ranked.length - held.length;
  const key = held.join(",");
  const entry = cacheFor(deps, accountId);
  if (entry.last?.key === key && now.getTime() - entry.last.readAt < HELD_NEWS_FRESH_MS) {
    return Promise.resolve(entry.last.answer);
  }
  if (entry.inFlight?.key === key) return entry.inFlight.answer;

  const read = freshRead(client, entry, { key, held, namesLeftOut, now }, options).finally(() => {
    if (entry.inFlight?.answer === read) entry.inFlight = undefined;
  });
  entry.inFlight = { key, answer: read };
  return read;
}

/** One feed read for the account; it updates the account's last good answer, or falls back to it. */
async function freshRead(
  client: AlpacaNewsClient,
  entry: AccountCache,
  want: { key: string; held: readonly string[]; namesLeftOut: number; now: Date },
  options: HeldNewsOptions,
): Promise<HeldNewsAnswer> {
  const { key, held, namesLeftOut, now } = want;
  const asOf = now.toISOString();
  try {
    const start = new Date(now.getTime() - HELD_NEWS_DAYS * DAY_MS).toISOString();
    const articles = await readOnce(client, held, start, options.sleep ?? defaultSleep);
    const items = heldNews(articles, held, now);
    const answer: HeldNewsAnswer = {
      asOf,
      held,
      namesLeftOut,
      items,
      ...(items.length === 0 ? { note: HELD_NEWS_NOTES.quiet } : {}),
    };
    entry.last = { key, answer, readAt: now.getTime() };
    return answer;
  } catch {
    if (entry.last) return { ...entry.last.answer, stale: true };
    return { asOf, held, namesLeftOut, items: [], note: HELD_NEWS_NOTES.failed };
  }
}

/** Handle `/api/news/held`. Returns true when answered. */
export async function serveHeldNewsApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
  options: HeldNewsOptions = {},
): Promise<boolean> {
  if (path !== HELD_NEWS_PATH) return false;
  if (!requireGet(req, res)) return true;
  const id = config.auth ? resolveCurrentId(session, config.resolveOwnerId) : undefined;
  if (!id) {
    sendJson(
      res,
      200,
      nothingToRead((config.now?.() ?? new Date()).toISOString(), HELD_NEWS_NOTES.unlinked),
    );
    return true;
  }
  sendJson(res, 200, await heldNewsFor(config, id, options));
  return true;
}
