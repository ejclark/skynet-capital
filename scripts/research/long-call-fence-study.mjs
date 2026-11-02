#!/usr/bin/env node
/**
 * LONG-CALL FENCE STUDY — should CRWV-LONG-CALL keep the AI-dip view's two fences as its own?
 *
 *   node scripts/research/long-call-fence-study.mjs --print-window=2026-11-09..2026-11-16
 *   node scripts/research/long-call-fence-study.mjs --json=out.json
 *
 * #6598 slice 2, Study B (parent plan #5482). Eric's AI-dip view fences CRWV-LONG-CALL twice
 * (`conviction-seeds.ts`): no buys or adds from CRWV's blackout until 6 sessions after the print,
 * and no expiry before 2027-03-18. When a claim behind them passes (2b, 8 or 9), `research:refine`
 * proposes carrying the fences into the pair as its own settings, and refuses to, for want of this
 * study. Both are replayed as rules (`long-call-fence-math.mjs` says how each is restated):
 *
 *   Question 1, the quiet fence. Around every print on the basket since 2005 (CRWV since listing),
 *   buy the call CRWV-LONG-CALL would buy at 10, 5 and 1 sessions before the print, at the 2nd
 *   session after it (the playbook's first allowed buy) and at the 7th (the fence's first), and
 *   hold each under the playbook's exits. Paired per print, so one print's tape is in every arm.
 *
 *   Question 2, the expiry floor. Every 5th session the playbook may buy, buy its call; the floor
 *   arm buys the same call, or nothing when the recovery band's 75th percentile (point in time)
 *   puts the 45-day exit past the call's expiry. An idle entry scores zero, never drops out.
 *
 * Every name is sold by CRWV-LONG-CALL's own settings (the question is that pair's setting; the
 * other names are its sample). Intervals resample whole calendar quarters (`blockInterval`). NBIS
 * stays in the bands and sector flag but buys nothing: it files 6-Ks, so its prints are unknown.
 *
 * Modeled premium, price history only, closes not intraday. Paper-only, educational; nothing here
 * routes an order. The pure half is `long-call-fence-math.mjs`.
 */

import { writeFileSync } from "node:fs";
import {
  ddBucket,
  drawdowns,
  LOOKBACK,
  outcomeAt,
  pricePhase,
  RECOVER_HORIZON,
  sectorFlag,
  vixBucket,
  WARMUP,
} from "./cycle-phase-math.mjs";
import {
  daysBetween,
  entryExpiry,
  eventMove,
  eventsAhead,
  expiryFloor,
  heldBack,
  impliedVol,
  longCallTrade,
  NEVER,
  QUIET_SESSIONS,
  recoveryBand,
  weekdaysAfter,
} from "./long-call-fence-math.mjs";
import { bars, earningsDates } from "./market-data.mjs";
import { annualizedVol, printCadence } from "./premium-fit-math.mjs";
import { blockInterval, quarterOf } from "./wheel-cap-math.mjs";

const BASKET = ["NVDA", "CRWV", "NBIS", "MU", "AVGO", "AMD"];
const SINCE = "2005-01-01";
const STEP = 5;
const VOL_WINDOW = 60;
/** The live fence and the day it was read (`conviction-seeds.ts`, claim 8's study). */
const LIVE_FLOOR = { day: "2027-03-18", readOn: "2026-10-16" };
/** Entry offsets around a print, in sessions from its filing session. */
const OFFSETS = [-10, -5, -1, 2, 7, 12];

const args = process.argv.slice(2);
const flag = (k) => args.find((a) => a.startsWith(`--${k}=`))?.split("=")[1];

const vixBars = await bars("^VIX");
const vixMap = new Map(vixBars.map((b) => [b.date, b.close]));

async function loadName(sym) {
  const px = await bars(sym);
  const prints = await earningsDates(sym).catch(() => []);
  const closes = px.map((b) => b.close);
  const dates = px.map((b) => b.date);
  const lr = closes.map((c, i) => (i === 0 ? 0 : Math.log(c / closes[i - 1])));
  const printAt = prints.map((p) => dates.findIndex((d) => d >= p)).filter((i) => i > 0);
  // A print's reaction can land on its filing session or the next (EDGAR has no time of day), so
  // both returns are left out of the base vol and carried by the event term instead.
  const touched = new Set(printAt.flatMap((s) => [s, s + 1]));
  const baseVol = closes.map((_, t) => {
    const clean = [];
    for (let i = t; i >= 1 && clean.length < VOL_WINDOW; i--)
      if (!touched.has(i)) clean.push(lr[i]);
    return clean.length < VOL_WINDOW ? null : annualizedVol(clean);
  });
  // Each print's two-session move in excess of two ordinary sessions: what the event alone adds.
  const moves = printAt
    .filter((s) => s + 1 < closes.length && baseVol[s - 1] != null)
    .map((s) => {
      const r2 = Math.log(closes[s + 1] / closes[s - 1]);
      const excess = Math.max(0, r2 * r2 - (2 * baseVol[s - 1] ** 2) / 252);
      return { reactedOn: dates[s + 1], move: Math.sqrt(excess) };
    });
  return {
    sym,
    px,
    closes,
    dates,
    prints,
    printAt,
    baseVol,
    moves,
    dds: drawdowns(closes),
    at: new Map(dates.map((d, i) => [d, i])),
  };
}

const universe = [];
for (const sym of BASKET) universe.push(await loadName(sym));
const pooledMoves = universe
  .flatMap((n) => n.moves)
  .sort((a, b) => (a.reactedOn < b.reactedOn ? -1 : 1));
const ddOn = (n, date) => n.dds[n.at.get(date) ?? -1]?.dd ?? null;
const start = (n) =>
  Math.max(
    WARMUP,
    LOOKBACK,
    n.dates.findIndex((d) => d >= SINCE),
  );

/** One session's weather, exactly as `cycle-phase.mjs` stateAt reads it. */
function stateAt(n, t) {
  const date = n.dates[t];
  const flagged = sectorFlag(universe.filter((p) => p !== n).map((p) => ddOn(p, date)));
  return {
    date,
    dd: n.dds[t].dd,
    bucket: ddBucket(n.dds[t].dd),
    wide: flagged.wide,
    vix: vixBucket(vixMap.get(date) ?? null),
  };
}

/** The phase a buy day reads, collapsed to the three rows the call sheet compares. */
function phaseRow(n, t, s) {
  const ddMinRecent = Math.min(...n.dds.slice(t - LOOKBACK + 1, t + 1).map((d) => d.dd));
  const ret20 = n.closes[t] / n.closes[t - 20] - 1;
  const phase = pricePhase({ dd: s.dd, ddMinRecent, ret20, wide: s.wide });
  if (phase === "pullback (sector-wide)") return "pullback, sector-wide";
  if (phase.startsWith("pullback")) return "pullback, single-name";
  return "not a pullback";
}

// Every basket entry whose whole 126-session recovery window has closed, with the day it closed.
const names = new Map();
for (const n of universe) {
  const entries = [];
  for (let t = start(n); t + RECOVER_HORIZON < n.closes.length; t++) {
    const s = stateAt(n, t);
    const o = outcomeAt(n.closes, t, n.dds[t].high);
    entries.push({ t, maturedOn: n.dates[t + RECOVER_HORIZON], ...s, backToEntry: o.backToEntry });
  }
  names.set(n.sym, { sym: n.sym, entries });
}

/** Implied vol for `expiry` at session k's close; `eventScale` prices each print's move up or down. */
function volAt(n, k, expiry, { eventScale = 1 } = {}) {
  const m =
    (eventMove(n.moves, n.dates[k]) ?? eventMove(pooledMoves, n.dates[k]) ?? 0) * eventScale;
  return impliedVol({
    baseVol: n.baseVol[k],
    years: daysBetween(n.dates[k], expiry) / 365,
    events: eventsAhead(n.prints, n.dates[k], expiry),
    eventMove: m,
  });
}

/** The playbook's call bought at session t, held to its exit; null if nothing is listed or the tape ends first. */
function buy(n, t, opts = {}) {
  const exp = entryExpiry(n.dates[t], { scheme: opts.scheme });
  if (!exp) return null;
  const trade = longCallTrade({
    closes: n.closes,
    dates: n.dates,
    t,
    expiry: exp.expiry,
    volAt: (k) => volAt(n, k, exp.expiry, opts),
  });
  return trade && { ...trade, expiry: exp.expiry, days: exp.days };
}

const pct = (x, d = 0) => (x == null ? "n/a" : `${(x * 100).toFixed(d)}%`);
const signed = (x, d = 1) => (x == null ? "n/a" : `${x >= 0 ? "+" : ""}${(x * 100).toFixed(d)}%`);
const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const share = (rows, f) => (rows.length ? rows.filter(f).length / rows.length : null);
const describe = (rois) =>
  `mean ${signed(avg(rois))} · won ${pct(share(rois, (x) => x > 0))} · lost over half ${pct(share(rois, (x) => x < -0.5))}`;
const out = { sections: [] };
const PHASES = ["pullback, sector-wide", "pullback, single-name", "not a pullback"];
const sellers = universe.filter((n) => n.prints.length >= 2);

// ── Question 1: the quiet fence ───────────────────────────────────────────────────────────────
/** Every offset's trade around the print at session s0, or null when any one can't be scored. */
function aroundPrint(n, s0, opts) {
  const roi = {};
  for (const o of OFFSETS) {
    const t = s0 + o;
    // A pre-print buy inside an earlier print's blackout is one the playbook could not make.
    if (o < 0 && heldBack(n.printAt, t, 1)) return null;
    const trade = n.baseVol[t] != null && buy(n, t, opts);
    if (!trade) return null;
    roi[o] = trade;
  }
  return roi;
}

function printRows(opts = {}) {
  const rows = [];
  for (const n of sellers) {
    for (const s0 of n.printAt) {
      if (s0 + OFFSETS[0] < Math.max(start(n), VOL_WINDOW + 2)) continue;
      const roi = aroundPrint(n, s0, opts);
      if (!roi) continue;
      const phase = phaseRow(n, s0 + 2, stateAt(n, s0 + 2));
      rows.push({ sym: n.sym, print: n.dates[s0], phase, roi });
    }
  }
  return rows;
}

const DIFFS = [
  ["D+7 − D+2 (what the fence changes)", 7, 2],
  ["D+7 − D-1 (after the crush vs just before)", 7, -1],
  ["D+7 − D-5", 7, -5],
];

function quietSection(title, rows, { offsets = true, diffs = DIFFS } = {}) {
  console.log(`\n=== ${title}: ${rows.length} prints ===`);
  const section = { title, prints: rows.length, offsets: {}, diffs: {} };
  if (!rows.length) return out.sections.push(section);
  if (offsets)
    for (const o of OFFSETS) {
      const rois = rows.map((r) => r.roi[o].roi);
      const label = o < 0 ? `D${o}` : `D+${o}`;
      section.offsets[label] = {
        mean: avg(rois),
        won: share(rois, (x) => x > 0),
        lostHalf: share(rois, (x) => x < -0.5),
        doubled: share(rows, (r) => r.roi[o].cause === "profit"),
      };
      console.log(
        `  buy at ${label.padEnd(5)} ${describe(rois)} · sold at double ${pct(section.offsets[label].doubled)}`,
      );
    }
  for (const [label, a, b] of diffs) {
    const d = blockInterval(
      rows,
      (r) => r.roi[a].roi - r.roi[b].roi,
      (r) => quarterOf(r.print),
    );
    const better = share(rows, (r) => r.roi[a].roi > r.roi[b].roi);
    section.diffs[label] = { ...d, better };
    console.log(
      `  ${label.padEnd(44)} ${signed(d.mean)} [90% ${signed(d.lo)} .. ${signed(d.hi)}] · ${d.blocks} quarters · D+${a} better on ${pct(better)}`,
    );
  }
  out.sections.push(section);
}

const prints = printRows();
quietSection("Q1 · basket, every print", prints);
quietSection(
  "Q1 · CRWV alone (colour: its prints since listing)",
  prints.filter((r) => r.sym === "CRWV"),
);
quietSection(
  "Q1 · NVDA alone",
  prints.filter((r) => r.sym === "NVDA"),
);
// Split by the phase D+2 reads: fair for D+7 − D+2 (both buys come after that close), but not for
// a pre-print arm, whose buy could not know the print's move, so only the fence's row prints.
for (const p of PHASES)
  quietSection(
    `Q1 · basket, ${p} on D+2`,
    prints.filter((r) => r.phase === p),
    {
      offsets: false,
      diffs: DIFFS.slice(0, 1),
    },
  );
for (const [label, opts] of [
  [
    "Q1 · basket, each print priced at 0.8x its past moves (moves run larger than priced)",
    { eventScale: 0.8 },
  ],
  ["Q1 · basket, each print priced at 1.25x its past moves", { eventScale: 1.25 }],
  ["Q1 · basket, no event term (a plain realized-vol proxy, no crush)", { eventScale: 0 }],
])
  quietSection(label, printRows(opts), { offsets: false });

// ── Question 2: the expiry floor ──────────────────────────────────────────────────────────────
function entryRows(opts = {}) {
  const rows = [];
  const unlisted = {};
  for (const n of sellers) {
    unlisted[n.sym] = 0;
    for (let t = Math.max(start(n), VOL_WINDOW + 2); t < n.closes.length; t += STEP) {
      if (n.baseVol[t] == null || heldBack(n.printAt, t, 1)) continue;
      if (!entryExpiry(n.dates[t], { scheme: opts.scheme })) {
        unlisted[n.sym]++;
        continue;
      }
      const trade = buy(n, t, opts);
      if (!trade) break;
      const s = stateAt(n, t);
      const band = recoveryBand({
        sym: n.sym,
        state: s,
        names,
        asOf: n.dates[t],
        q: opts.q ?? 0.75,
      });
      const floor = band ? expiryFloor(n.dates, t, band.sessions) : null;
      rows.push({
        sym: n.sym,
        date: n.dates[t],
        phase: phaseRow(n, t, s),
        roi: trade.roi,
        noBand: !band,
        blocked: floor != null && trade.expiry < floor,
        never: floor === NEVER,
      });
    }
  }
  return { rows, unlisted };
}

function floorRow(label, rows) {
  if (!rows.length) return console.log(`  ${label.padEnd(28)} no entries`);
  const d = blockInterval(
    rows,
    (r) => (r.blocked ? -r.roi : 0),
    (r) => quarterOf(r.date),
  );
  const skipped = rows.filter((r) => r.blocked).map((r) => r.roi);
  const kept = rows.filter((r) => !r.blocked).map((r) => r.roi);
  const row = {
    label,
    n: rows.length,
    quarters: d.blocks,
    binds: share(rows, (r) => r.blocked),
    never: share(rows, (r) => r.never),
    noBand: share(rows, (r) => r.noBand),
    playbook: avg(rows.map((r) => r.roi)),
    floored: avg(rows.map((r) => (r.blocked ? 0 : r.roi))),
    skipped: { n: skipped.length, mean: avg(skipped), won: share(skipped, (x) => x > 0) },
    kept: { n: kept.length, mean: avg(kept), won: share(kept, (x) => x > 0) },
    diff: d,
  };
  console.log(
    `  ${label.padEnd(28)} ${String(row.n).padStart(5)} entries, ${String(row.quarters).padStart(3)} quarters · floor leaves nothing ${pct(row.binds)} (band never back ${pct(row.never)}), no band ${pct(row.noBand)}`,
  );
  console.log(
    `      playbook ${describe(rows.map((r) => r.roi))} · calls the floor skipped: ${skipped.length ? `mean ${signed(row.skipped.mean)}, won ${pct(row.skipped.won)}` : "none"} · kept: mean ${signed(row.kept.mean)}, won ${pct(row.kept.won)}`,
  );
  console.log(
    `      floor − playbook, return per entry (idle = 0): ${signed(d.mean)} [90% ${signed(d.lo)} .. ${signed(d.hi)}]`,
  );
  return row;
}

/** One Q2 section; `only` keeps one name's entries, and its own unlisted days. */
function floorSection(title, { rows: all, unlisted: bySym }, { phases = true, only } = {}) {
  const rows = only ? all.filter((r) => r.sym === only) : all;
  const unlisted = only ? (bySym[only] ?? 0) : Object.values(bySym).reduce((a, b) => a + b, 0);
  console.log(`\n=== ${title} (${unlisted} days had nothing listed 120–200 days out) ===`);
  const groups = [
    ["all entries", rows],
    ...(phases ? PHASES.map((p) => [p, rows.filter((r) => r.phase === p)]) : []),
  ];
  out.sections.push({ title, unlisted, rows: groups.map(([l, r]) => floorRow(l, r)) });
}

const base = entryRows();
floorSection("Q2 · basket, floor at the recovery band's p75 (the fence as a rule)", base);
floorSection("Q2 · CRWV alone", base, { only: "CRWV" });
floorSection("Q2 · NVDA alone", base, { only: "NVDA", phases: false });
floorSection(
  "Q2 · basket, a thin chain (March cycle + January only)",
  entryRows({ scheme: "quarterly" }),
  { phases: false },
);
floorSection("Q2 · basket, floor at the band's median (shallower)", entryRows({ q: 0.5 }), {
  phases: false,
});
floorSection("Q2 · basket, floor at the band's p90 (deeper)", entryRows({ q: 0.9 }), {
  phases: false,
});

// ── Today on CRWV, and the live fence re-derived ──────────────────────────────────────────────
const crwv = universe.find((n) => n.sym === "CRWV");
const ruleOn = (t) => {
  const s = stateAt(crwv, t);
  const band = recoveryBand({ sym: "CRWV", state: s, names, asOf: s.date });
  return { date: s.date, band, floor: band ? expiryFloor(crwv.dates, t, band.sessions) : null };
};
const tRead = crwv.dates.findIndex((d) => d >= LIVE_FLOOR.readOn);
if (tRead < 0)
  throw new Error(`CRWV's tape ends before ${LIVE_FLOOR.readOn}: clear the bars cache`);
const tNow = crwv.closes.length - 1;
const read = ruleOn(tRead);
const now = ruleOn(tNow);
const expNow = entryExpiry(now.date);
// The next print's window, as the live calendar holds it (`earnings-calendar.ts`): an estimate's
// blackout and quiet period both count from the window's END. --print-window=start..end, else a
// filed print or the cadence projection as a one-day window, never a date already past.
const projected = printCadence(crwv.prints, now.date).projectedNext;
const one = crwv.prints.find((p) => p > now.date) ?? (projected > now.date ? projected : null);
// A single date is a one-day window, the same as a filed print.
const [winStart, winEnd = winStart] = flag("print-window")?.split("..") ?? [one];
const printWindow = winEnd && {
  start: winStart,
  end: winEnd,
  playbookFirstBuy: weekdaysAfter(winEnd, 2),
  quietFirstBuy: weekdaysAfter(winEnd, QUIET_SESSIONS + 1),
};
const bandLine = (r) =>
  r.band
    ? `p75 back to entry ${Number.isFinite(r.band.sessions) ? `${r.band.sessions} sessions` : "never (over a quarter never came back)"} (${r.band.sample} · ${r.band.level}, ${r.band.units} units) → expiry floor ${r.floor}`
    : "no band reaches 8 units, so no floor";
console.log(
  `\nThe live fence re-derived on ${read.date}: ${bandLine(read)} (live: ${LIVE_FLOOR.day})`,
);
console.log(
  `CRWV today (${now.date}, close ${crwv.closes[tNow].toFixed(2)}, ${phaseRow(crwv, tNow, stateAt(crwv, tNow))}): ${bandLine(now)} · the playbook's expiry ${expNow ? `${expNow.expiry} (${expNow.days} days)` : "none listed"}${expNow ? ` · live fence ${expNow.expiry >= LIVE_FLOOR.day ? "does not bind" : "binds"}${now.floor ? `, the rule ${expNow.expiry >= now.floor ? "does not bind" : "binds"}` : ""}` : ", so neither fence is what stops a buy"}`,
);
if (printWindow)
  console.log(
    `  next print ${printWindow.start === printWindow.end ? printWindow.start : `window ${printWindow.start}..${printWindow.end}`}: the playbook's first buy after it about ${printWindow.playbookFirstBuy}, the quiet fence's about ${printWindow.quietFirstBuy}`,
  );
out.today = { read, now, expNow, printWindow, liveFloor: LIVE_FLOOR };
console.log(
  "modeled premium (Black–Scholes on a print-free realized-vol base plus each print ahead, priced at the name's past moves) · closes, not intraday · paper-only research, not an order",
);

const json = flag("json");
if (json) writeFileSync(json, JSON.stringify(out, null, 1));
