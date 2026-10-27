/**
 * Shared plumbing for the TACO backtests (#4820): the CNN Truth Social corpus, Yahoo bars, the
 * session clock, and the small stats every table prints. Lifted out of `taco-posts.mjs` unchanged so
 * `taco-index.mjs` reads the same corpus and prices the same way — a number in one study means the
 * same thing in the other.
 *
 * Offline research tooling: no broker credential, touches no trading path, places nothing.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const CACHE = join(process.cwd(), "node_modules", ".cache", "taco-posts");
const ARCHIVE = "https://ix.cnn.io/data/truth-social/truth_archive.json";
const UA = "skynet-capital research (ejclark83@gmail.com)";

export { CACHE };

export async function cachedJson(name, url) {
  mkdirSync(CACHE, { recursive: true });
  const path = join(CACHE, name);
  if (existsSync(path)) return JSON.parse(readFileSync(path, "utf8"));
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${url} -> ${res.status} ${res.statusText}`);
  const body = await res.json();
  writeFileSync(path, JSON.stringify(body));
  return body;
}

export function plainText(html) {
  return (html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/** Original posts with text since `fromIso`; reposts ("RT: …", "RT @…") are copies and dropped. */
export async function posts(fromIso) {
  const raw = await cachedJson("truth_archive.json", ARCHIVE);
  return raw
    .filter((p) => p.created_at >= fromIso)
    .map((p) => ({
      id: p.id,
      at: p.created_at,
      url: p.url,
      text: plainText(p.content),
    }))
    .filter((p) => p.text && !/^RT[: ]/.test(p.text));
}

const ET = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/** ET calendar date and minutes-after-midnight for an epoch-ms instant. */
export function etClock(ms) {
  const parts = Object.fromEntries(ET.formatToParts(ms).map((p) => [p.type, p.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minute: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

export const REGULAR_OPEN = 9 * 60 + 30;
export const REGULAR_CLOSE = 16 * 60;

/**
 * Bars with pre/post-market, each tagged with its ET date and whether it is regular hours. Yahoo
 * serves 60-minute bars back ~730 days and 5-minute bars back 60.
 */
export async function yahooBars(symbol, interval, range) {
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}` +
    `?interval=${interval}&range=${range}&includePrePost=true`;
  // A delisted ticker (US Steel after its 2025 sale) 404s: no bars, and the event is counted as skipped.
  const raw = await cachedJson(`${symbol}-${interval}.json`, url).catch((e) => {
    if (String(e.message).includes("404")) return {};
    throw e;
  });
  const r = raw.chart?.result?.[0];
  if (!r?.timestamp) return [];
  const q = r.indicators.quote[0];
  const out = [];
  for (let i = 0; i < r.timestamp.length; i++) {
    if (q.open[i] == null || q.close[i] == null) continue;
    const t = r.timestamp[i] * 1000;
    const { date, minute } = etClock(t);
    out.push({
      t,
      date,
      regular: minute >= REGULAR_OPEN && minute < REGULAR_CLOSE,
      open: q.open[i],
      close: q.close[i],
    });
  }
  return out;
}

export const hourly = (symbol) => yahooBars(symbol, "60m", "730d");
export const fiveMinute = (symbol) => yahooBars(symbol, "5m", "60d");

/** Index of the last bar starting at or before `t`, or -1. */
export function barAt(bars, t) {
  let lo = 0;
  let hi = bars.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (bars[mid].t <= t) {
      found = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return found;
}

/**
 * Index of the closing bar (the last regular-hours bar) of the first session ending at or after
 * `fromIndex`, then `sessionsAhead` sessions further on; -1 past the data.
 */
export function sessionClose(bars, fromIndex, sessionsAhead) {
  let seen = 0;
  for (let i = fromIndex; i < bars.length; i++) {
    const closing =
      bars[i].regular &&
      (i + 1 >= bars.length || bars[i + 1].date !== bars[i].date || !bars[i + 1].regular);
    if (!closing) continue;
    if (seen === sessionsAhead) return i;
    seen++;
  }
  return -1;
}

export function summary(xs) {
  const n = xs.length;
  if (n === 0) return { n };
  const mean = xs.reduce((s, x) => s + x, 0) / n;
  const sorted = [...xs].sort((a, b) => a - b);
  const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  const sd = n > 1 ? Math.sqrt(xs.reduce((s, x) => s + (x - mean) ** 2, 0) / (n - 1)) : 0;
  const t = sd > 0 ? mean / (sd / Math.sqrt(n)) : 0;
  const win = xs.filter((x) => x > 0).length / n;
  return { n, mean, median, t, win };
}

export const bp = (x) => (x === undefined ? "—" : `${(x * 10_000).toFixed(0)}`);
export const pct = (x) => `${Math.round(x * 100)}%`;

/** Two-sided normal critical value for 5% / cells (Bonferroni), by bisection on the tail. */
export function bonferroni(cells) {
  const target = 0.05 / cells / 2;
  const tail = (z) => 0.5 * erfc(z / Math.SQRT2);
  let lo = 0;
  let hi = 10;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (tail(mid) > target) lo = mid;
    else hi = mid;
  }
  return hi;
}

/** Complementary error function (Numerical Recipes erfcc, |error| < 1.2e-7). */
function erfc(x) {
  const z = Math.abs(x);
  const t = 1 / (1 + 0.5 * z);
  const r =
    t *
    Math.exp(
      -z * z -
        1.26551223 +
        t *
          (1.00002368 +
            t *
              (0.37409196 +
                t *
                  (0.09678418 +
                    t *
                      (-0.18628806 +
                        t *
                          (0.27886807 +
                            t *
                              (-1.13520398 +
                                t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))),
    );
  return x >= 0 ? r : 2 - r;
}
