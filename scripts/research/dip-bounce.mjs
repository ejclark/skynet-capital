#!/usr/bin/env node
/**
 * Dip-to-bounce study (#5489 slice 1) — does buying an intraday dip below VWAP and selling a small
 * bounce clear costs, and what does the dip that doesn't bounce cost the book?
 *
 *   node scripts/research/dip-bounce.mjs CRWV,NBIS,MU,AMD,NVDA
 *   node scripts/research/dip-bounce.mjs NVDA --json=/tmp/out.json
 *
 * Eric (2026-10-16): "you can still do 50 separate 1k trades with 50k capital to take small
 * profits on volatility. This is also very risky; what happens when recovery cycle is delayed
 * needs defined." The house already found that trading the OPEN's swing loses after costs
 * (docs/research/intraday-volatility.md). This tests a different claim: a dip far below the
 * session's VWAP, measured in the name's own 5-minute range, tends to bounce far enough to pay.
 *
 * The grid: entry k ∈ {1, 1.5, 2} ranges below VWAP; target m ∈ {0.5, 1, 1.5} ranges above entry;
 * costs 2 / 5 / 10 bps per side (no quote history is reachable offline, so spread is an assumption,
 * swept). No entries in the first 30 minutes or on a print day ±1 session.
 *
 * The CONTROL is what makes this a test rather than a tally: the same target and day-5 hand-off
 * applied to EVERY eligible bar. A dip rule that does no better than buying at a random bar has
 * found the stock's drift, not a bounce.
 *
 * DATA: Yahoo 5-minute bars, last 60 days only (~58 complete sessions after one warm-up day). Small
 * sample, one regime; every table says n. Offline research tooling: places nothing.
 */

import { writeFileSync } from "node:fs";
import { runBook } from "./dip-bounce-book.mjs";
import { annotate, findEntries, recoveryBy, walkTranche } from "./dip-bounce-sim.mjs";
import { sessions } from "./intraday-bars.mjs";
import { earningsDates } from "./market-data.mjs";

const KS = [1, 1.5, 2];
const MS = [0.5, 1, 1.5];
const COSTS = [2, 5, 10];
const DAYS = [0, 1, 3, 5];
const UA = "skynet-capital research (ejclark83@gmail.com)";

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : Number.NaN);
const f = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "—");
const pad = (s, n) => String(s).padStart(n);

/** Foreign filers print on a 6-K, not an 8-K Item 2.02: the inline-XBRL 6-K is the results one. */
async function sixKPrints(symbol) {
  const get = async (url) => (await fetch(url, { headers: { "User-Agent": UA } })).json();
  const tickers = await get("https://www.sec.gov/files/company_tickers.json");
  const hit = Object.values(tickers).find((t) => t.ticker === symbol);
  if (!hit) return [];
  const r = (
    await get(`https://data.sec.gov/submissions/CIK${String(hit.cik_str).padStart(10, "0")}.json`)
  ).filings.recent;
  const xbrl = new RegExp(`^${symbol.toLowerCase()}-\\d{8}x6k\\.htm$`);
  return r.form.flatMap((form, i) =>
    form === "6-K" && xbrl.test(r.primaryDocument[i]) ? [r.filingDate[i]] : [],
  );
}

async function printDates(symbol) {
  const eightK = await earningsDates(symbol).catch(() => []);
  return eightK.length
    ? { dates: eightK, source: "8-K 2.02" }
    : { dates: await sixKPrints(symbol), source: "6-K XBRL" };
}

const calendarDays = (a, b) => (Date.parse(b) - Date.parse(a)) / 86_400_000;

/** Sessions on a print day ±1 (the first session on/after the filing date is the print session). */
function excludedDates(days, prints) {
  const out = new Set();
  for (const p of prints) {
    const at = days.findIndex((s) => s.date >= p);
    // A print from before the window maps to its first session; only a nearby session is the print.
    if (at === -1 || calendarDays(p, days[at].date) > 4) continue;
    for (const d of [at - 1, at, at + 1]) if (days[d]) out.add(days[d].date);
  }
  return out;
}

/** Every eligible bar as an entry — the control the dip rule has to beat. */
function controlEntries(flat, exclude) {
  return flat.flatMap((b, i) =>
    b.range != null && b.minutes >= 600 && !exclude.has(b.date)
      ? [{ i, price: b.close, range: b.range }]
      : [],
  );
}

/** Day-clustered t of the per-trade net: trades on one day are one draw, not many. */
function clusteredT(trades, costBps) {
  const byDay = new Map();
  for (const t of trades) {
    const net = t.grossPct - (2 * costBps) / 100;
    byDay.set(t.entryDate, [...(byDay.get(t.entryDate) ?? []), net]);
  }
  const xs = [...byDay.values()].map(mean);
  const m = mean(xs);
  const sd = Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / Math.max(1, xs.length - 1));
  return { days: xs.length, t: sd > 0 ? m / (sd / Math.sqrt(xs.length)) : Number.NaN };
}

function cell(flat, lastDay, entries, m, control, eligibleDays) {
  const ruled = entries.map((e) => walkTranche(flat, e, m));
  const open = entries.map((e) => walkTranche(flat, e, m, Number.POSITIVE_INFINITY));
  const gross = mean(ruled.map((t) => t.grossPct));
  const rec = recoveryBy(ruled, lastDay, flat, DAYS);
  const late = open.filter((t) => t.age > 5);
  // Split-half: the same cell on the window's first and second halves, by entry session.
  const mid = flat[Math.floor(flat.length / 2)].day;
  const halves = [
    ruled.filter((t) => flat[t.entryAt].day < mid),
    ruled.filter((t) => flat[t.entryAt].day >= mid),
  ];
  return {
    halves: halves.map((h) => mean(h.map((t) => t.grossPct))),
    n: entries.length,
    perDay: entries.length / eligibleDays,
    rec,
    handedOff: ruled.filter((t) => t.how === "handoff").length,
    gross,
    net: Object.fromEntries(COSTS.map((c) => [c, gross - (2 * c) / 100])),
    breakEven: (gross / 2) * 100,
    control,
    edge: gross - control,
    worst: Math.min(0, ...ruled.map((t) => t.worstPct)),
    t5: clusteredT(ruled, 5),
    lateRecovered: late.filter((t) => t.how === "target").length,
    lateAges: late.filter((t) => t.how === "target").map((t) => t.age),
    late: late.length,
    ruled,
    open,
  };
}

async function study(symbol) {
  let days = await sessions(symbol, "5m", "60d");
  // A session still trading (the cache was taken mid-day) is not a session; drop it.
  if (days.length && days.at(-1).bars.length < 78) days = days.slice(0, -1);
  const prints = await printDates(symbol);
  const exclude = excludedDates(days, prints.dates);
  const flat = annotate(days);
  const lastDay = flat.at(-1).day;
  const eligible = days.slice(1).filter((s) => !exclude.has(s.date)).length;
  const first = days[1];
  const hold = (days.at(-1).bars.at(-1).close / first.bars[0].open - 1) * 100;
  const unit = flat.filter((b) => b.range != null).map((b) => (100 * b.range) / b.close);
  const controls = Object.fromEntries(
    MS.map((m) => [
      m,
      mean(controlEntries(flat, exclude).map((e) => walkTranche(flat, e, m).grossPct)),
    ]),
  );
  const grid = {};
  for (const k of KS) {
    const entries = findEntries(flat, { k, exclude });
    for (const m of MS)
      grid[`${k}/${m}`] = {
        k,
        m,
        entries,
        ...cell(flat, lastDay, entries, m, controls[m], eligible),
      };
  }
  return { symbol, days, flat, prints, exclude, eligible, hold, unitPct: mean(unit), grid };
}

function reportName(s) {
  console.log(`\n${"=".repeat(110)}`);
  console.log(
    `${s.symbol} — ${s.days.length} sessions ${s.days[0].date} .. ${s.days.at(-1).date} · ${s.eligible} eligible` +
      ` · prints (${s.prints.source}) excluded: ${[...s.exclude].join(", ") || "none in window"}`,
  );
  console.log(
    `range unit (mean 5m high-low) ${f(s.unitPct, 3)}% of price · buy & hold over the window ${f(s.hold, 1)}%`,
  );
  console.log(
    `\n  ${"k/m".padEnd(8)}${pad("n", 5)}${pad("/day", 6)}${pad("same%", 7)}${pad("d1%", 6)}${pad("d3%", 6)}${pad("d5%", 6)}` +
      `${pad("h-off", 6)}${pad("gross%", 8)}${pad("net@2", 7)}${pad("net@5", 7)}${pad("net@10", 8)}${pad("b/e bps", 8)}` +
      `${pad("ctrl%", 7)}${pad("edge%", 7)}${pad("t(days)", 9)}${pad("worst%", 8)}${pad("late", 7)}${pad("halves", 14)}`,
  );
  for (const c of Object.values(s.grid)) {
    const r = (d) => f(c.rec.find((x) => x.day === d).pct, 0);
    console.log(
      `  ${`${c.k}/${c.m}`.padEnd(8)}${pad(c.n, 5)}${pad(f(c.perDay), 6)}${pad(r(0), 7)}${pad(r(1), 6)}${pad(r(3), 6)}${pad(r(5), 6)}` +
        `${pad(c.handedOff, 6)}${pad(f(c.gross, 3), 8)}${pad(f(c.net[2], 3), 7)}${pad(f(c.net[5], 3), 7)}${pad(f(c.net[10], 3), 8)}` +
        `${pad(f(c.breakEven, 1), 8)}${pad(f(c.control, 3), 7)}${pad(f(c.edge, 3), 7)}` +
        `${pad(`${f(c.t5.t, 1)}/${c.t5.days}`, 9)}${pad(f(c.worst, 1), 8)}${pad(`${c.lateRecovered}/${c.late}`, 7)}` +
        `${pad(`${f(c.halves[0], 2)}|${f(c.halves[1], 2)}`, 14)}`,
    );
  }
}

function reportBook(studies) {
  console.log(
    `\n${"=".repeat(110)}\nTHE BOOK — 50 × $1k across ${studies.map((s) => s.symbol).join(", ")}`,
  );
  const hold = mean(studies.map((s) => s.hold));
  console.log(`equal-weight buy & hold of the same names over the window: ${f(hold, 1)}%`);
  console.log(
    `\n  ${"k/m".padEnd(6)}${pad("cost", 5)}${pad("rule", 7)}${pad("trades", 8)}${pad("targets", 9)}${pad("h-off", 7)}` +
      `${pad("h-off $", 9)}${pad("open", 6)}${pad("total $", 9)}${pad("total%", 8)}${pad("mean tied", 11)}` +
      `${pad("max tied", 10)}${pad("≥30% d", 8)}${pad("≥50% d", 8)}${pad("8% trips", 10)}${pad("acct%", 7)}  refused`,
  );
  const out = [];
  for (const k of KS) {
    for (const m of MS) {
      for (const costBps of COSTS) {
        for (const rule of ["full", "signal", "off"]) {
          const names = studies.map((s) => {
            const c = s.grid[`${k}/${m}`];
            return {
              sym: s.symbol,
              flat: s.flat,
              entries: c.entries,
              ruled: c.ruled,
              open: c.open,
            };
          });
          const b = runBook(names, { rule, costBps });
          out.push({ k, m, costBps, rule, ...b });
          console.log(
            `  ${`${k}/${m}`.padEnd(6)}${pad(costBps, 5)}${pad(rule, 7)}${pad(b.trades, 8)}${pad(b.targets, 9)}` +
              `${pad(b.handedOff, 7)}${pad(f(b.handoffPl, 0), 9)}${pad(b.stillOpen, 6)}${pad(f(b.totalPl, 0), 9)}` +
              `${pad(f(b.totalPct, 1), 8)}${pad(`${f(100 * b.meanTied, 0)}%`, 11)}${pad(`${f(100 * b.maxTied, 0)}%`, 10)}` +
              `${pad(b.daysOver30, 8)}${pad(b.daysOver50, 8)}${pad(b.trips.length, 10)}${pad(f(b.accountPct, 1), 7)}  ${JSON.stringify(b.refused)}`,
          );
        }
      }
    }
  }
  return out;
}

async function main() {
  const argv = process.argv.slice(2);
  const symbols = argv
    .filter((a) => !a.startsWith("--"))
    .flatMap((a) => a.split(","))
    .map((s) => s.toUpperCase());
  const json = argv.find((a) => a.startsWith("--json="))?.slice(7);
  const studies = [];
  for (const sym of symbols.length ? symbols : ["CRWV", "NBIS", "MU", "AMD", "NVDA"]) {
    const s = await study(sym);
    reportName(s);
    studies.push(s);
  }
  console.log(
    "\nColumns: same/d1/d3/d5 = % of tranches at target by that session (day 0 = entry day), among those" +
      "\nobservable that long · h-off = handed off at day-5 close · gross/net = mean % per tranche with the day-5" +
      "\nhand-off as the exit · b/e = cost per side that zeroes it · ctrl = same exit from EVERY eligible bar ·" +
      "\nt(days) = day-clustered t of net@5 / days with a trade · worst = deepest low a tranche sat through ·" +
      "\nlate = with no hand-off, tranches still held after day 5 that later reached target / all such ·" +
      "\nhalves = gross% on entries in the window's first | second half. BOOK: total% = this playbook's books" +
      "\n(hand-offs booked at their close) · acct% = the member's account, hand-offs marked at the last close.",
  );
  const books = studies.length > 1 ? reportBook(studies) : [];
  if (json) {
    const slim = studies.map(({ flat: _f, days, grid, ...rest }) => ({
      ...rest,
      exclude: [...rest.exclude],
      sessions: days.length,
      grid: Object.fromEntries(
        Object.entries(grid).map(([key, { entries: _e, ruled: _r, open: _o, ...c }]) => [key, c]),
      ),
    }));
    writeFileSync(
      json,
      JSON.stringify(
        { studies: slim, books: books.map(({ handoffs: _h, open: _o, ...b }) => b) },
        null,
        1,
      ),
    );
  }
}

main().catch((error) => {
  console.error(`dip-bounce failed: ${error.message}`);
  process.exit(1);
});
