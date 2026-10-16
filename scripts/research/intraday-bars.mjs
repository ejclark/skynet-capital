/**
 * Intraday bar fetch shared by the intraday studies (intraday-edges, dip-bounce): Yahoo chart bars
 * grouped into regular-hours sessions in ET, cached to disk so a re-run reads the same sample.
 *
 * The cache never expires on purpose: a study's numbers are reproducible from the file it read.
 * Delete node_modules/.cache/intraday-edges/<file> to take a fresh sample. Yahoo serves 5-minute
 * bars for the last 60 days only, which caps every 5-minute study at ~60 sessions.
 *
 * Offline research tooling: no broker credential, touches no trading path, places nothing.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const CACHE = join(process.cwd(), "node_modules", ".cache", "intraday-edges");
const UA = "skynet-capital research (ejclark83@gmail.com)";
const ET = "America/New_York";

async function cached(name, url) {
  mkdirSync(CACHE, { recursive: true });
  const path = join(CACHE, name);
  if (existsSync(path)) return JSON.parse(readFileSync(path, "utf8"));
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${url} -> ${res.status} ${res.statusText}`);
  const body = await res.json();
  writeFileSync(path, JSON.stringify(body));
  return body;
}

/** Wall-clock ET for an epoch — Yahoo returns UTC, and every study is anchored on 9:30 ET. */
const etParts = (epoch) => {
  const d = new Date(epoch * 1000);
  const [date, time] = d.toLocaleString("sv-SE", { timeZone: ET }).split(" ");
  return { date, minutes: Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5)) };
};

/** Intraday bars grouped into regular-hours sessions, in ET, oldest first. */
export async function sessions(symbol, interval, range) {
  const raw = await cached(
    `${symbol}-${interval}-${range}.json`,
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`,
  );
  const r = raw.chart?.result?.[0];
  if (!r) throw new Error(`no ${interval} data for ${symbol}`);
  const q = r.indicators.quote[0];
  const byDay = new Map();
  for (let i = 0; i < r.timestamp.length; i++) {
    if (q.open[i] == null || q.close[i] == null) continue;
    const { date, minutes } = etParts(r.timestamp[i]);
    // Regular hours only: 9:30 (570) through the last bar before 16:00. Pre/post is another game.
    if (minutes < 570 || minutes >= 960) continue;
    if (!byDay.has(date)) byDay.set(date, []);
    byDay.get(date).push({
      minutes,
      open: q.open[i],
      high: q.high[i],
      low: q.low[i],
      close: q.close[i],
      volume: q.volume[i] ?? 0,
    });
  }
  return [...byDay.entries()]
    .map(([date, bars]) => ({ date, bars: bars.sort((a, b) => a.minutes - b.minutes) }))
    .filter((s) => s.bars.length >= 6)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}
