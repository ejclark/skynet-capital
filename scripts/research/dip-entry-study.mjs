#!/usr/bin/env node
/**
 * Dip-entry event study — "when a quality name drops hard, is that a good time to sell a
 * cash-secured put or buy a call?" (Eric, 2026-10-06, on the CRWV wheel's dark window.)
 *
 * PRICE-ONLY. What this can and cannot say:
 *  - It measures what the STOCK did after a mechanical dip: forward returns, how often a put
 *    strike finished in the money, the worst move against the position, and whether realized
 *    volatility after the dip ran above or below its level before.
 *  - It has NO history of implied volatility or option prices and NO history of news sentiment.
 *    Every premium / P&L number is MODELED with Black-Scholes at an implied-volatility PROXY
 *    (trailing 21-session realized volatility at the entry) and labelled `model`. The "bullish
 *    sentiment" half of the rule is not tested at all.
 *
 * Episodes: a bot that is flat and sees the trigger opens at that day's close and holds HOLD
 * sessions (≈ 42 calendar days — inside the wheel's 30–45 DTE). It looks again only after the
 * hold ends, so episodes never overlap. Two bots run side by side:
 *   - print-blind: opens on every trigger;
 *   - print-aware: also requires that no earnings filing date falls in [entry, expiry] — the
 *     house rule that a sold option never sits across a print.
 * The base rate is every session in the same era (overlapping windows), split the same way.
 *
 * Every number the research doc cites is printed here (docs/research/dip-entries-nvda-crwv.md):
 * the per-trigger "tests" block carries the binomial tails, the one-sample t, the realized-
 * volatility counts, the entry rate, the overlap with the 10%-drawdown entries and the VIX split.
 *
 * Usage: node scripts/research/dip-entry-study.mjs [SYM[:YYYY-MM-DD]] ... [--episodes] [--json=PATH]
 *   default: CRWV NVDA:2023-01-01 NVDA:2005-01-01
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { binomTail } from "./earnings-controls.mjs";
import { bars, earningsDates } from "./market-data.mjs";
import { annualizedVol, mean, quantile } from "./premium-fit-math.mjs";

const HOLD = 30; // sessions
const T = HOLD / 252; // years
const RATE = 0.04; // risk-free proxy for the model legs only
const HIGH_WINDOW = 60;
const SIGMA_WINDOW = 60;
const WARMUP = 20; // minimum history before any trigger can fire (CRWV is 18 months old)
const Z = { 0.2: 0.8416, 0.25: 0.6745 }; // N^-1(1 - |delta|) for a put
const FEAR = 25; // VIX close at or above this = market-wide fear
const SPELL_GAP = 21; // VIX sessions under FEAR that still count as the same VIX ≥ 25 spell
const NEAR = 5; // sessions: "within days" for the entry-overlap count
const POOL_CAP = 2; // entries per calendar month a pooled forward count takes across names

// ---------- data ----------

/** Split-adjusted intraday lows from the cached raw Yahoo payload (bars() drops them). */
function adjustedLows(symbol) {
  const path = join(process.cwd(), "node_modules", ".cache", "earnings-cycle", `${symbol}.json`);
  if (!existsSync(path)) return new Map();
  const r = JSON.parse(readFileSync(path, "utf8")).chart.result[0];
  const q = r.indicators.quote[0];
  const adj = r.indicators.adjclose[0].adjclose;
  const out = new Map();
  for (let i = 0; i < r.timestamp.length; i++) {
    if (q.low[i] == null || q.close[i] == null || adj[i] == null) continue;
    out.set(
      new Date(r.timestamp[i] * 1000).toISOString().slice(0, 10),
      q.low[i] * (adj[i] / q.close[i]),
    );
  }
  return out;
}

/**
 * VIX ≥ 25 spells: runs of VIX closes ≥ FEAR, merged across gaps of up to SPELL_GAP sessions. One
 * sell-off makes every tracked name dip at once, so a spell — not a ticker — is the independent unit.
 */
function fearSpells(vixBars) {
  const spellOf = new Map();
  let id = -1;
  let lastIn = Number.NEGATIVE_INFINITY;
  vixBars.forEach((b, i) => {
    if (b.close < FEAR) return;
    if (i - lastIn > SPELL_GAP) id++;
    spellOf.set(b.date, id);
    lastIn = i;
  });
  return spellOf;
}

// ---------- model ----------

function ncdf(x) {
  // Abramowitz–Stegun 7.1.26 via erf; |error| < 1.5e-7.
  const t = 1 / (1 + 0.3275911 * (Math.abs(x) / Math.SQRT2));
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-(x * x) / 2);
  return x >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}

const d1Of = (S, K, sigma) =>
  (Math.log(S / K) + (RATE + (sigma * sigma) / 2) * T) / (sigma * Math.sqrt(T));

function bs(S, K, sigma, type) {
  const d1 = d1Of(S, K, sigma);
  const d2 = d1 - sigma * Math.sqrt(T);
  const disc = Math.exp(-RATE * T);
  return type === "call"
    ? S * ncdf(d1) - K * disc * ncdf(d2)
    : K * disc * ncdf(-d2) - S * ncdf(-d1);
}

/** |delta| of a put struck at K. */
const putDelta = (S, K, sigma) => 1 - ncdf(d1Of(S, K, sigma));

/** The put strike whose Black-Scholes |delta| is `absDelta` at volatility `sigma`. */
const strikeForPutDelta = (S, sigma, absDelta) =>
  S * Math.exp(-Z[absDelta] * sigma * Math.sqrt(T) + (RATE + (sigma * sigma) / 2) * T);

// ---------- tests ----------

let comparisons = 0; // every P value or t printed in this run, for the multiple-comparisons note

function stdev(xs) {
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1));
}

/** P(X ≥ k) and P(X ≤ k) for X ~ Binomial(n, p), safe at p = 0 or 1. */
const atLeast = (k, n, p) => (k <= 0 ? 1 : p <= 0 ? 0 : p >= 1 ? 1 : binomTail(k, n, p));
const atMost = (k, n, p) => 1 - atLeast(k + 1, n, p);

/** One-sample t of `xs` against a fixed mean `mu`. */
const tStat = (xs, mu) =>
  xs.length < 2 ? null : (mean(xs) - mu) / (stdev(xs) / Math.sqrt(xs.length));

/** Two-sided Fisher exact test on the 2×2 table [[a, b], [c, d]]. */
function fisher(a, b, c, d) {
  const lf = (m) => {
    let t = 0;
    for (let i = 2; i <= m; i++) t += Math.log(i);
    return t;
  };
  const n = a + b + c + d;
  const row = a + b;
  const col = a + c;
  const p = (x) =>
    Math.exp(
      lf(row) +
        lf(n - row) +
        lf(col) +
        lf(n - col) -
        lf(n) -
        lf(x) -
        lf(row - x) -
        lf(col - x) -
        lf(n - row - col + x),
    );
  const observed = p(a);
  let total = 0;
  for (let x = Math.max(0, row + col - n); x <= Math.min(row, col); x++) {
    const px = p(x);
    if (px <= observed * (1 + 1e-9)) total += px;
  }
  return Math.min(1, total);
}

// ---------- per-session measures ----------

/** Today's move against the benchmark in standard deviations (OLS beta, trailing window). */
function residualZ(lr, blr, i) {
  const pairs = [];
  for (let k = Math.max(1, i - SIGMA_WINDOW); k < i; k++)
    if (blr[k] != null) pairs.push([blr[k], lr[k]]);
  if (pairs.length < WARMUP || blr[i] == null) return undefined;
  const mx = mean(pairs.map((p) => p[0]));
  const my = mean(pairs.map((p) => p[1]));
  let cov = 0;
  let vx = 0;
  for (const [x, y] of pairs) {
    cov += (x - mx) * (y - my);
    vx += (x - mx) ** 2;
  }
  const beta = cov / vx;
  const resid = pairs.map(([x, y]) => y - my - beta * (x - mx));
  return (lr[i] - my - beta * (blr[i] - mx)) / stdev(resid);
}

function buildSeries(px, bench, lows) {
  const lr = px.map((b, i) => (i === 0 ? null : Math.log(b.close / px[i - 1].close)));
  const bIdx = new Map(bench.map((b, i) => [b.date, i]));
  const blr = px.map((b, i) => {
    const j = bIdx.get(b.date);
    const k = i > 0 ? bIdx.get(px[i - 1].date) : undefined;
    return j != null && k != null ? Math.log(bench[j].close / bench[k].close) : null;
  });
  const rows = [];
  for (let i = 0; i < px.length; i++) {
    const row = {
      i,
      date: px[i].date,
      close: px[i].close,
      low: lows.get(px[i].date) ?? px[i].close,
    };
    if (i >= WARMUP) {
      const from = Math.max(0, i - HIGH_WINDOW + 1);
      row.high60 = Math.max(...px.slice(from, i + 1).map((b) => b.close));
      row.dd = px[i].close / row.high60 - 1;
      const rs = lr.slice(Math.max(1, i - SIGMA_WINDOW), i); // excludes today
      row.sigmaDay = stdev(rs);
      row.z = lr[i] / row.sigmaDay;
      const residZ = residualZ(lr, blr, i);
      if (residZ !== undefined) row.residZ = residZ;
      row.rv21 = annualizedVol(lr.slice(Math.max(1, i - 20), i + 1)); // IV proxy, incl. today
      row.rvBeforeEx = i >= 22 ? annualizedVol(lr.slice(i - 21, i)) : null; // excl. dip day
    }
    rows.push(row);
  }
  return { rows, lr };
}

function outcome(px, rows, lr, t) {
  if (t + HOLD >= px.length) return null;
  const S = px[t].close;
  const at = (h) => px[t + h].close / S - 1;
  const path = rows.slice(t + 1, t + HOLD + 1);
  const ST = px[t + HOLD].close;
  const sigma = rows[t].rv21;
  const k10 = 0.9 * S;
  const k20 = strikeForPutDelta(S, sigma, 0.2);
  const p20 = bs(S, k20, sigma, "put");
  const c = bs(S, S, sigma, "call");
  return {
    r5: at(5),
    r20: at(20),
    r30: at(HOLD),
    above: ST > S,
    mae: Math.min(...path.map((p) => p.low)) / S - 1,
    maeClose: Math.min(...path.map((p) => p.close)) / S - 1,
    csp10: {
      assigned: ST < k10,
      depth: ST / k10 - 1,
      touched: Math.min(...path.map((p) => p.low)) < k10,
    },
    csp20: {
      otm: k20 / S - 1,
      assigned: ST < k20,
      depth: ST / k20 - 1,
      pnl: (p20 - Math.max(k20 - ST, 0)) / k20, // model: on collateral
      credit: p20 / k20,
    },
    call: { cost: c / S, pnl: Math.max(ST - S, 0) / c - 1 }, // model
    volBefore: rows[t].rv21,
    volBeforeEx: rows[t].rvBeforeEx,
    volAfter: t + 21 < lr.length ? annualizedVol(lr.slice(t + 1, t + 22)) : null,
  };
}

const crossesPrint = (px, t, prints, projected) => {
  const from = px[t].date;
  const to = t + HOLD < px.length ? px[t + HOLD].date : addCal(from, 42);
  return [...prints, ...projected].some((d) => d >= from && d <= to);
};
const addCal = (iso, d) =>
  new Date(Date.parse(`${iso}T00:00:00Z`) + d * 864e5).toISOString().slice(0, 10);
const isPrintReaction = (px, t, prints) =>
  prints.some((d) => d === px[t].date || (t > 0 && d === px[t - 1].date));

// ---------- report ----------

const TRIGGERS = {
  dd10: { label: "close ≥10% below 60-session high", f: (r) => r.dd <= -0.1 },
  dd20: { label: "close ≥20% below 60-session high", f: (r) => r.dd <= -0.2 },
  down2s: { label: "down day ≤ −2σ (own trailing-60 σ)", f: (r) => r.z <= -2 },
  resid2s: {
    label: "down day ≤ −2σ vs QQQ (beta-adjusted residual)",
    f: (r) => r.residZ != null && r.residZ <= -2,
  },
};

const pct = (x, d = 1) => (x == null || Number.isNaN(x) ? "  –  " : `${(100 * x).toFixed(d)}%`);
const sgn = (x, d = 1) => (x == null ? "–" : `${x >= 0 ? "+" : ""}${(100 * x).toFixed(d)}%`);
const p3 = (p) => p.toFixed(3);
const count = (list, f) => list.filter(f).length;
const kn = (list, f) => `${count(list, f)}/${list.length}`;

function summarize(list) {
  const n = list.length;
  if (!n) return null;
  const v = (f) => list.map(f).filter((x) => x != null);
  const med = (f) => (v(f).length ? quantile(v(f), 0.5) : null);
  const avg = (f) => (v(f).length ? mean(v(f)) : null);
  const share = (f) => list.filter(f).length / n;
  const vb = v((o) => (o.volAfter != null ? o : null));
  return {
    n,
    r5: [avg((o) => o.r5), med((o) => o.r5)],
    r20: [avg((o) => o.r20), med((o) => o.r20)],
    r30: [avg((o) => o.r30), med((o) => o.r30)],
    above: share((o) => o.above),
    aboveK: list.filter((o) => o.above).length,
    mae: [med((o) => o.mae), Math.min(...list.map((o) => o.mae))],
    a10: share((o) => o.csp10.assigned),
    a10k: list.filter((o) => o.csp10.assigned).length,
    t10: share((o) => o.csp10.touched),
    d10: med((o) => (o.csp10.assigned ? o.csp10.depth : null)),
    w10: Math.min(...list.map((o) => o.csp10.depth)),
    otm20: med((o) => o.csp20.otm),
    a20: share((o) => o.csp20.assigned),
    a20k: list.filter((o) => o.csp20.assigned).length,
    pnl20: [
      avg((o) => o.csp20.pnl),
      med((o) => o.csp20.pnl),
      Math.min(...list.map((o) => o.csp20.pnl)),
    ],
    credit20: med((o) => o.csp20.credit),
    callCost: med((o) => o.call.cost),
    callWin: share((o) => o.call.pnl > 0),
    callPnl: [avg((o) => o.call.pnl), med((o) => o.call.pnl)],
    volBefore: med((o) => o.volBefore),
    volBeforeEx: med((o) => o.volBeforeEx),
    volAfter: med((o) => o.volAfter),
    volUp: vb.length ? vb.filter((o) => o.volAfter > o.volBefore).length / vb.length : null,
    volUpEx: vb.length
      ? vb.filter((o) => o.volBeforeEx != null && o.volAfter > o.volBeforeEx).length / vb.length
      : null,
    ratio: med((o) => (o.volAfter != null ? o.volAfter / o.volBefore : null)),
  };
}

function line(tag, s) {
  if (!s) return `  ${tag.padEnd(26)} n=  0`;
  return (
    `  ${tag.padEnd(26)} n=${String(s.n).padStart(4)} | 5d ${sgn(s.r5[0]).padStart(7)} 20d ${sgn(s.r20[0]).padStart(7)} 30d ${sgn(s.r30[0]).padStart(7)} (med ${sgn(s.r30[1]).padStart(7)})` +
    ` | up@30 ${pct(s.above, 0).padStart(4)} | MAE med ${sgn(s.mae[0]).padStart(7)} worst ${sgn(s.mae[1]).padStart(7)}` +
    ` | put-10%OTM ITM ${pct(s.a10, 0).padStart(4)} touched ${pct(s.t10, 0).padStart(4)} worst ${sgn(s.w10).padStart(7)}` +
    ` | Δ.20 put (model) ${sgn(s.otm20, 0)} OTM ITM ${pct(s.a20, 0).padStart(4)} P&L/collat mean ${sgn(s.pnl20[0]).padStart(6)} worst ${sgn(s.pnl20[2]).padStart(7)}` +
    ` | ATM call (model) cost ${pct(s.callCost)} win ${pct(s.callWin, 0)} P&L mean ${sgn(s.callPnl[0], 0)} med ${sgn(s.callPnl[1], 0)}` +
    ` | RV before ${pct(s.volBefore, 0)} (ex-dip ${pct(s.volBeforeEx, 0)}) after ${pct(s.volAfter, 0)} after>before ${pct(s.volUp, 0)} (ex-dip ${pct(s.volUpEx, 0)}) ratio ${s.ratio?.toFixed(2)}`
  );
}

/**
 * The tests the doc cites, print-aware episodes against the print-clean base. P(≥)/P(≤) are
 * one-sided binomial tails at the base share; t is a one-sample t of the episodes' 30-session
 * returns against the base mean; "dip-time level" is the 21 sessions before the dip day.
 */
function testsBlock(eps, base, baseList) {
  const os = eps.map((e) => e.o);
  const n = os.length;
  const up = count(os, (o) => o.above);
  const a10 = count(os, (o) => o.csp10.assigned);
  const a20 = count(os, (o) => o.csp20.assigned);
  const won = count(os, (o) => o.call.pnl > 0);
  const t = tStat(
    os.map((o) => o.r30),
    base.r30[0],
  );
  comparisons += t == null ? 4 : 5;
  console.log(
    `     tests vs print-clean base: up@30 ${up}/${n} vs ${pct(base.above, 1)} P(≥) ${p3(atLeast(up, n, base.above))}` +
      ` · 10%-below put ITM ${a10}/${n} vs ${pct(base.a10, 1)} P(≥) ${p3(atLeast(a10, n, base.a10))} P(≤) ${p3(atMost(a10, n, base.a10))}` +
      ` · Δ.20 put ITM ${a20}/${n} vs ${pct(base.a20, 1)} P(≥) ${p3(atLeast(a20, n, base.a20))} P(≤) ${p3(atMost(a20, n, base.a20))}` +
      ` · call won ${won}/${n} vs ${pct(base.callWin, 1)} P(≤) ${p3(atMost(won, n, base.callWin))}` +
      ` · 30d mean ${sgn(mean(os.map((o) => o.r30)))} vs ${sgn(base.r30[0])} t ${t == null ? "–" : t.toFixed(2)}`,
  );
  const withVol = os.filter((o) => o.volAfter != null);
  const normalAfter = quantile(
    baseList.map((o) => o.volAfter).filter((x) => x != null),
    0.5,
  );
  const rv = os.map((o) => o.volBefore).sort((a, b) => a - b);
  console.log(
    `     realized vol: after below dip-time level (ex-dip) ${kn(withVol, (o) => o.volBeforeEx != null && o.volAfter < o.volBeforeEx)}` +
      ` · after above a normal window's median (${pct(normalAfter, 0)}) ${kn(withVol, (o) => o.volAfter > normalAfter)}` +
      ` · at entry (21 sessions incl. the dip day) ${pct(rv[0], 0)}–${pct(rv.at(-1), 0)}, median ${pct(quantile(rv, 0.5), 0)}`,
  );
}

/** VIX ≥ FEAR vs calm on the print-aware episodes, with each VIX ≥ 25 spell counted once. */
function vixSplit(eps, spellOf) {
  const hi = eps.filter((e) => e.vix >= FEAR);
  const lo = eps.filter((e) => e.vix < FEAR);
  const side = (xs) =>
    `n=${xs.length} up ${kn(xs, (e) => e.o.above)} Δ.20 ITM ${kn(xs, (e) => e.o.csp20.assigned)} 10%put ITM ${kn(xs, (e) => e.o.csp10.assigned)} mean ${xs.length ? sgn(mean(xs.map((e) => e.o.r30))) : "–"}`;
  let tail = "";
  if (hi.length && lo.length) {
    const f = (g) =>
      fisher(count(hi, g), hi.length - count(hi, g), count(lo, g), lo.length - count(lo, g));
    comparisons += 3;
    const no08 = (xs) => xs.filter((e) => !e.date.startsWith("2008"));
    tail =
      ` | Fisher two-sided: up ${p3(f((e) => e.o.above))} Δ.20 ${p3(f((e) => e.o.csp20.assigned))} 10%put ${p3(f((e) => e.o.csp10.assigned))}` +
      ` | without 2008: ≥${FEAR} up ${kn(no08(hi), (e) => e.o.above)}, <${FEAR} up ${kn(no08(lo), (e) => e.o.above)}`;
  }
  const spells = new Set(hi.map((e) => spellOf.get(e.date))).size;
  console.log(
    `     VIX split (close on entry): ≥${FEAR} ${side(hi)} [${spells} separate VIX ≥ ${FEAR} spells] | <${FEAR} ${side(lo)}${tail}`,
  );
}

/** Sessions the trigger held with VIX ≥ FEAR, and why the print-aware bot did or did not open. */
function fearSessions(qualifying, aware, vixAt, px, prints, projected, show) {
  const fear = qualifying.filter((t) => vixAt[t] >= FEAR);
  if (!fear.length) return console.log(`     sessions with VIX ≥ ${FEAR}: 0`);
  const opened = fear.filter((t) => aware.some((e) => e.t === t));
  const holding = fear.filter((t) => aware.some((e) => e.t < t && t < e.t + HOLD));
  const crosses = fear.filter((t) => !(opened.includes(t) || holding.includes(t)));
  const crossCheck = crosses.filter((t) => crossesPrint(px, t, prints, projected));
  console.log(
    `     sessions with VIX ≥ ${FEAR}: ${fear.length} — print-aware bot opened ${opened.length}, already holding ${holding.length}, 30-session window crosses a print ${crossCheck.length}${crossCheck.length === crosses.length ? "" : `, other ${crosses.length - crossCheck.length}`}`,
  );
  if (show)
    console.log(
      `       dates: ${fear.map((t) => `${px[t].date}${opened.includes(t) ? "(opened)" : holding.includes(t) ? "(holding)" : "(crosses print)"}`).join(" ")}`,
    );
}

/** Prices, prints, per-session measures and the VIX close aligned to this symbol's sessions. */
async function loadSeries(symbol, vixBars) {
  const px = await bars(symbol);
  const bench = await bars("QQQ");
  const prints = await earningsDates(symbol);
  // Projected next print (house estimate) — only matters for a still-open window.
  const projected = { CRWV: ["2026-11-09"], NVDA: ["2026-11-18"] }[symbol] ?? [];
  const { rows, lr } = buildSeries(px, bench, adjustedLows(symbol));
  const vixByDate = new Map(vixBars.map((b) => [b.date, b.close]));
  const vixAt = [];
  px.forEach((b, i) => {
    vixAt[i] = vixByDate.get(b.date) ?? vixAt[i - 1] ?? null;
  });
  return { symbol, px, prints, projected, rows, lr, vixAt };
}

/** The era header: how often the stock sits in a drawdown at all, and the VIX ≥ 25 spells it spans. */
function printEra(ctx, start, spellOf) {
  const { symbol, px, prints, rows } = ctx;
  const sessions = px.length - start;
  console.log(
    `\n=== ${symbol} from ${px[start].date} to ${px.at(-1).date} (${sessions} sessions; prints in era: ${prints.filter((d) => d >= px[start].date).length}) ===`,
  );
  const era = rows.slice(start);
  const share = (cut) => count(era, (r) => r.dd <= cut);
  let streak = rows.length - 1;
  while (streak > start && rows[streak - 1].dd <= -0.1) streak--;
  console.log(
    `  sessions in a 10% drawdown ${share(-0.1)}/${sessions} (${pct(share(-0.1) / sessions, 0)}),` +
      ` 20% ${share(-0.2)}/${sessions} (${pct(share(-0.2) / sessions, 0)})` +
      `; ${rows.at(-1).dd <= -0.1 ? `in a 10% drawdown every session since ${rows[streak].date}` : "not in a 10% drawdown today"}` +
      `; last session 20%+ under: ${era.findLast((r) => r.dd <= -0.2)?.date ?? "none"}`,
  );
  const spells = new Set([...spellOf].filter(([d]) => d >= px[start].date).map(([, id]) => id))
    .size;
  console.log(
    `  separate VIX ≥ ${FEAR} spells in the era (gaps of up to ${SPELL_GAP} sessions merged): ${spells}, ${(spells / (sessions / 252)).toFixed(2)} a year`,
  );
}

/** Every session in the era with a finished window, split by whether the window held a print. */
function baseRates(ctx, start, lastClosed) {
  const { px, rows, lr, prints } = ctx;
  const lists = { all: [], clean: [], cross: [] };
  for (let t = start; t <= lastClosed; t++) {
    const o = outcome(px, rows, lr, t);
    lists.all.push(o);
    (crossesPrint(px, t, prints, []) ? lists.cross : lists.clean).push(o);
  }
  const s = {
    all: summarize(lists.all),
    clean: summarize(lists.clean),
    cross: summarize(lists.cross),
  };
  console.log(line("BASE every session", s.all));
  console.log(line("BASE print-clean windows", s.clean));
  console.log(line("BASE windows across a print", s.cross));
  return { lists, s };
}

/** The two bots walking the era: one opens on every trigger, one only on print-clean windows. */
function simulate(ctx, trig, start) {
  const { px, rows, prints, projected } = ctx;
  const blind = [];
  const aware = [];
  const qualifying = [];
  let nextBlind = start;
  let nextAware = start;
  for (let t = start; t < px.length; t++) {
    if (!trig.f(rows[t])) continue;
    qualifying.push(t);
    const cross = crossesPrint(px, t, prints, projected);
    if (t >= nextBlind) {
      blind.push({ t, cross });
      nextBlind = t + HOLD;
    }
    if (t >= nextAware && !cross) {
      aware.push({ t });
      nextAware = t + HOLD;
    }
  }
  return { blind, aware, qualifying };
}

function fmtEp(ctx, e, tag) {
  const { px, rows, prints } = ctx;
  const o = e.o;
  const r = rows[e.t];
  return (
    `     ${tag} ${px[e.t].date} close ${px[e.t].close.toFixed(2)} high ${r.high60.toFixed(2)} dd ${sgn(r.dd, 0)} z ${r.z.toFixed(1)} VIX ${e.vix?.toFixed(1)}${isPrintReaction(px, e.t, prints) ? " [print-reaction dip]" : ""}${e.cross ? " [ACROSS PRINT]" : ""}` +
    ` → 5d ${sgn(o.r5, 0)} 20d ${sgn(o.r20, 0)} 30d ${sgn(o.r30, 0)} MAE ${sgn(o.mae, 0)} | 10%put ${o.csp10.assigned ? `ITM ${sgn(o.csp10.depth, 0)}` : "OTM"} | Δ.20 ${sgn(o.csp20.otm, 0)} ${o.csp20.assigned ? `ITM ${sgn(o.csp20.depth, 0)}` : "OTM"} | call ${o.call.pnl > 0 ? "won" : "lost"} | RV ${pct(o.volBefore, 0)} (ex-dip ${pct(o.volBeforeEx, 0)})→${pct(o.volAfter, 0)}`
  );
}

/** One trigger: both bots' summaries, the tests block, the VIX view and (optionally) episodes. */
function reportTrigger(ctx, key, trig, env) {
  const { px, rows, lr, prints, projected, vixAt } = ctx;
  const { start, lastClosed, base, showEpisodes, spellOf } = env;
  const { blind, aware, qualifying } = simulate(ctx, trig, start);
  const closed = (eps) =>
    eps
      .filter((e) => e.t <= lastClosed)
      .map((e) => ({ ...e, date: px[e.t].date, vix: vixAt[e.t], o: outcome(px, rows, lr, e.t) }));
  const B = closed(blind);
  const A = closed(aware);
  const allDays = qualifying
    .filter((t) => t <= lastClosed && !crossesPrint(px, t, prints, []))
    .map((t) => outcome(px, rows, lr, t));
  const s = {
    blindAll: summarize(B.map((e) => e.o)),
    blindCross: summarize(B.filter((e) => e.cross).map((e) => e.o)),
    blindClean: summarize(B.filter((e) => !e.cross).map((e) => e.o)),
    aware: summarize(A.map((e) => e.o)),
    allCleanDays: summarize(allDays),
  };
  console.log(
    `\n -- trigger ${key}: ${trig.label} --  qualifying sessions ${qualifying.length}; open (window not finished): blind ${blind.length - B.length}, aware ${aware.length - A.length}`,
  );
  console.log(line("print-blind bot, all", s.blindAll));
  console.log(line("  of which across a print", s.blindCross));
  console.log(line("  of which print-clean", s.blindClean));
  console.log(line("print-aware bot", s.aware));
  console.log(line("every clean qualifying day", s.allCleanDays));
  if (s.aware && base.s.clean) {
    const c = base.s.clean;
    s.tests = {
      pUp: atLeast(s.aware.aboveK, s.aware.n, c.above),
      pA10hi: atLeast(s.aware.a10k, s.aware.n, c.a10),
      pA10lo: atMost(s.aware.a10k, s.aware.n, c.a10),
    };
    testsBlock(A, c, base.lists.clean);
    const across = B.filter((e) => e.cross);
    const clean = B.filter((e) => !e.cross);
    console.log(
      `     print-blind split: across a print up ${kn(across, (e) => e.o.above)} 10%put ITM ${kn(across, (e) => e.o.csp10.assigned)}` +
        ` | print-clean up ${kn(clean, (e) => e.o.above)} 10%put ITM ${kn(clean, (e) => e.o.csp10.assigned)}`,
    );
    const years = (lastClosed - start + 1) / 252;
    console.log(
      `     print-aware entries: ${(A.length / years).toFixed(2)} a year (${A.length} over the ${years.toFixed(2)} years whose 30-session windows have finished)` +
        ` · on the session of or after a filing ${kn(A, (e) => isPrintReaction(px, e.t, prints))}`,
    );
    vixSplit(A, spellOf);
  }
  fearSessions(qualifying, aware, vixAt, px, prints, projected, showEpisodes);
  if (showEpisodes) {
    for (const e of B) console.log(fmtEp(ctx, e, "blind"));
    for (const e of A) console.log(fmtEp(ctx, e, "aware"));
  }
  for (const e of [...aware, ...blind].filter((x) => x.t > lastClosed))
    console.log(
      `     OPEN ${px[e.t].date} close ${px[e.t].close.toFixed(2)} dd ${sgn(rows[e.t].dd, 0)}${e.cross ? " [window crosses projected print]" : ""}`,
    );
  const ep = (e) => ({
    date: e.date,
    vix: e.vix,
    printDip: isPrintReaction(px, e.t, prints),
    ...e.o,
  });
  return {
    entries: aware.map((e) => e.t),
    result: {
      ...s,
      episodes: { blind: B.map((e) => ({ cross: e.cross, ...ep(e) })), aware: A.map(ep) },
    },
  };
}

/** The four triggers are not independent samples: how often they pick the 10%-drawdown entries. */
function printOverlap(entries) {
  for (const key of ["dd20", "down2s", "resid2s"]) {
    const mine = entries[key];
    const same = count(mine, (t) => entries.dd10.includes(t));
    const near = count(
      mine,
      (t) => !entries.dd10.includes(t) && entries.dd10.some((u) => Math.abs(u - t) <= NEAR),
    );
    console.log(
      `  ${key} print-aware entries shared with dd10's: ${same} the same session, ${near} more within ${NEAR} sessions, of ${mine.length}`,
    );
  }
}

function printToday(ctx, cleanBase) {
  const { px, rows, prints, projected, vixAt } = ctx;
  const last = rows.at(-1);
  const k10 = 0.9 * last.close;
  console.log(
    `\n  today ${last.date}: close ${last.close.toFixed(2)}, 60-session high ${last.high60.toFixed(2)} (dd ${sgn(last.dd)}), day z ${last.z.toFixed(2)}, resid z ${last.residZ?.toFixed(2)}, RV21 ${pct(last.rv21, 0)}, VIX ${vixAt.at(-1)?.toFixed(2)}; a ${HOLD}-session hold from today crosses a print: ${crossesPrint(px, px.length - 1, prints, projected)}` +
      `\n  put 10% below today: |delta| ${putDelta(last.close, k10, last.rv21).toFixed(2)} at RV21, ${putDelta(last.close, k10, cleanBase.volAfter).toFixed(2)} at the normal window's realized ${pct(cleanBase.volAfter, 0)}`,
  );
  const { date, close, high60, dd, z, residZ, rv21 } = last;
  return { date, close, high60, dd, z, residZ, rv21, vix: vixAt.at(-1) };
}

async function study(symbol, from, showEpisodes, spellOf, vixBars) {
  const ctx = await loadSeries(symbol, vixBars);
  const { px } = ctx;
  const start = Math.max(
    WARMUP,
    px.findIndex((b) => b.date >= from),
  );
  const lastClosed = px.length - 1 - HOLD;
  printEra(ctx, start, spellOf);
  const base = baseRates(ctx, start, lastClosed);
  const env = { start, lastClosed, base, showEpisodes, spellOf };
  const result = {
    symbol,
    from: px[start].date,
    to: px.at(-1).date,
    closedYears: (lastClosed - start + 1) / 252,
    base: base.s,
    triggers: {},
  };
  const entries = {};
  for (const [key, trig] of Object.entries(TRIGGERS)) {
    const r = reportTrigger(ctx, key, trig, env);
    entries[key] = r.entries;
    result.triggers[key] = r.result;
  }
  printOverlap(entries);
  result.today = printToday(ctx, base.s.clean);
  return result;
}

/**
 * The 10%-drawdown entries pooled across every symbol in the run. One sell-off moves the tracked
 * names together, so a forward count takes at most POOL_CAP entries per calendar month.
 */
function printPooled(results) {
  const seen = new Map();
  for (const r of results)
    for (const e of r.triggers.dd10.episodes.aware) seen.set(`${r.symbol} ${e.date}`, e.date);
  const byMonth = new Map();
  for (const d of seen.values()) byMonth.set(d.slice(0, 7), (byMonth.get(d.slice(0, 7)) ?? 0) + 1);
  const counted = [...byMonth.values()].reduce((a, n) => a + Math.min(POOL_CAP, n), 0);
  const years = Math.max(...results.map((r) => r.closedYears));
  console.log(
    `
pooled 10%-drawdown print-aware entries across ${new Set(results.map((r) => r.symbol)).size} symbol(s): ${seen.size} in ${byMonth.size} calendar months;` +
      ` ${counted} counted at most ${POOL_CAP} a month = ${(counted / years).toFixed(1)} a year over ${years.toFixed(2)} years`,
  );
}

const args = process.argv.slice(2);
const showEpisodes = args.includes("--episodes");
const jsonPath = args.find((a) => a.startsWith("--json="))?.slice(7);
const specs = args.filter((a) => !a.startsWith("--"));
const runs = (specs.length ? specs : ["CRWV", "NVDA:2023-01-01", "NVDA:2005-01-01"]).map((s) => {
  const [sym, from] = s.split(":");
  return { sym, from: from ?? "1900-01-01" };
});
const vixBars = await bars("^VIX");
const spellOf = fearSpells(vixBars);
const out = [];
for (const r of runs) out.push(await study(r.sym, r.from, showEpisodes, spellOf, vixBars));
printPooled(out);
console.log(
  `\nVIX: ${vixBars.length} sessions ${vixBars[0].date} → ${vixBars.at(-1).date}, last ${vixBars.at(-1).close.toFixed(2)}` +
    `\ncomparisons printed in this run (P values and t): ${comparisons} — at P < 0.05 about ${(comparisons / 20).toFixed(1)} would land there by chance`,
);
if (jsonPath) writeFileSync(jsonPath, JSON.stringify(out, null, 1));
