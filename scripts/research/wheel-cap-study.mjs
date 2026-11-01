#!/usr/bin/env node
/**
 * WHEEL CAP STUDY — should a wheel's put strike be capped at the cycle detector's floor band?
 *
 *   node scripts/research/wheel-cap-study.mjs
 *   node scripts/research/wheel-cap-study.mjs --json=out.json
 *
 * #6598 slice 1, Study A (parent plan #5482). Eric's AI-dip view fences CRWV-WHEEL: "put strike at
 * or under claim 7's floor band median" (`conviction-seeds.ts`). When a claim behind that fence
 * passes, `research:refine` proposes carrying the fence into the pair as its own setting, and
 * refuses to, for want of this study. The fence was written for one episode (one price, from the
 * 2026-10-16 run), so the study restates it as a rule any sale day can apply and replays the rule:
 *
 *   every 5th session on each basket name since 2005 (CRWV since listing), sell the put
 *   CRWV-WHEEL would sell, by CRWV-WHEEL's own settings on every name (the question is that pair's
 *   setting; the other names are its sample, so they do not get their live 30-day minimum): 0.15
 *   |delta|, the latest Friday 14 to 45 days out that expires before the next print, nothing on a
 *   print's session or the one after. Arm 1 sells it as is. Arm 2 caps the strike at close × (1 + the median further low of
 *   that day's headline floor band), rebuilt from outcomes finished by that day. Both arms are
 *   held to expiry and scored per dollar of cash secured.
 *
 * Results split by phase (`cycle-phase-math.mjs` pricePhase), because the fence was written in a
 * sector-wide pullback and "adopt in a phase" is one of the three calls. Intervals resample whole
 * calendar quarters (see `blockInterval`). NBIS stays in the basket's bands and sector flag but
 * sells no puts: it files 6-Ks, so its prints are unknown and the print rule cannot be applied.
 *
 * Modeled premium, price history only, closes not intraday. Paper-only, educational; nothing here
 * routes an order. The pure half is `wheel-cap-math.mjs`.
 */

import { readFileSync, writeFileSync } from "node:fs";
import {
  ddBucket,
  drawdowns,
  LOOKBACK,
  LOW_HORIZON,
  outcomeAt,
  pricePhase,
  sectorFlag,
  vixBucket,
  WARMUP,
} from "./cycle-phase-math.mjs";
import { bars, earningsDates } from "./market-data.mjs";
import { annualizedVol, printCadence } from "./premium-fit-math.mjs";
import {
  armStrikes,
  blockInterval,
  expiryFor,
  headlineFloor,
  inPrintTail,
  quarterOf,
  saleResult,
  strikeForPutDelta,
} from "./wheel-cap-math.mjs";

const BASKET = ["NVDA", "CRWV", "NBIS", "MU", "AVGO", "AMD"];
const SINCE = "2005-01-01";
const STEP = 5;
/** The live fence: claim 7's floor price as the studies ledger holds it (what the resolver reads,
 *  `conviction-steering.ts` floorOf), set beside today's point-in-time reading. */
function liveFence() {
  const ledger = JSON.parse(readFileSync("src/playbooks/conviction-studies.json", "utf8"));
  const claim = (ledger["ai-dip-2026-10"] ?? []).find((c) => c.statement?.startsWith("7. "));
  const price = claim?.study?.verdict?.numbers?.floorAtMedian;
  if (!(price > 0)) throw new Error("conviction-studies.json: claim 7 carries no floorAtMedian");
  return { price, on: claim.study.dataDate };
}
const LIVE_FENCE = liveFence();

const args = process.argv.slice(2);
const flag = (k) => args.find((a) => a.startsWith(`--${k}=`))?.split("=")[1];

const vixBars = await bars("^VIX");
const vixMap = new Map(vixBars.map((b) => [b.date, b.close]));

async function loadName(sym) {
  const px = await bars(sym);
  const prints = await earningsDates(sym).catch(() => []);
  const closes = px.map((b) => b.close);
  const lr = closes.map((c, i) => (i === 0 ? 0 : Math.log(c / closes[i - 1])));
  const rv60 = closes.map((_, i) => (i < 61 ? null : annualizedVol(lr.slice(i - 59, i + 1))));
  return {
    sym,
    px,
    closes,
    prints,
    rv60,
    dds: drawdowns(closes),
    at: new Map(px.map((b, i) => [b.date, i])),
  };
}

const universe = [];
for (const sym of BASKET) universe.push(await loadName(sym));
const ddOn = (n, date) => n.dds[n.at.get(date) ?? -1]?.dd ?? null;
const start = (n) =>
  Math.max(
    WARMUP,
    LOOKBACK,
    n.px.findIndex((b) => b.date >= SINCE),
  );

/** One session's weather, exactly as `cycle-phase.mjs` stateAt reads it. */
function stateAt(n, t) {
  const date = n.px[t].date;
  const flagged = sectorFlag(universe.filter((p) => p !== n).map((p) => ddOn(p, date)));
  return {
    date,
    dd: n.dds[t].dd,
    bucket: ddBucket(n.dds[t].dd),
    wide: flagged.wide,
    vix: vixBucket(vixMap.get(date) ?? null),
  };
}

// Every basket entry whose 63-session outcome is known, with the day it became known.
const names = new Map();
for (const n of universe) {
  const entries = [];
  for (let t = start(n); t + LOW_HORIZON < n.closes.length; t++) {
    const s = stateAt(n, t);
    const o = outcomeAt(n.closes, t, n.dds[t].high);
    entries.push({
      t,
      date: s.date,
      maturedOn: n.px[t + LOW_HORIZON].date,
      ...s,
      further: o.further,
    });
  }
  names.set(n.sym, { sym: n.sym, entries });
}

/** The phase a sale day reads, collapsed to the three rows the call sheet compares. */
function phaseRow(n, t, s) {
  const ddMinRecent = Math.min(...n.dds.slice(t - LOOKBACK + 1, t + 1).map((d) => d.dd));
  const ret20 = n.closes[t] / n.closes[t - 20] - 1;
  const phase = pricePhase({ dd: s.dd, ddMinRecent, ret20, wide: s.wide });
  if (phase === "pullback (sector-wide)") return "pullback, sector-wide";
  if (phase.startsWith("pullback")) return "pullback, single-name";
  return "not a pullback";
}

// The sales: every STEP-th session a put could be sold and its expiry close is on the tape.
const sales = [];
let dark = 0;
for (const n of universe) {
  if (n.prints.length < 2) continue;
  const dates = n.px.map((b) => b.date);
  for (let t = Math.max(start(n), 61); t < n.closes.length; t += STEP) {
    const date = n.px[t].date;
    const nextPrint = n.prints.find((p) => p > date) ?? null;
    const exp = inPrintTail(dates, t, n.prints) ? null : expiryFor(date, nextPrint);
    if (!exp) {
      dark++;
      continue;
    }
    if (n.px.at(-1).date < exp.expiry) break;
    let e = t;
    while (e + 1 < n.px.length && n.px[e + 1].date <= exp.expiry) e++;
    const s = stateAt(n, t);
    const floor = headlineFloor({ sym: n.sym, state: s, names, asOf: date });
    sales.push({
      sym: n.sym,
      date,
      expiry: exp.expiry,
      years: exp.days / 365,
      spot: n.closes[t],
      vol: n.rv60[t],
      closeAtExpiry: n.closes[e],
      phase: phaseRow(n, t, s),
      floor,
    });
  }
}

/** Both arms of one sale, at a vol scale and a cap quantile. */
function score(sale, { ivScale = 1, q = "p50" } = {}) {
  const vol = sale.vol * ivScale;
  const cap = sale.floor ? sale.spot * (1 + sale.floor[q]) : null;
  const k = armStrikes({ spot: sale.spot, vol, years: sale.years, cap });
  const at = { spot: sale.spot, vol, years: sale.years, closeAtExpiry: sale.closeAtExpiry };
  return {
    ...k,
    noFloor: cap == null,
    playbook: saleResult({ ...at, strike: k.playbook }),
    capped: saleResult({ ...at, strike: k.capped }),
  };
}

const pct = (x, d = 1) => (x == null ? "n/a" : `${(x * 100).toFixed(d)}%`);
const signed = (x, d = 2) => (x == null ? "n/a" : `${x >= 0 ? "+" : ""}${(x * 100).toFixed(d)}%`);
const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const share = (rows, f) => (rows.length ? rows.filter(f).length / rows.length : null);

/** One table row: both arms' measures and the paired difference with its block interval. */
function summarize(label, rows, opts) {
  const scored = rows.map((r) => ({ ...r, s: score(r, opts) }));
  if (!scored.length) return { label, n: 0 };
  // Per sale DAY, idle cycles included as zero: averaging over sales made would drop exactly the
  // low-vol days the cap idles, and read as the cap raising premium.
  const arm = (k) => {
    const assigned = scored.filter((r) => r.s[k].assigned);
    return {
      premium: avg(scored.map((r) => r.s[k].premium)),
      assignedShare: share(scored, (r) => r.s[k].assigned),
      lossWhenAssigned: avg(assigned.map((r) => r.s[k].pnl)),
      pnl: avg(scored.map((r) => r.s[k].pnl)),
    };
  };
  const diff = blockInterval(
    scored,
    (r) => r.s.capped.pnl - r.s.playbook.pnl,
    (r) => quarterOf(r.date),
  );
  return {
    label,
    n: scored.length,
    quarters: diff?.blocks ?? 0,
    binds: share(scored, (r) => r.s.binds),
    blocked: share(scored, (r) => r.s.blocked),
    noFloor: share(scored, (r) => r.s.noFloor),
    playbook: arm("playbook"),
    capped: arm("capped"),
    diff,
  };
}

function print(row) {
  if (!row.n) return console.log(`  ${row.label.padEnd(34)} no sales`);
  const a = (x) =>
    `prem ${pct(x.premium, 2)} · assigned ${pct(x.assignedShare, 0)} · loss if assigned ${signed(x.lossWhenAssigned, 1)} · P/L ${signed(x.pnl)}`;
  console.log(
    `  ${row.label.padEnd(34)} ${String(row.n).padStart(5)} sales, ${String(row.quarters).padStart(3)} quarters · cap binds ${pct(row.binds, 0)}, leaves no strike ${pct(row.blocked, 0)}, no floor ${pct(row.noFloor, 0)}`,
  );
  console.log(`      playbook  ${a(row.playbook)}`);
  console.log(`      capped    ${a(row.capped)}`);
  console.log(
    `      capped − playbook, P/L per $ secured per sale: ${signed(row.diff.mean, 3)} [90% ${signed(row.diff.lo, 3)} .. ${signed(row.diff.hi, 3)}]`,
  );
}

const PHASES = ["pullback, sector-wide", "pullback, single-name", "not a pullback"];
const sellers = [...new Set(sales.map((s) => s.sym))];
const out = { sales: sales.length, dark, sections: [] };

console.log(
  `WHEEL CAP STUDY · ${sales.length} modeled sales on ${sellers.join(", ")} (every ${STEP}th session; ${dark} days dark for the print rule)`,
);
const section = (title, opts, groups) => {
  console.log(`\n=== ${title} ===`);
  const rows = groups.map(([label, rows]) => summarize(label, rows, opts));
  rows.forEach(print);
  out.sections.push({ title, opts, rows });
};
const byPhase = (rows) => [
  ["all sales", rows],
  ...PHASES.map((p) => [p, rows.filter((r) => r.phase === p)]),
];

section("Basket, cap at the floor band median (the fence as a rule)", {}, byPhase(sales));
section(
  "CRWV alone (colour: one listing year)",
  {},
  byPhase(sales.filter((s) => s.sym === "CRWV")),
);
section("NVDA alone", {}, byPhase(sales.filter((s) => s.sym === "NVDA")));
const pull = sales.filter((r) => r.phase === "pullback, sector-wide");
section("Sector-wide pullbacks, premium proxy at 0.8x and 1.25x realized vol", {}, []);
for (const ivScale of [0.8, 1.25]) {
  const row = summarize(`vol proxy ${ivScale}x`, pull, { ivScale });
  print(row);
  out.sections.at(-1).rows.push(row);
}
section("Sector-wide pullbacks, a deeper (p25) or shallower (p75) cap", {}, []);
for (const q of ["p25", "p75"]) {
  const row = summarize(`cap at ${q}`, pull, { q });
  print(row);
  out.sections.at(-1).rows.push(row);
}

// Today on CRWV: the floor the rule would read now, beside the live fence's fixed price.
const crwv = universe.find((n) => n.sym === "CRWV");
const tNow = crwv.closes.length - 1;
const sNow = stateAt(crwv, tNow);
const fNow = headlineFloor({ sym: "CRWV", state: sNow, names, asOf: sNow.date });
// The next print: --next-print (the IR date, ahead of its 8-K), else a filed one, else the cadence
// projection, and never a date already past, which would read every expiry as crossing it.
const projected = printCadence(crwv.prints, sNow.date).projectedNext;
const nextKnown =
  flag("next-print") ??
  crwv.prints.find((p) => p > sNow.date) ??
  (projected > sNow.date ? projected : null);
const crwvDates = crwv.px.map((b) => b.date);
const expNow = inPrintTail(crwvDates, tNow, crwv.prints) ? null : expiryFor(sNow.date, nextKnown);
// Where the next sale's 0.15-delta put strikes at today's vol, as a share of spot (a 30-day put
// while the wheel is dark): the live fence binds only once CRWV closes above fence / that share.
const tenor = expNow?.days ?? 30;
const strikeShare = strikeForPutDelta(1, crwv.rv60[tNow], tenor / 365);
const today = {
  date: sNow.date,
  close: crwv.closes[tNow],
  phase: phaseRow(crwv, tNow, sNow),
  floor: fNow && crwv.closes[tNow] * (1 + fNow.p50),
  band: fNow,
  liveFence: LIVE_FENCE,
  expiry: expNow,
  rv60: crwv.rv60[tNow],
  tenor,
  strikeShare,
  fenceBindsAbove: LIVE_FENCE.price / strikeShare,
};
console.log(
  `\nCRWV today (${today.date}): close ${today.close.toFixed(2)} · ${today.phase} · the rule's floor ${today.floor ? `$${today.floor.toFixed(2)} (${fNow.sample} · ${fNow.level}, ${fNow.units} units, median further low ${signed(fNow.p50, 1)})` : "none (no band reaches 8 units)"} · live fence $${LIVE_FENCE.price.toFixed(2)} (${LIVE_FENCE.on}) · ${expNow ? `next sale expires ${expNow.expiry}` : `the wheel is dark: no expiry 14–45 days out clears the ${nextKnown ?? "next"} print, or it is the print's session or the one after`}`,
);
console.log(
  `  at today's ${pct(today.rv60, 0)} realized vol a ${tenor}-day 0.15-delta put strikes ${pct(strikeShare, 0)} of spot, so the live fence binds only above a $${today.fenceBindsAbove.toFixed(2)} close`,
);
out.today = today;
console.log(
  "modeled premium (Black–Scholes on 60-session realized vol) · closes, not intraday · paper-only research, not an order",
);

const json = flag("json");
if (json) writeFileSync(json, JSON.stringify(out, null, 1));
