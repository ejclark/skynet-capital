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

import {
  controlBaseRate,
  controlFade,
  controlPeers,
  controlShape,
  ret,
  stats,
} from "./earnings-controls.mjs";
import { bars, earningsDates } from "./market-data.mjs";

// ---------------------------------------------------------------------------------------------
// statistics
// ---------------------------------------------------------------------------------------------

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
    console.log(`  ${name.padEnd(11)}${cells.join("")}`);
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
