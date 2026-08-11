#!/usr/bin/env node
/**
 * Earnings-cycle event study — "what does this stock actually do around its prints?"
 *
 *   node scripts/research/earnings-cycle.mjs NVDA
 *   node scripts/research/earnings-cycle.mjs NVDA --bench QQQ --since 2023 --peers AMD,AVGO,MRVL
 *
 * WHY THIS EXISTS (docs/research/nvda-earnings-cycle.md is its first output)
 *
 * Eric's hypothesis was "NVDA rises ahead of earnings then falls after." That is a testable
 * claim, and testing it by eye on a chart is how you convince yourself of something false.
 * This is the instrument that answers it with numbers, and — more importantly — the one that
 * tries to KILL its own answer before reporting it.
 *
 * THE FOUR WAYS THIS ANALYSIS LIES IF YOU LET IT, AND THE CONTROL FOR EACH
 *
 *   1. DRIFT. NVDA compounded ~50%/yr in the modern era. ANY long window is positive. So every
 *      edge is reported as excess over the same-length return sampled from windows that touch
 *      no earnings event. The raw mean is decoration; the excess is the finding.
 *   2. BETA. 2023-26 was a bull market. Edges are also reported net of a benchmark over the
 *      identical calendar window, so we never bill the Nasdaq as alpha.
 *   3. REGIME. A pooled 20-year average blends a $10B company with a $4T one. Everything is
 *      split by era; an effect that exists in only one era is a regime artifact, not a law.
 *   4. SMALL n. Four prints a year means a decade is n=40, and one era is n≈14. Every table
 *      prints n, and single-era findings get an explicit binomial test against the era's own
 *      base rate rather than a hand-wave.
 *
 * WHERE THE EARNINGS DATES COME FROM — and why it matters more than it sounds
 *
 * From SEC 8-K filings carrying Item 2.02 (Results of Operations), via EDGAR. The first version
 * of this script derived earnings days from price action instead — the largest overnight gap in
 * each reporting window — which is intuitive and WRONG in a way that would have manufactured the
 * exact result we were testing for: the biggest gap in a window is often a macro shock (the
 * Aug-2024 yen-carry unwind, the COVID crash), so the detector kept substituting crash days for
 * print days. It got ~20% of the modern era wrong, every error biased toward "stock fell." The
 * authoritative filing date is free, exact, and goes back to 2004.
 *
 * NETWORK: reads SEC EDGAR + Yahoo's chart endpoint. Offline research tooling only — it never
 * touches the trading path, needs no broker credential, and places nothing.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const CACHE = join(process.cwd(), "node_modules", ".cache", "earnings-cycle");
// EDGAR asks for a contactable UA; a generic one gets rate-limited or blocked.
const UA = "skynet-capital research (ejclark83@gmail.com)";

// ---------------------------------------------------------------------------------------------
// fetching (cached — the study gets re-run many times while the questions change)
// ---------------------------------------------------------------------------------------------

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

/** Daily bars, split/dividend adjusted so returns are comparable across NVDA's four splits. */
async function bars(symbol) {
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}` +
    `?period1=631152000&period2=${Math.floor(Date.now() / 1000)}&interval=1d&events=div%7Csplit`;
  const raw = await cached(`${symbol}.json`, url);
  const r = raw.chart?.result?.[0];
  if (!r) throw new Error(`no chart data for ${symbol}`);
  const q = r.indicators.quote[0];
  const adj = r.indicators.adjclose[0].adjclose;
  const out = [];
  for (let i = 0; i < r.timestamp.length; i++) {
    const close = q.close[i];
    const a = adj[i];
    if (close == null || a == null || q.open[i] == null) continue;
    // Map raw prices onto the adjusted series so open/close are on one scale.
    const ratio = a / close;
    out.push({
      date: new Date(r.timestamp[i] * 1000).toISOString().slice(0, 10),
      open: q.open[i] * ratio,
      close: a,
      rawClose: close,
    });
  }
  out.sort((x, y) => (x.date < y.date ? -1 : 1));
  return out;
}

/** Earnings-release dates from SEC 8-K Item 2.02 filings. */
async function earningsDates(symbol) {
  const tickers = await cached(
    "company_tickers.json",
    "https://www.sec.gov/files/company_tickers.json",
  );
  const hit = Object.values(tickers).find((t) => t.ticker === symbol.toUpperCase());
  if (!hit) throw new Error(`no SEC CIK for ${symbol}`);
  const cik = String(hit.cik_str).padStart(10, "0");

  const pages = [
    await cached(`edgar-${cik}.json`, `https://data.sec.gov/submissions/CIK${cik}.json`),
  ];
  for (const f of pages[0].filings?.files ?? []) {
    pages.push(await cached(`edgar-${f.name}`, `https://data.sec.gov/submissions/${f.name}`));
  }

  const hits = [];
  for (const page of pages) {
    const r = page.filings?.recent ?? page;
    for (let i = 0; i < r.form.length; i++) {
      if (r.form[i] !== "8-K") continue;
      const items = String(r.items?.[i] ?? "");
      if (items.split(",").some((s) => s.trim().startsWith("2.02"))) hits.push(r.filingDate[i]);
    }
  }
  // One event per reporting window: a quarter can carry several 8-Ks (guidance updates,
  // re-issues); the first Item-2.02 filing of the window is the print.
  const seen = new Map();
  for (const date of hits.sort()) {
    const [y, m] = date.split("-").map(Number);
    // A report lands in its expected month or spills into the next (NVDA has printed Feb 26 and Mar 2).
    const q = Math.floor(((m - 1) % 12) / 3);
    const key = `${y}-${q}`;
    if (!seen.has(key)) seen.set(key, date);
  }
  return [...seen.values()].sort();
}

// ---------------------------------------------------------------------------------------------
// statistics
// ---------------------------------------------------------------------------------------------

const ret = (a, b) => (b / a - 1) * 100;

function stats(xs) {
  const s = [...xs].sort((a, b) => a - b);
  const n = s.length;
  if (!n) return null;
  const q = (p) => s[Math.min(n - 1, Math.max(0, Math.round(p * (n - 1))))];
  const mean = s.reduce((a, b) => a + b, 0) / n;
  return {
    n,
    mean,
    median: q(0.5),
    p10: q(0.1),
    p90: q(0.9),
    win: (100 * s.filter((x) => x > 0).length) / n,
  };
}

/** P(at least k of n) under a fair-ish base rate p — the "is 14/14 luck?" test. */
function binomTail(k, n, p) {
  const logFact = (m) => {
    let t = 0;
    for (let i = 2; i <= m; i++) t += Math.log(i);
    return t;
  };
  let total = 0;
  for (let i = k; i <= n; i++) {
    total += Math.exp(
      logFact(n) - logFact(i) - logFact(n - i) + i * Math.log(p) + (n - i) * Math.log(1 - p),
    );
  }
  return total;
}

/** Mean n-day return over windows that touch no earnings event — the drift an edge must beat. */
function baseline(series, n, eventIdx, from = 0) {
  const near = new Set();
  for (const e of eventIdx) for (let d = -5; d <= n + 5; d++) near.add(e + d);
  const xs = [];
  for (let i = from; i < series.length - n; i++) {
    if (near.has(i)) continue;
    xs.push(ret(series[i].close, series[i + n].close));
  }
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

// ---------------------------------------------------------------------------------------------
// report
// ---------------------------------------------------------------------------------------------

const ERAS = [
  ["2004-2012", 2004, 2012],
  ["2013-2019", 2013, 2019],
  ["2020-2022", 2020, 2022],
  ["2023-2026", 2023, 2100],
];

function table(title, events, fn, base) {
  console.log(`\n${title}`);
  const head = ["era", "n", "mean%", "med%", "win%", "p10%", "p90%"];
  if (base != null) head.push("excess%");
  console.log(
    "  " +
      head[0].padEnd(11) +
      head
        .slice(1)
        .map((h) => h.padStart(9))
        .join(""),
  );
  const groups = [["ALL", 0, 9999], ...ERAS];
  for (const [name, lo, hi] of groups) {
    const xs = events
      .filter((e) => e.year >= lo && e.year <= hi)
      .map(fn)
      .filter((v) => v != null && Number.isFinite(v));
    const s = stats(xs);
    if (!s) continue;
    const cells = [s.n, s.mean, s.median, s.win, s.p10, s.p90].map((v, i) =>
      (i === 0 ? String(v) : v.toFixed(i === 3 ? 0 : 2)).padStart(9),
    );
    if (base != null) cells.push((s.mean - base).toFixed(2).padStart(9));
    console.log("  " + name.padEnd(11) + cells.join(""));
  }
}

/**
 * Map each 8-K filing to its trading session. The release lands AFTER the close on day D, so the
 * market's verdict is D+1 — every window is anchored on that, not on the filing date itself.
 */
function toEvents(px, dates) {
  const byDate = new Map(px.map((b, i) => [b.date, i]));
  const events = [];
  for (const d of dates) {
    let i;
    for (let k = 0; k < 5 && i === undefined; k++) {
      const probe = new Date(Date.parse(d) + k * 86400000).toISOString().slice(0, 10);
      if (byDate.has(probe)) i = byDate.get(probe);
    }
    // Need 40 sessions of lead-in for the widest run-up window and 25 of follow-through.
    if (i === undefined || i < 40 || i + 25 >= px.length) continue;
    events.push({ i, date: px[i].date, year: Number(px[i].date.slice(0, 4)) });
  }
  return events;
}

/** The run-up windows, the print itself, and the post-print drift. */
function reportWindows(px, bench, events, eventIdx, benchSym) {
  for (const n of [5, 10, 20, 30]) {
    const b = baseline(px, n, eventIdx);
    table(
      `[RUN-UP] close D-${n} -> close D (held into, but not through, the print) | non-earnings baseline ${b >= 0 ? "+" : ""}${b.toFixed(2)}%`,
      events,
      (e) => ret(px[e.i - n].close, px[e.i].close),
      b,
    );
  }

  table("[GAP] close D -> open D+1 (the overnight verdict)", events, (e) =>
    ret(px[e.i].close, px[e.i + 1].open),
  );
  table("[FADE] open D+1 -> close D+1 (does the pop hold through the session?)", events, (e) =>
    ret(px[e.i + 1].open, px[e.i + 1].close),
  );

  for (const k of [5, 10, 20]) {
    const b = baseline(px, k, eventIdx);
    table(
      `[POST] close D+1 -> close D+${1 + k} | non-earnings baseline ${b >= 0 ? "+" : ""}${b.toFixed(2)}%`,
      events,
      (e) => ret(px[e.i + 1].close, px[e.i + 1 + k].close),
      b,
    );
    table(`[POST vs ${benchSym}] same window, minus the benchmark`, events, (e) => {
      const a = bench.get(px[e.i + 1].date);
      const z = bench.get(px[e.i + 1 + k].date);
      if (!(a && z)) return null;
      return ret(px[e.i + 1].close, px[e.i + 1 + k].close) - ret(a.close, z.close);
    });
  }
}

/** Is the run-up earnings, or just a bull market? The binomial test against the era's own rate. */
function controlBaseRate(px, modern, eraFrom) {
  const all20 = [];
  for (let i = eraFrom; i < px.length - 20; i++) all20.push(ret(px[i].close, px[i + 20].close));
  const base20 = stats(all20);
  const ev20 = stats(modern.map((e) => ret(px[e.i - 20].close, px[e.i].close)));
  const wins = modern.filter((e) => ret(px[e.i - 20].close, px[e.i].close) > 0).length;
  console.log(`\n  1. run-up vs the era's OWN base rate (is it earnings, or just a bull market?)`);
  console.log(
    `     every 20d window : n=${String(base20.n).padStart(4)}  mean ${base20.mean.toFixed(2)}%  win ${base20.win.toFixed(0)}%`,
  );
  console.log(
    `     pre-earnings 20d : n=${String(ev20.n).padStart(4)}  mean ${ev20.mean.toFixed(2)}%  win ${ev20.win.toFixed(0)}%`,
  );
  const p = binomTail(wins, modern.length, base20.win / 100);
  console.log(
    `     P(${wins}/${modern.length} positive | base rate) = ${p.toFixed(4)} -> ${p < 0.05 ? "SURVIVES" : "NOT SIGNIFICANT"}`,
  );
}

/** Where inside the window the run-up happens — the leg that decides the exit date. */
function controlShape(px, modern) {
  console.log(`\n  2. where inside the window does the run-up actually happen?`);
  for (const [lo, hi, label] of [
    [20, 10, "D-20 -> D-10"],
    [10, 5, "D-10 -> D-5 "],
    [5, 0, "D-5  -> D   "],
  ]) {
    const s = stats(modern.map((e) => ret(px[e.i - lo].close, px[e.i - hi].close)));
    console.log(
      `     ${label}  mean ${s.mean.toFixed(2).padStart(6)}%  med ${s.median.toFixed(2).padStart(6)}%  win ${s.win.toFixed(0).padStart(3)}%`,
    );
  }
}

/** Does the reaction session behave unlike an ordinary one? */
function controlFade(px, modern, eraFrom) {
  const allIntra = [];
  for (let i = eraFrom; i < px.length; i++) allIntra.push(ret(px[i].open, px[i].close));
  const bi = stats(allIntra);
  const fi = stats(modern.map((e) => ret(px[e.i + 1].open, px[e.i + 1].close)));
  console.log(`\n  3. reaction-day fade vs an ordinary session`);
  console.log(`     every session      : mean ${bi.mean.toFixed(2)}%  win ${bi.win.toFixed(0)}%`);
  console.log(`     earnings reaction  : mean ${fi.mean.toFixed(2)}%  win ${fi.win.toFixed(0)}%`);
}

/** A sector-seasonal effect shows up in peers; a name-specific one does not. */
async function controlPeers(px, modern, peers, symbol) {
  if (!peers.length) return;
  console.log(`\n  4. out-of-sample — do peers run up over ${symbol}'s OWN pre-print windows?`);
  console.log(
    `     (a sector-seasonal effect would show here; a ${symbol}-specific one would not)`,
  );
  for (const sym of peers) {
    const pk = await bars(sym);
    const pi = new Map(pk.map((b, i) => [b.date, i]));
    const xs = modern
      .filter((e) => pi.has(px[e.i - 20].date) && pi.has(px[e.i].date))
      .map((e) => ret(pk[pi.get(px[e.i - 20].date)].close, pk[pi.get(px[e.i].date)].close));
    const s = stats(xs);
    if (s) {
      console.log(
        `     ${sym.padEnd(5)} n=${String(s.n).padStart(3)}  mean ${s.mean.toFixed(2).padStart(6)}%  win ${s.win.toFixed(0).padStart(3)}%`,
      );
    }
  }
}

function parseArgs(argv) {
  const flag = (name, fallback) => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 ? argv[i + 1] : fallback;
  };
  return {
    symbol: (argv[0] ?? "NVDA").toUpperCase(),
    benchSym: flag("bench", "QQQ").toUpperCase(),
    peers: (flag("peers", "") || "")
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean),
    modernFrom: Number(flag("since", "2023")),
  };
}

async function main() {
  const { symbol, benchSym, peers, modernFrom } = parseArgs(process.argv.slice(2));

  const px = await bars(symbol);
  const bench = new Map((await bars(benchSym)).map((b) => [b.date, b]));
  const events = toEvents(px, await earningsDates(symbol));
  const eventIdx = events.map((e) => e.i);

  console.log(
    `${symbol} earnings-cycle study — ${events.length} prints, ${events[0].date} .. ${events.at(-1).date}`,
  );
  console.log(
    `price history ${px[0].date} .. ${px.at(-1).date} (${px.length} sessions) · benchmark ${benchSym}`,
  );
  console.log(`earnings dates: SEC 8-K Item 2.02 · D = release day (after close) · reaction = D+1`);

  reportWindows(px, bench, events, eventIdx, benchSym);

  const modern = events.filter((e) => e.year >= modernFrom);
  const eraFrom = px.findIndex((b) => Number(b.date.slice(0, 4)) >= modernFrom);
  console.log(`\n${"=".repeat(86)}\nCONTROLS (modern era, ${modernFrom}+, n=${modern.length})`);
  controlBaseRate(px, modern, eraFrom);
  controlShape(px, modern);
  controlFade(px, modern, eraFrom);
  await controlPeers(px, modern, peers, symbol);

  console.log(`\n${"=".repeat(86)}`);
  console.log(
    `Findings that survive their controls belong in docs/research/. Ones that don't, don't.`,
  );
}

main().catch((error) => {
  console.error(`earnings-cycle failed: ${error.message}`);
  process.exit(1);
});
