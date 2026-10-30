#!/usr/bin/env node
/**
 * LEAP-on-a-dip event study: "after a steep pullback in a bearish market, buy a 12-month-plus call
 * and give it time to recover" (Eric, 2026-10-30). `dip-entry-study.mjs` already asked about dips
 * over 30 sessions; this asks over a year, the horizon the idea actually claims.
 *
 * PRICE ONLY. There is no history of long-dated option prices here, so every option number is a
 * Black-Scholes MODEL at an implied-volatility PROXY (trailing 63-session realized vol, floored at
 * 20%, re-read at every mark), with 2% paid over the model on the way in and 2% given up on the way
 * out. Rows at 0.8x and 1.25x the proxy show how much the answer leans on it.
 *
 * Episodes: a bot that is flat and sees the trigger buys at that close, then looks again only after
 * a full year, so one name's entries never overlap. Different names still sell off together, so the
 * uncertainty is a bootstrap over calendar years, never over episodes.
 *
 * SURVIVORSHIP: the first list is today's winners, which flatters any long. The second list holds
 * names that fell hard and stayed down for years. Neither list holds a delisted name, so even "all"
 * still leans optimistic.
 *
 * Every number docs/research/long-leap-dip-2026-10.md cites is printed here.
 *
 * Usage: node scripts/research/leap-dip-study.mjs
 */

import { bars } from "./market-data.mjs";
import { mean, quantile } from "./premium-fit-math.mjs";

const WINNERS = ["NVDA", "AAPL", "MSFT", "GOOG", "AMZN", "META", "AMD", "AVGO", "TSLA", "NFLX"];
const FALLEN = [
  "CSCO",
  "INTC",
  "IBM",
  "QCOM",
  "TXN",
  "MU",
  "ORCL",
  "PYPL",
  "SNAP",
  "DELL",
  "ADBE",
  "CRM",
  "SHOP",
  "ROKU",
  "ZM",
];
const NAMES = [...WINNERS, ...FALLEN];

const HIGH_WINDOW = 252; // sessions the "high" looks back
const YEAR = 252; // sessions in the forward year
const RATE = 0.04; // risk-free proxy, model legs only
const VOL_FLOOR = 0.2;
const SLIPPAGE = 0.02; // each way, on the model price

/** Standard normal CDF (Abramowitz & Stegun 26.2.17). */
function normCdf(x) {
  const coef = [0.31938153, -0.356563782, 1.781477937, -1.821255978, 1.330274429];
  const abs = Math.abs(x);
  const k = 1 / (1 + 0.2316419 * abs);
  let sum = 0;
  let power = k;
  for (const c of coef) {
    sum += c * power;
    power *= k;
  }
  const upper = 1 - (Math.exp((-abs * abs) / 2) / Math.sqrt(2 * Math.PI)) * sum;
  return x < 0 ? 1 - upper : upper;
}

const d1 = (spot, strike, years, vol) =>
  (Math.log(spot / strike) + (RATE + (vol * vol) / 2) * years) / (vol * Math.sqrt(years));

/** Black-Scholes call value; intrinsic at or past expiry. */
function callValue(spot, strike, years, vol) {
  if (years <= 0) return Math.max(spot - strike, 0);
  const a = d1(spot, strike, years, vol);
  return spot * normCdf(a) - strike * Math.exp(-RATE * years) * normCdf(a - vol * Math.sqrt(years));
}

/** The strike whose model delta is `delta`, by bisection (delta falls as the strike rises). */
function strikeForDelta(spot, years, vol, delta) {
  let low = spot * 0.1;
  let high = spot * 5;
  for (let i = 0; i < 60; i++) {
    const mid = (low + high) / 2;
    if (normCdf(d1(spot, mid, years, vol)) > delta) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

/** Annualized realized vol over the `n` sessions ending at `i`, or undefined without the history. */
function realizedVol(series, i, n = 63) {
  if (i < n) return undefined;
  const moves = [];
  for (let j = i - n + 1; j <= i; j++) moves.push(Math.log(series[j].close / series[j - 1].close));
  const average = mean(moves);
  const variance = moves.reduce((t, m) => t + (m - average) ** 2, 0) / (n - 1);
  return Math.sqrt(variance * YEAR);
}

const movingAverage = (series, i, n) => {
  if (i < n) return undefined;
  let total = 0;
  for (let j = i - n + 1; j <= i; j++) total += series[j].close;
  return total / n;
};

/** How far the close at `i` sits under its trailing high, as a negative fraction. */
function drawdown(series, i) {
  let high = 0;
  for (let j = Math.max(0, i - HIGH_WINDOW + 1); j <= i; j++) {
    high = Math.max(high, series[j].close);
  }
  return series[i].close / high - 1;
}

/**
 * One modeled LEAP from the close at `i`: buy at `delta` with `months` to expiry, sell at `takeProfit`
 * times the cost (when asked) or after `hold` sessions. Returns its return on premium.
 */
function modelLeap(series, i, { months, delta, hold, takeProfit, ivScale = 1 }) {
  const years = months / 12;
  const volAt = (j, fallback) =>
    Math.max(VOL_FLOOR, (realizedVol(series, j) ?? fallback / ivScale) * ivScale);
  const entryVol = volAt(i, VOL_FLOOR);
  const spot = series[i].close;
  const strike = strikeForDelta(spot, years, entryVol, delta);
  const paid = callValue(spot, strike, years, entryVol) * (1 + SLIPPAGE);
  let mark = 0;
  for (let k = 1; k <= hold && i + k < series.length; k++) {
    const left = Math.max(years - k / YEAR, 0);
    const vol = volAt(i + k, entryVol);
    mark = callValue(series[i + k].close, strike, left, vol) * (1 - SLIPPAGE);
    if (takeProfit && mark >= takeProfit * paid) return { roi: mark / paid - 1, days: k, hit: true };
  }
  return { roi: mark / paid - 1, days: hold, hit: false };
}

const pct = (x) => `${x >= 0 ? "+" : ""}${(x * 100).toFixed(0)}%`;
const shareOf = (values, test) => values.filter(test).length / values.length;

/** Year-clustered 90% bootstrap of mean return on premium, rows minus base: names sell off as one. */
function meanGapInterval(rows, baseRows) {
  const byYear = (list) => {
    const years = new Map();
    for (const row of list) {
      const key = row.date.slice(0, 4);
      if (!years.has(key)) years.set(key, []);
      years.get(key).push(row.roi);
    }
    return [...years.values()];
  };
  const a = byYear(rows);
  const b = byYear(baseRows);
  let seed = 7;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const resample = (groups) => {
    const out = [];
    for (let i = 0; i < groups.length; i++) {
      out.push(...groups[Math.floor(random() * groups.length)]);
    }
    return mean(out);
  };
  const gaps = [];
  for (let i = 0; i < 1000; i++) gaps.push(resample(a) - resample(b));
  return [quantile(gaps, 0.05), quantile(gaps, 0.95)];
}

const data = {};
for (const symbol of [...NAMES, "QQQ"]) data[symbol] = await bars(symbol);
const qqqDrawdown = new Map(data.QQQ.map((bar, i) => [bar.date, drawdown(data.QQQ, i)]));

/** Non-overlapping entries for one rule across `symbols`. */
function episodes(rule, symbols = NAMES) {
  return symbols.flatMap((symbol) => {
    const series = data[symbol];
    const out = [];
    let next = 0;
    for (let i = HIGH_WINDOW; i < series.length - YEAR; i++) {
      if (i < next || !realizedVol(series, i)) continue;
      if (rule(series, i, qqqDrawdown.get(series[i].date))) {
        out.push({ symbol, i, date: series[i].date });
        next = i + YEAR;
      }
    }
    return out;
  });
}

/** Every 21st session: what buying on an ordinary day did. */
const ordinaryDays = (symbols) =>
  symbols.flatMap((symbol) => {
    const series = data[symbol];
    const out = [];
    for (let i = HIGH_WINDOW; i < series.length - YEAR; i += 21) {
      if (realizedVol(series, i)) out.push({ symbol, i, date: series[i].date });
    }
    return out;
  });

const measure = (entries, shape) =>
  entries.map((entry) => {
    const series = data[entry.symbol];
    const stock = series[entry.i + YEAR].close / series[entry.i].close - 1;
    return { ...entry, stock, ...modelLeap(series, entry.i, shape) };
  });

function report(label, rows, baseRows) {
  const roi = rows.map((r) => r.roi);
  const stock = rows.map((r) => r.stock);
  const years = new Set(rows.map((r) => r.date.slice(0, 4))).size;
  const gap = baseRows ? meanGapInterval(rows, baseRows) : undefined;
  console.log(
    `${label.padEnd(46)} n=${String(rows.length).padStart(4)} yrs=${String(years).padStart(2)}` +
      ` stock med ${pct(quantile(stock, 0.5)).padStart(5)} mean ${pct(mean(stock)).padStart(5)}` +
      ` | LEAP mean ${pct(mean(roi)).padStart(5)} win ${pct(shareOf(roi, (x) => x > 0)).padStart(4)}` +
      ` lost>50% ${pct(shareOf(roi, (x) => x < -0.5)).padStart(4)}` +
      (gap ? ` | mean vs ordinary, 90% ${pct(gap[0])}..${pct(gap[1])}` : ""),
  );
}

// The shape the study settled on as its reference: 18 months, 0.70 delta, sold at double or at 6 months left.
const SHAPE = { months: 18, delta: 0.7, hold: YEAR, takeProfit: 2 };
const TRIGGERS = {
  "30%+ off high": (s, i) => drawdown(s, i) <= -0.3,
  "30%+ off high, QQQ 10%+ off high": (s, i, q) => drawdown(s, i) <= -0.3 && q <= -0.1,
  "30%+ off high, QQQ 20%+ off high": (s, i, q) => drawdown(s, i) <= -0.3 && q <= -0.2,
  "15-30% off high, above 200-day": (s, i) => {
    const d = drawdown(s, i);
    return d <= -0.15 && d > -0.3 && s[i].close > movingAverage(s, i, 200);
  },
  "30%+ off high, just reclaimed 50-day": (s, i) =>
    drawdown(s, i) <= -0.3 &&
    s[i].close > movingAverage(s, i, 50) &&
    s[i - 1].close <= movingAverage(s, i - 1, 50),
  "50%+ off high, vol 70%+ (CRWV-shaped)": (s, i) =>
    drawdown(s, i) <= -0.5 && realizedVol(s, i) >= 0.7,
};

const ordinary = measure(ordinaryDays(NAMES), SHAPE);
console.log("=== Triggers: 18-month 0.70-delta call, sold at 2x or after 12 months");
report("ordinary day (every 21 sessions)", ordinary);
for (const [label, rule] of Object.entries(TRIGGERS)) {
  report(label, measure(episodes(rule), SHAPE), ordinary);
}

console.log("\n=== Survivorship: same trigger (30%+ off, QQQ 10%+ off), by list");
for (const [label, list] of [
  ["today's winners", WINNERS],
  ["fell and stayed down", FALLEN],
]) {
  report(`ordinary day, ${label}`, measure(ordinaryDays(list), SHAPE));
  report(`trigger, ${label}`, measure(episodes(TRIGGERS["30%+ off high, QQQ 10%+ off high"], list), SHAPE));
}

const bear = episodes(TRIGGERS["30%+ off high, QQQ 10%+ off high"]);
console.log("\n=== Eras: same trigger and shape");
const bearRows = measure(bear, SHAPE);
for (const [label, from, to] of [
  ["2000-03 dot-com", "2000", "2004"],
  ["2007-09 financial crisis", "2007", "2010"],
  ["2010-19", "2010", "2020"],
  ["2020 covid", "2020", "2021"],
  ["2021-23 rate bear", "2021", "2024"],
  ["2024 on", "2024", "2030"],
]) {
  report(label, bearRows.filter((r) => r.date >= from && r.date < to));
}

console.log("\n=== Shapes: same trigger, every shape sold with 6 months left");
for (const [label, shape] of [
  ["12m 0.70, no take-profit", { months: 12, delta: 0.7, hold: 126 }],
  ["12m 0.70, sold at 2x", { months: 12, delta: 0.7, hold: 126, takeProfit: 2 }],
  ["18m 0.50, sold at 2x", { months: 18, delta: 0.5, hold: YEAR, takeProfit: 2 }],
  ["18m 0.70, sold at 2x", SHAPE],
  ["18m 0.80, sold at 2x", { months: 18, delta: 0.8, hold: YEAR, takeProfit: 2 }],
  ["18m 0.70, no take-profit", { months: 18, delta: 0.7, hold: YEAR }],
  ["24m 0.70, sold at 2x", { months: 24, delta: 0.7, hold: 378, takeProfit: 2 }],
  ["24m 0.80, sold at 2x", { months: 24, delta: 0.8, hold: 378, takeProfit: 2 }],
  ["18m 0.70, 2x, IV proxy x0.8", { ...SHAPE, ivScale: 0.8 }],
  ["18m 0.70, 2x, IV proxy x1.25", { ...SHAPE, ivScale: 1.25 }],
]) {
  report(label, measure(bear, shape));
}
// Sell half at double and let the rest run: the two halves' returns, averaged entry by entry.
for (const [label, base] of [
  ["18m 0.70, half at 2x, rest runs", { months: 18, delta: 0.7, hold: YEAR }],
  ["18m 0.80, half at 2x, rest runs", { months: 18, delta: 0.8, hold: YEAR }],
  ["24m 0.80, half at 2x, rest runs", { months: 24, delta: 0.8, hold: 378 }],
]) {
  const capped = measure(bear, { ...base, takeProfit: 2 });
  report(
    label,
    measure(bear, base).map((row, n) => ({ ...row, roi: (row.roi + capped[n].roi) / 2 })),
  );
}
const hits = bearRows.filter((r) => r.hit).map((r) => r.days);
console.log(
  `2x reached on ${pct(hits.length / bearRows.length)} of entries, median ${quantile(hits, 0.5)} sessions` +
    ` (25th ${quantile(hits, 0.25)}, 75th ${quantile(hits, 0.75)})`,
);

console.log("\n=== NVDA alone, 30%+ off high");
const nvda = measure(episodes(TRIGGERS["30%+ off high"], ["NVDA"]), SHAPE);
report("NVDA", nvda);
for (const r of nvda) console.log(`  ${r.date} stock ${pct(r.stock)} LEAP ${pct(r.roi)}`);

console.log("\n=== Today, and a modeled premium (realized-vol proxy, NOT a live quote)");
for (const symbol of ["NVDA", "CRWV", "QQQ", "SPY"]) {
  const series = data[symbol] ?? (await bars(symbol));
  const i = series.length - 1;
  const fifty = movingAverage(series, i, 50);
  const twoHundred = movingAverage(series, i, 200);
  const vol = realizedVol(series, i);
  console.log(
    `${symbol} ${series[i].date} close ${series[i].close.toFixed(2)} off high ${pct(drawdown(series, i))}` +
      ` 50d ${fifty.toFixed(2)} 200d ${twoHundred?.toFixed(2) ?? "n/a"} vol ${pct(vol)} sessions ${series.length}`,
  );
  if (symbol !== "NVDA" && symbol !== "CRWV") continue;
  for (const months of [12, 18, 24]) {
    const years = months / 12;
    const strike = strikeForDelta(series[i].close, years, vol, 0.7);
    const premium = callValue(series[i].close, strike, years, vol);
    console.log(
      `  ${months}m 0.70: strike ~${strike.toFixed(0)} premium ~${premium.toFixed(2)}` +
        ` (${pct(premium / series[i].close)} of spot), expiry breakeven ${pct((strike + premium) / series[i].close - 1)},` +
        ` leverage ~${((0.7 * series[i].close) / premium).toFixed(1)}x`,
    );
  }
}
