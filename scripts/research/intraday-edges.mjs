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

const ret = (a, b) => (b / a - 1) * 100;

function stats(xs) {
  const s = [...xs].sort((a, b) => a - b);
  const n = s.length;
  if (!n) return null;
  const mean = s.reduce((a, b) => a + b, 0) / n;
  const sd = n > 1 ? Math.sqrt(s.reduce((a, x) => a + (x - mean) ** 2, 0) / (n - 1)) : 0;
  return {
    n,
    mean,
    sd,
    median: s[Math.floor(n / 2)],
    win: (100 * s.filter((x) => x > 0).length) / n,
    // Annualized Sharpe on a per-session series. Risk-free ignored — every strategy here is
    // compared against buy-and-hold computed the same way, so the omission cancels.
    sharpe: sd > 0 ? (mean / sd) * Math.sqrt(252) : 0,
    total: s.reduce((a, b) => a + b, 0),
  };
}

/**
 * Score a strategy honestly. `trades` = round trips (each costs 2 × slippage).
 * Reports the break-even slippage — the cost at which the edge is exactly zero.
 */
function score(name, perDay, tradesPerDay, slippageBps, holdFraction) {
  const s = stats(perDay);
  if (!s) return null;
  const costPct = (2 * slippageBps) / 100;
  const net = perDay.map((x, i) => x - (tradesPerDay[i] ?? 0) * costPct);
  const ns = stats(net);
  const totalTrades = tradesPerDay.reduce((a, b) => a + b, 0);
  return {
    name,
    n: s.n,
    grossMean: s.mean,
    netMean: ns.mean,
    netTotal: ns.total,
    win: s.win,
    sharpe: ns.sharpe,
    trades: totalTrades,
    exposure: holdFraction,
    // Break-even: gross total profit spread across every round trip, halved (two sides).
    breakEvenBps: totalTrades > 0 ? (s.total / totalTrades / 2) * 100 : Infinity,
  };
}

function report(rows, bh) {
  const w = (s, n) => String(s).padStart(n);
  console.log(
    `\n  ${"strategy".padEnd(34)}${w("n", 5)}${w("gross%/d", 10)}${w("net%/d", 9)}` +
      `${w("net tot%", 10)}${w("win%", 6)}${w("Sharpe", 8)}${w("trades", 8)}${w("b/e bps", 9)}`,
  );
  console.log(`  ${"-".repeat(89)}`);
  for (const r of rows.filter(Boolean)) {
    const flag = r.sharpe > bh.sharpe ? " *" : "";
    console.log(
      `  ${r.name.padEnd(34)}${w(r.n, 5)}${w(r.grossMean.toFixed(3), 10)}${w(r.netMean.toFixed(3), 9)}` +
        `${w(r.netTotal.toFixed(1), 10)}${w(r.win.toFixed(0), 6)}${w(r.sharpe.toFixed(2), 8)}` +
        `${w(r.trades, 8)}${w(r.breakEvenBps === Infinity ? "-" : r.breakEvenBps.toFixed(1), 9)}${flag}`,
    );
  }
  console.log(`  * = better risk-adjusted than buy-and-hold (Sharpe ${bh.sharpe.toFixed(2)})`);
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

/**
 * The first session to trade outside the opening hour's range, and on which side.
 * Entry is assumed AT the range edge — generous, since a real fill would be worse. The
 * strategy still loses after costs, so the generosity only strengthens the negative result.
 */
function firstBreak(day) {
  const hi = day.bars[0].high;
  const lo = day.bars[0].low;
  for (const b of day.bars.slice(1)) {
    if (b.high > hi) return { side: 1, entry: hi };
    if (b.low < lo) return { side: -1, entry: lo };
  }
  return null;
}

/** Opening-range breakout / fade: the first hour sets the range, take the break, exit at close. */
function openingRangeRows(daily, slip) {
  const breaks = daily.map(firstBreak);
  const trades = breaks.map((b) => (b ? 1 : 0));
  return [1, -1].map((dir) =>
    score(
      dir === 1 ? "opening-range BREAKOUT -> close" : "opening-range FADE -> close",
      breaks.map((b, i) => (b ? dir * b.side * ret(b.entry, daily[i].close) : 0)),
      trades,
      slip,
      trades.filter(Boolean).length / daily.length,
    ),
  );
}

/** Section 3 — every strategy, costed, against buy-and-hold. */
function reportStrategies(daily, slip) {
  console.log(
    `\n${"=".repeat(93)}\n3. STRATEGIES — each judged vs buy-and-hold, net of ${slip}bps/side`,
  );
  const bhDaily = daily.map((d, i) => (i === 0 ? 0 : ret(daily[i - 1].close, d.close)));
  const bh = stats(bhDaily);
  const rows = [
    score(
      "buy & hold (benchmark)",
      bhDaily,
      bhDaily.map(() => 0),
      slip,
      1,
    ),
    ...openingRangeRows(daily, slip),
  ];

  // First-hour direction as a signal for the rest of the day: momentum vs reversal.
  for (const dir of [1, -1]) {
    const perDay = daily.map(
      (d) => Math.sign(ret(d.open, d.firstClose)) * dir * ret(d.firstClose, d.close),
    );
    rows.push(
      score(
        dir === 1 ? "first-hour MOMENTUM -> close" : "first-hour REVERSAL -> close",
        perDay,
        daily.map(() => 1),
        slip,
        5 / 6.5,
      ),
    );
  }

  // The overnight-drift anomaly: hold only the gap, or only the session.
  rows.push(
    score(
      "hold OVERNIGHT only (close->open)",
      daily.map((d, i) => (i === 0 ? 0 : ret(daily[i - 1].close, d.open))),
      daily.map((_, i) => (i === 0 ? 0 : 1)),
      slip,
      0.3,
    ),
    score(
      "hold SESSION only (open->close)",
      daily.map((d) => ret(d.open, d.close)),
      daily.map(() => 1),
      slip,
      1,
    ),
    // "Let the amateurs trade the first hour" — the folk rule, measured.
    score(
      "skip first hour, 10:30 -> close",
      daily.map((d) => ret(d.firstClose, d.close)),
      daily.map(() => 1),
      slip,
      5 / 6.5,
    ),
    // Does the last 30 minutes predict the overnight gap?
    score(
      "last-30m sign -> hold overnight",
      daily.map((d, i) =>
        i + 1 >= daily.length
          ? 0
          : Math.sign(ret(d.lastOpen, d.close)) * ret(d.close, daily[i + 1].open),
      ),
      daily.map((_, i) => (i + 1 >= daily.length ? 0 : 1)),
      slip,
      0.3,
    ),
  );

  report(rows, bh);
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
