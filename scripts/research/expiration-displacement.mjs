#!/usr/bin/env node
/**
 * Expiration-displacement study — what happens to a witching that cannot print on its Friday.
 *
 *   node scripts/research/expiration-displacement.mjs
 *   node scripts/research/expiration-displacement.mjs --date 2027-06-17   # score one session
 *   node scripts/research/expiration-displacement.mjs --fresh             # bust the cache
 *
 * WHY THIS EXISTS
 *
 * US equity options expire on the third Friday. When that Friday is an exchange holiday the
 * expiration falls back to the Thursday — which happens for exactly two reasons (Good Friday,
 * and Juneteenth once it became a market holiday in 2022) and which is about to happen to a
 * QUARTERLY witching twice in two years (2026-06-18, 2027-06-17).
 *
 * Six opex ledgers in docs/research/events/ cite the expiration-day volume signature from
 * vendor literature; the juneteenth-market-closure-2027-06-18 ledger measured it, on n=1, and
 * said so. This script exists so the next session scores that claim off re-run data rather than
 * off the prose of the last one — the cache-discipline rule in docs/process/EVENT-RESEARCH.md.
 *
 * THE THREE THINGS IT MEASURES, in the order they matter:
 *
 *   1. Is there a signature to displace at all? Expiration-day relative volume MINUS the same
 *      figure for the session before. On monthlies that separation is ~0.1 and the test has no
 *      power; on quarterlies it is ~1.1. Any claim about displacement is a claim about
 *      quarterlies, and reporting the separation first is what stops a null being read as a
 *      finding.
 *   2. Does the signature arrive on the displaced Thursday? Each displaced session's relvol,
 *      ranked inside the non-displaced distribution FOR ITS OWN ERA — witching volume has grown
 *      structurally, so a 1990s observation judged against a 2020s band is judged wrong.
 *   3. Does the following session carry the unpin? Same measure, one session later.
 *
 * RELATIVE VOLUME, defined once: a session's volume over the MEDIAN of its prior 20 sessions.
 * Median rather than mean because the prior 20 of an expiration week routinely contains another
 * expiration, and one outlier drags a mean into hiding the thing being measured.
 *
 * WHY SINGLE NAMES AND NOT SPY: the closing-auction rebalance flow that makes a witching visible
 * lands in index CONSTITUENTS. SPY is reported alongside precisely because it does not show the
 * effect — run this on the ETF alone and the honest answer looks like "no evidence."
 *
 * DATA: Yahoo daily bars from 1990. Volume only; no intraday, no open interest, no GEX.
 * Educational, paper-standard — this measures a calendar mechanic, it does not propose a trade.
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const CACHE = join(process.cwd(), "node_modules", ".cache", "expiration-displacement");
const UA = "skynet-capital research (ejclark83@gmail.com)";

/** Large caps spanning sectors, all listed since 1990 so the sample is not survivorship-shaped. */
export const BASKET = ["AAPL", "MSFT", "JPM", "XOM", "JNJ", "PG", "KO", "WMT"];
const BENCH = "SPY";
const LOOKBACK = 20;

export async function bars(symbol) {
  mkdirSync(CACHE, { recursive: true });
  const path = join(CACHE, `${symbol}.json`);
  if (existsSync(path)) return JSON.parse(readFileSync(path, "utf8"));
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}` +
    `?period1=631152000&period2=${Math.floor(Date.now() / 1000)}&interval=1d`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${symbol} -> ${res.status} ${res.statusText}`);
  const result = (await res.json()).chart?.result?.[0];
  if (!result) throw new Error(`no chart data for ${symbol}`);
  const q = result.indicators.quote[0];
  const rows = [];
  for (let i = 0; i < result.timestamp.length; i++) {
    if (q.close[i] == null || !q.volume[i]) continue;
    rows.push({
      date: new Date(result.timestamp[i] * 1000).toISOString().slice(0, 10),
      volume: q.volume[i],
    });
  }
  writeFileSync(path, JSON.stringify(rows));
  return rows;
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
const quantile = (xs, p) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.max(0, Math.round(p * (s.length - 1))))];
};

// --- calendar arithmetic: third Fridays, and the only two holidays that can land on one --------

const utc = (y, m, d) => new Date(Date.UTC(y, m - 1, d));
const iso = (t) => t.toISOString().slice(0, 10);

function thirdFriday(year, month) {
  let seen = 0;
  for (let day = 1; day <= 31; day++) {
    const t = utc(year, month, day);
    if (t.getUTCMonth() !== month - 1) break;
    if (t.getUTCDay() === 5 && ++seen === 3) return t;
  }
  return null;
}

/** Anonymous Gregorian algorithm (Meeus/Jones/Butcher). */
function easter(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  return utc(year, Math.floor((h + l - 7 * m + 114) / 31), ((h + l - 7 * m + 114) % 31) + 1);
}
const goodFriday = (year) => new Date(easter(year).getTime() - 2 * 86400000);

/** Juneteenth has been an NYSE holiday since 2022; a Saturday observance falls back to Friday. */
function juneteenthObserved(year) {
  const t = utc(year, 6, 19);
  if (t.getUTCDay() === 6) return utc(year, 6, 18);
  if (t.getUTCDay() === 0) return utc(year, 6, 20);
  return t;
}

/** Every third-Friday expiration in [from, to], with the displacing holiday named where one applies. */
export function expirations(from, to) {
  const out = [];
  for (let year = from; year <= to; year++) {
    const gf = iso(goodFriday(year));
    const jt = year >= 2022 ? iso(juneteenthObserved(year)) : null;
    for (let month = 1; month <= 12; month++) {
      const friday = iso(thirdFriday(year, month));
      const holiday = friday === gf ? "Good Friday" : friday === jt ? "Juneteenth" : null;
      out.push({
        year,
        month,
        friday,
        holiday,
        quarterly: [3, 6, 9, 12].includes(month),
        session: holiday
          ? iso(new Date(new Date(`${friday}T00:00:00Z`).getTime() - 86400000))
          : friday,
      });
    }
  }
  return out;
}

// --- measurement ------------------------------------------------------------------------------

function relvolFor(rows, index) {
  const prior = rows
    .slice(Math.max(0, index - LOOKBACK), index)
    .map((r) => r.volume)
    .filter((v) => v > 0);
  if (prior.length < 15) return null;
  const base = median(prior);
  return base ? rows[index].volume / base : null;
}

export function build(series) {
  const index = new Map(
    Object.entries(series).map(([sym, rows]) => [sym, new Map(rows.map((r, i) => [r.date, i]))]),
  );
  const relvol = (sym, date) => {
    const i = index.get(sym).get(date);
    return i == null || i < LOOKBACK ? null : relvolFor(series[sym], i);
  };
  const basket = (date) => {
    const vals = BASKET.map((s) => relvol(s, date)).filter((v) => v != null);
    return vals.length >= 6 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };
  // One shared session calendar; any listed-since-1990 name gives the same NYSE session list.
  const sessions = series[BASKET[0]].map((r) => r.date);
  const at = new Map(sessions.map((d, i) => [d, i]));
  const shift = (date, n) => (at.has(date) ? (sessions[at.get(date) + n] ?? null) : null);
  return { relvol, basket, shift, isSession: (d) => at.has(d) };
}

function band(label, rows) {
  const v = rows.map((r) => r.relvol).filter((x) => x != null);
  const p = rows.map((r) => r.before).filter((x) => x != null);
  if (!v.length) return;
  console.log(
    `  ${label.padEnd(34)} n=${String(v.length).padStart(3)}  ` +
      `min ${quantile(v, 0).toFixed(2)}  p25 ${quantile(v, 0.25).toFixed(2)}  ` +
      `med ${median(v).toFixed(2)}  p75 ${quantile(v, 0.75).toFixed(2)}  ` +
      `max ${quantile(v, 1).toFixed(2)}   separation vs day-before ${(median(v) - median(p)).toFixed(2)}`,
  );
}

/**
 * The `--date` argument, or undefined. Its own function because `indexOf` returns -1 when the flag
 * is absent, and `argv[-1 + 1]` is then whatever flag came first — so a bare `--fresh` used to
 * scope the run to a "session" literally named "--fresh" and print the not-an-expiration message
 * instead of the study (found 2026-09-06 by the opex-2027-09-17 lane, in the exact invocation the
 * cache-discipline rule tells you to run).
 */
function dateArg(argv) {
  const at = argv.indexOf("--date");
  return at === -1 ? undefined : argv[at + 1];
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--fresh")) rmSync(CACHE, { recursive: true, force: true });
  const only = dateArg(argv);

  const series = {};
  for (const sym of [...BASKET, BENCH]) series[sym] = await bars(sym);
  const m = build(series);

  const rows = expirations(1990, new Date().getUTCFullYear())
    .filter((e) => m.isSession(e.session))
    .map((e) => ({
      ...e,
      relvol: m.basket(e.session),
      before: m.basket(m.shift(e.session, -1)),
      after: m.basket(m.shift(e.session, 1)),
      spy: m.relvol(BENCH, e.session),
    }))
    .filter((e) => e.relvol != null);

  if (only) {
    const hit = rows.find((r) => r.session === only);
    if (!hit) {
      console.log(`No expiration session on ${only} (not yet in the tape, or not an expiration).`);
      return;
    }
    const peers = rows.filter(
      (r) => !r.holiday && r.quarterly === hit.quarterly && r.year >= hit.year - 11,
    );
    const ref = peers.map((r) => r.relvol);
    console.log(
      `\n${only} — ${hit.quarterly ? "quarterly" : "monthly"} expiration` +
        `${hit.holiday ? ` (DISPLACED off ${hit.friday} by ${hit.holiday})` : ""}`,
    );
    console.log(`  8-name mean relvol      ${hit.relvol.toFixed(2)}`);
    console.log(`  session before          ${hit.before?.toFixed(2) ?? "—"}`);
    console.log(`  session after           ${hit.after?.toFixed(2) ?? "—"}  (${m.shift(only, 1)})`);
    console.log(`  ${BENCH} (expected blind)   ${hit.spy?.toFixed(2) ?? "—"}`);
    console.log(
      `  era band (n=${ref.length}): p25 ${quantile(ref, 0.25).toFixed(2)} / ` +
        `med ${median(ref).toFixed(2)} — this session's percentile rank is ` +
        `${Math.round((ref.filter((v) => v < hit.relvol).length / ref.length) * 100)}`,
    );
    return;
  }

  const cohort = (quarterly, from, to) =>
    rows.filter((r) => !r.holiday && r.quarterly === quarterly && r.year >= from && r.year <= to);
  const now = new Date().getUTCFullYear();
  console.log("\n=== 1. Is there a signature to displace? (non-displaced expirations) ===");
  band("quarterly 2015+", cohort(true, 2015, now));
  band("monthly 2015+", cohort(false, 2015, now));
  band("quarterly 1995-2014", cohort(true, 1995, 2014));
  band("monthly 1995-2014", cohort(false, 1995, 2014));
  console.log(
    "  A separation near zero means the instrument cannot see the thing being displaced.",
  );

  console.log("\n=== 2 & 3. Every displaced expiration in the tape ===");
  console.log(
    "  third Fri    holiday      type       session      relvol  before  after   SPY   era pctile",
  );
  for (const r of rows.filter((x) => x.holiday)) {
    const peers = rows.filter(
      (p) => !p.holiday && p.quarterly === r.quarterly && Math.abs(p.year - r.year) <= 11,
    );
    const rank = peers.length
      ? `${Math.round((peers.filter((p) => p.relvol < r.relvol).length / peers.length) * 100)}%`
      : "—";
    console.log(
      `  ${r.friday}   ${r.holiday.padEnd(12)} ${(r.quarterly ? "QUARTERLY" : "monthly").padEnd(10)} ` +
        `${r.session}   ${r.relvol.toFixed(2)}    ${r.before?.toFixed(2) ?? "—"}    ` +
        `${r.after?.toFixed(2) ?? "—"}   ${r.spy?.toFixed(2) ?? "—"}   ${rank}`,
    );
  }
  console.log(
    "\n  Read the era-percentile column, not the raw relvol: witching volume has grown" +
      "\n  structurally, so an observation judged against another decade's band is judged wrong.",
  );
}

// Guarded because this module is also IMPORTED for its calendar arithmetic and relvol basket
// (fomc-expiration-proximity.mjs) — an unguarded call ran the whole study as an import side effect.
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop())) {
  main().catch((error) => {
    console.error(`expiration-displacement failed: ${error.message}`);
    process.exit(1);
  });
}
