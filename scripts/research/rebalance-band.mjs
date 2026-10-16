#!/usr/bin/env node
/**
 * REBALANCING BAND — does keeping dry powder in a holding place, moved back to target whenever
 * the mix drifts past a band, buy pullbacks and bank rallies well enough to pay for itself?
 *
 *   node scripts/research/rebalance-band.mjs
 *   node scripts/research/rebalance-band.mjs --cost=5 --cash=irx --json=out.json
 *   node scripts/research/rebalance-band.mjs --cash=0          # holding earns nothing
 *
 * #5483 slice 1, "the backtest". Eric (2026-10-16): "playbook strategies should be regulating the
 * portfolio to have cash to invest or capital to reallocate in these scenarios where there is
 * significant pullback." Shape A of that plan is a constant-mix band: no forecast, just arithmetic.
 * This runs it on history — holding targets 20/30/40%, bands ±5/±10/±15 points — against buy and
 * hold and against the same starting split never rebalanced (the static mix), on:
 *
 *   NVDA since 2005 and since 2023 · CRWV since listing · the AI basket (NVDA, AMD, MU, AVGO
 *   from AVGO's 2009 listing, and from 2023) · the same basket with NBIS (from its 2024 relisting)
 *
 * It prints one markdown table per sample (paste-ready for docs/research/rebalance-band-2026-10.md)
 * and a rolling one-year table for every configuration, so a single lucky path cannot pass as a
 * rule. The rules, the three books and the cost model live in `rebalance-band-math.mjs`.
 *
 * PRICE ONLY. The active sleeve is the stock (total return, adjusted closes), standing in for the
 * account's active book of puts, wheels and calls; no option prices exist offline. Holding earns the
 * 13-week T-bill yield of each day (Yahoo ^IRX) unless --cash says otherwise. Paper-only,
 * educational; nothing here routes an order.
 */

import { writeFileSync } from "node:fs";
import { bars } from "./market-data.mjs";
import { quantile } from "./premium-fit-math.mjs";
import {
  basketIndex,
  cagr,
  cashGrowth,
  drawdownProfile,
  harvest,
  rollingStarts,
  simulate,
  timing,
  triggerMoves,
  yearsOf,
} from "./rebalance-band-math.mjs";

const HOLDS = [0.2, 0.3, 0.4];
const BANDS = [0.05, 0.1, 0.15];
const ROLL_LEN = 252;
const ROLL_STEP = 21;

const SAMPLES = [
  { tag: "NVDA since 2005", members: ["NVDA"], since: "2005-01-01", pool: true },
  { tag: "NVDA since 2023", members: ["NVDA"], since: "2023-01-01" },
  { tag: "CRWV since listing", members: ["CRWV"], since: "2000-01-01", pool: true },
  {
    tag: "AI basket since 2009",
    members: ["NVDA", "AMD", "MU", "AVGO"],
    since: "2009-01-01",
    pool: true,
  },
  { tag: "AI basket since 2023", members: ["NVDA", "AMD", "MU", "AVGO"], since: "2023-01-01" },
  {
    tag: "AI basket + NBIS since 2024",
    members: ["NVDA", "AMD", "MU", "AVGO", "NBIS"],
    since: "2000-01-01",
  },
];

const arg = (name, dflt) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : dflt;
};
const COST_BPS = Number(arg("cost", "5"));
const CASH = arg("cash", "irx");
const JSON_OUT = arg("json", null);

const pct = (x, d = 1) =>
  x == null || Number.isNaN(x) ? "–" : `${x < 0 ? "−" : ""}${Math.abs(100 * x).toFixed(d)}%`;
const pts = (x, d = 1) =>
  x == null || Number.isNaN(x) ? "–" : `${x >= 0 ? "+" : "−"}${Math.abs(100 * x).toFixed(d)}`;
const hitRate = (t) => (t.judged ? `${t.hits}/${t.judged} (${pct(t.rate, 0)})` : "–");

/** Closes of each member on the sessions every member traded, from `since`. */
async function aligned(members, since) {
  const series = await Promise.all(members.map((m) => bars(m)));
  const maps = series.map((s) => new Map(s.map((b) => [b.date, b.close])));
  const dates = series[0]
    .map((b) => b.date)
    .filter((d) => d >= since && maps.every((m) => m.has(d)));
  return { dates, closes: maps.map((m) => dates.map((d) => m.get(d))) };
}

async function yieldsFor(dates) {
  if (CASH === "irx") {
    const irx = new Map((await bars("^IRX")).map((b) => [b.date, b.rawClose / 100]));
    return dates.map((d) => irx.get(d) ?? null);
  }
  const fixed = Number(CASH);
  if (!Number.isFinite(fixed)) throw new Error(`--cash must be irx or a number, got ${CASH}`);
  return dates.map(() => fixed);
}

function book(index, growth, dates, hold, band) {
  const run = simulate(index, growth, { hold, band, costBps: COST_BPS });
  const dd = drawdownProfile(run.equity);
  return {
    hold,
    band,
    cagr: cagr(run.equity, dates),
    multiple: run.equity.at(-1),
    ...dd,
    trades: run.trades.length,
    tradesPerYear: run.trades.length / yearsOf(dates),
    maxDrift: run.maxDrift,
    timing: timing(index, run.trades),
    equity: run.equity,
  };
}

/** Rolling one-year windows: the band against the static mix and against buy and hold. */
function rolling(index, growth, dates, hold, band) {
  const bonus = [];
  const trend = [];
  for (const s of rollingStarts(index.length, ROLL_LEN, ROLL_STEP)) {
    const ix = index.slice(s, s + ROLL_LEN);
    const g = [1, ...growth.slice(s + 1, s + ROLL_LEN)];
    const ds = dates.slice(s, s + ROLL_LEN);
    const r = (h, b) => cagr(simulate(ix, g, { hold: h, band: b, costBps: COST_BPS }).equity, ds);
    const banded = r(hold, band);
    bonus.push(banded - r(hold, Infinity));
    trend.push(r(0, Infinity) - banded);
  }
  if (bonus.length === 0) return null;
  return {
    windows: bonus.length,
    bonusMedian: quantile(bonus, 0.5),
    bonusP25: quantile(bonus, 0.25),
    bonusPositive: bonus.filter((x) => x > 0).length / bonus.length,
    trendMedian: quantile(trend, 0.5),
  };
}

async function runSample(sample) {
  const { dates, closes } = await aligned(sample.members, sample.since);
  const index = closes.length === 1 ? closes[0].map((c) => c / closes[0][0]) : basketIndex(closes);
  const yields = await yieldsFor(dates);
  const growth = cashGrowth(dates, yields);
  const known = yields.filter((y) => y != null);
  const meanYield = known.reduce((a, b) => a + b, 0) / Math.max(known.length, 1);
  const bh = book(index, growth, dates, 0, Infinity);
  const cashCurve = [];
  for (const g of growth) cashCurve.push((cashCurve.at(-1) ?? 1) * g);
  const cashCagr = cagr(cashCurve, dates);
  const rows = [];
  for (const hold of HOLDS) {
    const stat = book(index, growth, dates, hold, Infinity);
    for (const band of BANDS) {
      const b = book(index, growth, dates, hold, band);
      rows.push({
        ...b,
        bonus: b.cagr - stat.cagr,
        harvest: harvest(b.cagr, bh.cagr, cashCagr, hold),
        trigger: triggerMoves(hold, band),
        trendCost: bh.cagr - b.cagr,
        staticCagr: stat.cagr,
        staticMaxDd: stat.maxDd,
        roll: rolling(index, growth, dates, hold, band),
      });
    }
  }
  return {
    tag: sample.tag,
    pool: Boolean(sample.pool),
    cashCagr,
    members: sample.members,
    from: dates[0],
    to: dates.at(-1),
    sessions: dates.length,
    years: yearsOf(dates),
    meanYield,
    bh,
    rows,
  };
}

function printSample(s) {
  console.log(
    `\n### ${s.tag}: ${s.members.join(", ")} · ${s.from} → ${s.to} · ${s.years.toFixed(1)} years` +
      `\n\nHolding earns ${CASH === "irx" ? `the daily 13-week T-bill yield (mean ${pct(s.meanYield, 2)})` : `${pct(Number(CASH), 2)}`}; each move pays ${COST_BPS} bps of the amount moved.` +
      ` Buy and hold: CAGR ${pct(s.bh.cagr)}, max drawdown ${pct(s.bh.maxDd, 0)}, ≥10% under its high ${pct(s.bh.timeUnder, 0)} of sessions, longest underwater ${s.bh.longestUnder} sessions.\n`,
  );
  console.log(
    "| Holding · band | CAGR | Harvest | Bonus vs static mix | Trend cost vs buy and hold | Max drawdown | ≥10% under | Longest underwater | Moves / year | Buys near a trough | Sells near a peak |",
  );
  console.log("|---|---|---|---|---|---|---|---|---|---|---|");
  for (const r of s.rows) {
    console.log(
      `| ${pct(r.hold, 0)} · ±${(100 * r.band).toFixed(0)} | ${pct(r.cagr)} | ${pts(r.harvest)} | ${pts(r.bonus)} | ${pts(r.trendCost)} | ${pct(r.maxDd, 0)} | ${pct(r.timeUnder, 0)} | ${r.longestUnder} | ${r.tradesPerYear.toFixed(1)} | ${hitRate(r.timing.buys)} | ${hitRate(r.timing.sells)} |`,
    );
  }
  const base = s.rows[0].timing;
  console.log(
    `\nBase rate, any session: ${pct(base.buys.base, 0)} sit within 5% of their ±21-session trough, ${pct(base.sells.base, 0)} within 5% of the peak.`,
  );
  console.log(
    "\nRolling one-year windows (252 sessions, stepped 21; overlapping, so not independent):\n",
  );
  console.log(
    "| Holding · band | Windows | Bonus, median | Bonus, p25 | Bonus > 0 | Trend cost, median |",
  );
  console.log("|---|---|---|---|---|---|");
  for (const r of s.rows) {
    const o = r.roll;
    if (!o) continue;
    console.log(
      `| ${pct(r.hold, 0)} · ±${(100 * r.band).toFixed(0)} | ${o.windows} | ${pts(o.bonusMedian)} | ${pts(o.bonusP25)} | ${pct(o.bonusPositive, 0)} | ${pts(o.trendMedian)} |`,
    );
  }
}

/** What each configuration's band means in price, from the last rebalance. */
function printTriggers() {
  console.log("\n### What a band means in price (from the last rebalance)\n");
  console.log(
    "| Holding · band | Buys into the stock after a fall of | Trims to holding after a rise of |",
  );
  console.log("|---|---|---|");
  for (const hold of HOLDS)
    for (const band of BANDS) {
      const t = triggerMoves(hold, band);
      const rise = Number.isFinite(t.rise) ? pct(t.rise, 0) : "never";
      console.log(
        `| ${pct(hold, 0)} · ±${(100 * band).toFixed(0)} | ${pct(-t.fall, 0)} | ${rise} |`,
      );
    }
}

/**
 * Timing pooled over the samples that are not windows of one another (NVDA since 2005, CRWV, the
 * basket since 2009). NVDA sits inside the basket, so these are not independent either: a reader
 * gets a bigger count, not a cleaner one.
 */
function printPooled(results) {
  const pooled = results.filter((s) => s.pool);
  console.log(`\n### Timing pooled over ${pooled.map((s) => s.tag).join(", ")}\n`);
  console.log(
    "| Holding · band | Buys near a trough | Base rate those buys faced | Sells near a peak | Base rate those sells faced |",
  );
  console.log("|---|---|---|---|---|");
  for (let k = 0; k < pooled[0].rows.length; k++) {
    const sum = (side) => {
      let hits = 0;
      let judged = 0;
      let base = 0;
      for (const s of pooled) {
        const t = s.rows[k].timing[side];
        hits += t.hits;
        judged += t.judged;
        base += t.base * t.judged; // the base rate each judged trade faced
      }
      return {
        hits,
        judged,
        rate: judged ? hits / judged : null,
        base: judged ? base / judged : null,
      };
    };
    const b = sum("buys");
    const se = sum("sells");
    const r = pooled[0].rows[k];
    console.log(
      `| ${pct(r.hold, 0)} · ±${(100 * r.band).toFixed(0)} | ${hitRate(b)} | ${pct(b.base, 0)} | ${hitRate(se)} | ${pct(se.base, 0)} |`,
    );
  }
}

const results = [];
for (const sample of SAMPLES) results.push(await runSample(sample));
printTriggers();
for (const s of results) printSample(s);
printPooled(results);

if (JSON_OUT) {
  const strip = (b) => {
    const { equity: _equity, ...rest } = b;
    return rest;
  };
  const payload = results.map((s) => ({ ...s, bh: strip(s.bh), rows: s.rows.map(strip) }));
  writeFileSync(
    JSON_OUT,
    `${JSON.stringify({ costBps: COST_BPS, cash: CASH, samples: payload }, null, 2)}\n`,
  );
  console.error(`wrote ${JSON_OUT}`);
}
