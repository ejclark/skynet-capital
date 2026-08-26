#!/usr/bin/env node
/**
 * Intraday edge study — the open, the close, and whether volatility is actually payable.
 *
 *   node scripts/research/intraday-edges.mjs NVDA
 *   node scripts/research/intraday-edges.mjs NVDA --slippage 5   # bps per side
 *
 * WHY THIS EXISTS
 *
 * Eric: "the first 30 minutes tend to also be the most volatile part of the day. Volatility is a
 * double edged sword but wielding it effectively enables us to compound interest."
 *
 * The first half is measurable and almost certainly true. The second half is the dangerous part,
 * and it is what this script is built to attack rather than confirm. **Volatility is not edge.**
 * It is the width of the distribution, and it widens the left tail exactly as much as the right.
 * A strategy that trades into it collects more variance for free and more edge only if a
 * directional signal is actually there. So every strategy below is judged on three things, in
 * this order:
 *
 *   1. Does it beat BUY-AND-HOLD over the same period? (not "is it profitable" — everything
 *      long NVDA in 2023-26 was profitable)
 *   2. Does it beat buy-and-hold PER UNIT OF RISK? (Sharpe, and exposure-adjusted return —
 *      a strategy in the market 8% of the time should not be compared raw to one always in)
 *   3. What slippage kills it? (the BREAK-EVEN cost, reported for every strategy)
 *
 * (3) is where opening-range strategies usually die and the reason this script leads with it.
 * The first 30 minutes has the widest spreads and the thinnest depth of the day; a strategy that
 * round-trips daily at the open pays that toll 252 times a year with certainty, while its edge
 * is a hypothesis. Compounding cuts both ways — that is the actual double edge of the sword,
 * and it is sharper on the cost side because costs have no variance.
 *
 * DATA: Yahoo hourly bars (~730 sessions, 3y) as the primary sample, plus 5-minute bars (60
 * sessions) where a genuine 30-minute question needs finer resolution than an hour. The 5m
 * sample is small and every table built on it says so.
 *
 * Offline research tooling: no broker credential, touches no trading path, places nothing.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { reportStrategies } from "./intraday-strategies.mjs";
import { ret, stats } from "./session-stats.mjs";

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

/** Wall-clock ET for an epoch — Yahoo returns UTC, and the whole study is anchored on 9:30 ET. */
const etParts = (epoch) => {
  const d = new Date(epoch * 1000);
  const [date, time] = d.toLocaleString("sv-SE", { timeZone: ET }).split(" ");
  return { date, minutes: Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5)) };
};

/** Intraday bars grouped into regular-hours sessions, in ET. */
async function sessions(symbol, interval, range) {
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
    // Regular hours only: 9:30 (570) through the 15:30 bar. Pre/post prints are a different game.
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

const label = (m) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/** Section 1 — is the open actually the volatile part? (Eric's premise, measured.) */
function reportVolatilityProfile(hourly) {
  console.log(
    `\n${"=".repeat(93)}\n1. WHERE THE VOLATILITY ACTUALLY IS (hourly bars, ${hourly.length} sessions)`,
  );
  console.log(
    `\n  ${"bar (ET)".padEnd(14)}${"|move|%".padStart(9)}${"range%".padStart(9)}${"share of vol".padStart(14)}${"share of range".padStart(16)}`,
  );
  const slots = new Map();
  for (const s of hourly) {
    for (const b of s.bars) {
      if (!slots.has(b.minutes)) slots.set(b.minutes, { moves: [], ranges: [], vol: 0 });
      const e = slots.get(b.minutes);
      e.moves.push(Math.abs(ret(b.open, b.close)));
      e.ranges.push(ret(b.low, b.high));
      e.vol += b.volume;
    }
  }
  const totalVol = [...slots.values()].reduce((a, e) => a + e.vol, 0);
  const totalRange = [...slots.values()].reduce((a, e) => a + stats(e.ranges).mean, 0);
  for (const [m, e] of [...slots.entries()].sort((a, b) => a[0] - b[0])) {
    const mv = stats(e.moves).mean;
    const rg = stats(e.ranges).mean;
    console.log(
      `  ${label(m).padEnd(14)}${mv.toFixed(3).padStart(9)}${rg.toFixed(3).padStart(9)}` +
        `${((100 * e.vol) / totalVol).toFixed(1).padStart(13)}%${((100 * rg) / totalRange).toFixed(1).padStart(15)}%`,
    );
  }
}

/** Collapse hourly sessions to the handful of prices every strategy below is built from. */
const toDaily = (hourly) =>
  hourly.map((s) => ({
    date: s.date,
    open: s.bars[0].open,
    close: s.bars.at(-1).close,
    firstClose: s.bars[0].close,
    lastOpen: s.bars.at(-1).open,
    bars: s.bars,
  }));

/** Section 2 — motion is not direction. Where the RETURN lives, by segment of the day. */
function reportSegments(daily) {
  console.log(`\n${"=".repeat(93)}\n2. WHERE THE RETURN IS — motion is not direction`);
  const segs = [
    ["overnight (prev close -> open)", (d, p) => (p ? ret(p.close, d.open) : null)],
    ["first hour (09:30 -> 10:30)", (d) => ret(d.open, d.firstClose)],
    ["midday (10:30 -> 15:30)", (d) => ret(d.firstClose, d.lastOpen)],
    ["final 30m (15:30 -> close)", (d) => ret(d.lastOpen, d.close)],
    ["full session (open -> close)", (d) => ret(d.open, d.close)],
  ];
  console.log(
    `\n  ${"segment".padEnd(34)}${"mean%".padStart(9)}${"sd%".padStart(8)}${"win%".padStart(7)}${"total%".padStart(10)}`,
  );
  console.log(`  ${"-".repeat(68)}`);
  for (const [name, fn] of segs) {
    const xs = daily
      .map((d, i) => fn(d, daily[i - 1]))
      .filter((v) => v != null && Number.isFinite(v));
    const s = stats(xs);
    console.log(
      `  ${name.padEnd(34)}${s.mean.toFixed(3).padStart(9)}${s.sd.toFixed(2).padStart(8)}` +
        `${s.win.toFixed(0).padStart(7)}${s.total.toFixed(1).padStart(10)}`,
    );
  }
}

/** Section 4 — the genuine 30-minute question, at 5m resolution. Small sample, says so. */
async function reportFineResolution(symbol) {
  const fine = await sessions(symbol, "5m", "60d");
  console.log(
    `\n${"=".repeat(93)}\n4. THE FIRST 30 MINUTES, at 5m resolution — SMALL SAMPLE (${fine.length} sessions)`,
  );
  console.log(`   Treat as a sanity check on the hourly result, not as evidence in its own right.`);
  const buckets = new Map();
  for (const s of fine) {
    for (const b of s.bars) {
      const k = Math.floor((b.minutes - 570) / 30) * 30 + 570;
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k).push(ret(b.low, b.high));
    }
  }
  console.log(
    `\n  ${"half-hour (ET)".padEnd(18)}${"mean 5m range%".padStart(16)}${"vs day avg".padStart(13)}`,
  );
  const dayAvg = stats([...buckets.values()].flat()).mean;
  for (const [m, xs] of [...buckets.entries()].sort((a, b) => a[0] - b[0])) {
    const s = stats(xs);
    console.log(
      `  ${label(m).padEnd(18)}${s.mean.toFixed(3).padStart(16)}${(s.mean / dayAvg).toFixed(2).padStart(12)}x`,
    );
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const symbol = (argv[0] ?? "NVDA").toUpperCase();
  const slipIdx = argv.indexOf("--slippage");
  const slip = slipIdx >= 0 ? Number(argv[slipIdx + 1]) : 5;

  const hourly = await sessions(symbol, "1h", "730d");
  console.log(
    `${symbol} intraday edges — ${hourly.length} sessions, ${hourly[0].date} .. ${hourly.at(-1).date}`,
  );
  console.log(
    `hourly bars · slippage assumption ${slip} bps per side (${2 * slip} bps per round trip)`,
  );

  reportVolatilityProfile(hourly);
  const daily = toDaily(hourly);
  reportSegments(daily);
  reportStrategies(daily, slip);

  try {
    await reportFineResolution(symbol);
  } catch (error) {
    console.log(`\n  (5m sample unavailable: ${error.message})`);
  }

  console.log(`\n${"=".repeat(93)}`);
  console.log(
    `Read the b/e bps column first. An edge that needs sub-${slip}bps execution is not an`,
  );
  console.log(`edge we can trade — it is a measurement of someone else's infrastructure.`);
}

main().catch((error) => {
  console.error(`intraday-edges failed: ${error.message}`);
  process.exit(1);
});
