/**
 * Daily closes from Yahoo's chart endpoint: the one fetch the edition's two writers share (#8252).
 * `scripts/edition-sectors.mjs` (the sector overview, #7077 slice 1b) and `src/scripts/edition-write.ts`
 * (the day's stories) both read closes through here, so a fix to how a bar is dated lands once.
 *
 * Split-adjusted, dividends not added back: a move is a price change, which is what the page says.
 * A bar is dated by its New York trading day, never by its UTC timestamp. A close the caller asked
 * for and Yahoo did not return is an error naming the symbol and the day, never a gap filled in.
 */

import { type EditionSectors, neededCloses, SECTOR_FUNDS } from "../domain/edition-sectors.js";
import { formatDateTime } from "../domain/intl-format.js";

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

/** Sent on every request: a generic client name, no contact address. */
const USER_AGENT = "Mozilla/5.0 (skynet-capital edition)";

/** The New York trading day a Yahoo bar's timestamp (epoch seconds) falls on. */
const nyDay = (seconds: number): string =>
  formatDateTime(new Date(seconds * 1000), "en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

/** Yahoo answers a burst with 429; a request waits this long times its attempt before retrying. */
const RETRY_MS = 2_000;
const ATTEMPTS = 4;
/** The pause between symbols when many are read in a row, so a run never reads as a burst. */
const GAP_MS = 250;

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** One GET, retried with a growing wait while Yahoo answers 429. */
async function get(url: string, fetchImpl: FetchLike, wait: (ms: number) => Promise<void>) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetchImpl(url, { headers: { "User-Agent": USER_AGENT } });
    if (res.status !== 429 || attempt === ATTEMPTS) return res;
    await wait(RETRY_MS * attempt);
  }
}

/** One close per requested date, rounded to cents. `dates` sorted, YYYY-MM-DD, all sessions. */
export async function dailyCloses(
  symbol: string,
  dates: readonly string[],
  fetchImpl: FetchLike = fetch,
  wait: (ms: number) => Promise<void> = sleep,
): Promise<Record<string, number>> {
  const first = dates[0];
  const last = dates.at(-1);
  if (!(first && last)) return {};
  const from = Math.floor(Date.parse(`${first}T00:00:00Z`) / 1000) - 86_400;
  const to = Math.floor(Date.parse(`${last}T23:59:59Z`) / 1000) + 86_400;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${from}&period2=${to}&interval=1d`;
  const res = await get(url, fetchImpl, wait);
  if (!res.ok) throw new Error(`${symbol}: ${url} -> ${res.status}`);
  const body = (await res.json()) as {
    chart?: {
      result?: { timestamp?: number[]; indicators?: { quote?: { close?: (number | null)[] }[] } }[];
    };
  };
  const r = body.chart?.result?.[0];
  const close = r?.indicators?.quote?.[0]?.close;
  if (!(r && Array.isArray(r.timestamp) && Array.isArray(close)))
    throw new Error(`${symbol}: no chart data`);
  const byDay = new Map(r.timestamp.map((t, i) => [nyDay(t), close[i]]));
  const out: Record<string, number> = {};
  for (const d of dates) {
    const c = byDay.get(d);
    if (typeof c !== "number") throw new Error(`${symbol}: no close on ${d}`);
    out[d] = Math.round(c * 100) / 100;
  }
  return out;
}

/**
 * Many symbols' closes, one symbol at a time with a short pause between (never a burst). Every
 * symbol is tried; the failures come back by name beside the closes that were read, so a caller
 * can name every gap at once rather than the first.
 */
export async function closesFor(
  symbols: readonly string[],
  dates: readonly string[],
  fetchImpl: FetchLike = fetch,
  wait: (ms: number) => Promise<void> = sleep,
): Promise<{ closes: Record<string, Record<string, number>>; failed: string[] }> {
  const closes: Record<string, Record<string, number>> = {};
  const failed: string[] = [];
  for (const [i, symbol] of symbols.entries()) {
    if (i > 0) await wait(GAP_MS);
    try {
      closes[symbol] = await dailyCloses(symbol, dates, fetchImpl, wait);
    } catch (err) {
      failed.push((err as Error).message);
    }
  }
  return { closes, failed };
}

/** The sector overview's closes for an edition dated `date`: every fund, every date it needs. */
export async function sectorCloses(
  date: string,
  fetchedOn: string,
  fetchImpl: FetchLike = fetch,
): Promise<EditionSectors> {
  const { closes, failed } = await closesFor(
    SECTOR_FUNDS.map((f) => f.fund),
    neededCloses(date),
    fetchImpl,
  );
  if (failed.length > 0) throw new Error(`sector closes missing:\n  ${failed.join("\n  ")}`);
  return {
    source: `Yahoo daily closes (split-adjusted, dividends not added back), fetched ${fetchedOn}`,
    closes,
  };
}
