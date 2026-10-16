#!/usr/bin/env node
/**
 * CYCLE PHASE — where is this name in its swing today, and what did the same weather lead to?
 *
 *   node scripts/research/cycle-phase.mjs CRWV,NVDA
 *   node scripts/research/cycle-phase.mjs CRWV --peers NVDA,NBIS,MU,AVGO,AMD --no-chain --json=out.json
 *
 * #5482 slice 1, "the swing study". Eric (2026-10-16): "The real questions are geared around
 * determining how much more pullback there may be, gauging where the bottom is, and timeline to
 * swing back up" — and current weather over the almanac. So this reads TODAY's conditions
 * (drawdown, how many peers fell with it, VIX, the print clock, implied vs realized), names the
 * phase by the rules in `cycle-phase-math.mjs`, and then finds every past session in the same
 * conditions and reports what followed:
 *
 *   further drawdown     lowest close in the next 63 sessions vs the entry close (p25/median/p75)
 *   sessions to the low  when that lowest close came
 *   back to entry        sessions until a close at or above the entry, after the low
 *   back to the high     the same for the 60-session high the drawdown was measured from
 *   close at the put     the close at the last expiry before the next print, vs entry — where a
 *                        cash-secured put sold today would have finished
 *
 * Samples: the name's own history from 2005 (CRWV from listing), and a pooled basket (the name and
 * its peers). Pooled drawdowns are also shown VOL-SCALED — divided by each entry's trailing
 * 60-session realized vol and multiplied by today's — because a −20% month means different things
 * on NVDA and on CRWV. The headline band is the first sample/level with ≥ 8 independent units
 * (own: episodes; pooled: cross-name clusters); every level is printed so the choice is visible.
 *
 * PRICE AND TODAY'S CHAIN ONLY. No option-price history exists offline, so implied vol enters as
 * today's reading (premium-fit's own fit test), never as a historical condition. Closes, not
 * intraday lows. Paper-only, educational; nothing here routes an order.
 */

import { writeFileSync } from "node:fs";
import {
  band,
  clusterCount,
  DD_LABELS,
  ddBucket,
  drawdowns,
  episodesOf,
  LOOKBACK,
  LOW_HORIZON,
  outcomeAt,
  perEpisode,
  pricePhase,
  printOverlay,
  RECOVER_HORIZON,
  rankQuantile,
  sectorFlag,
  vixBucket,
  WARMUP,
} from "./cycle-phase-math.mjs";
import { printBand, printEpisodes, printReading } from "./cycle-phase-report.mjs";
import { bars, earningsDates } from "./market-data.mjs";
import { fetchChain, putAtDelta } from "./option-chain.mjs";
import { premiumFit } from "./premium-fit.mjs";
import { annualizedVol, printCadence, quantile } from "./premium-fit-math.mjs";

const BASKET = ["NVDA", "CRWV", "NBIS", "MU", "AVGO", "AMD"];
const SINCE = "2005-01-01";
const MIN_UNITS = 8;
/**
 * The house calendar's next-print window START (src/domain/earnings-calendar.ts), the conservative
 * edge for "a sold leg must expire before it". Cadence projection is the fallback for other names.
 */
const HOUSE_NEXT = { CRWV: "2026-11-09", NVDA: "2026-11-17" };

const isWeekday = (iso) => ![0, 6].includes(new Date(`${iso}T00:00:00Z`).getUTCDay());
const nextDay = (iso) =>
  new Date(Date.parse(`${iso}T00:00:00Z`) + 864e5).toISOString().slice(0, 10);

/** Weekdays in (from, to] — sessions, ignoring holidays (none fall in the windows read here). */
function weekdaysBetween(from, to) {
  let n = 0;
  for (let d = nextDay(from); d <= to; d = nextDay(d)) if (isWeekday(d)) n++;
  return n;
}

/** The last Friday strictly before `print`: the latest weekly expiry a sold leg may hold. */
function lastFridayBefore(print) {
  let d = new Date(Date.parse(`${print}T00:00:00Z`) - 864e5);
  while (d.getUTCDay() !== 5) d = new Date(d.getTime() - 864e5);
  return d.toISOString().slice(0, 10);
}

async function loadName(sym) {
  const px = await bars(sym);
  const prints = await earningsDates(sym).catch(() => []); // NBIS files 6-Ks: no Item 2.02
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

const ddOn = (name, date) => name.dds[name.at.get(date) ?? -1]?.dd ?? null;

/** The conditions of `name` on session `i`, as the history match reads them. */
function stateAt(name, i, peers, vixOn) {
  const date = name.px[i].date;
  const flag = sectorFlag(peers.map((p) => ddOn(p, date)));
  const vix = vixOn(date);
  return { date, dd: name.dds[i].dd, bucket: ddBucket(name.dds[i].dd), wide: flag.wide, flag, vix };
}

/** Today's reading for one target: the inputs, the phase, the print clock, the chain. */
async function readToday(name, peers, vixOn, opts) {
  const i = name.closes.length - 1;
  const s = stateAt(name, i, peers, vixOn);
  const { high, sinceHigh } = name.dds[i];
  const ddMinRecent = Math.min(...name.dds.slice(i - LOOKBACK + 1, i + 1).map((d) => d.dd));
  const ret20 = name.closes[i] / name.closes[i - 20] - 1;
  const last = name.prints.filter((p) => p <= s.date).at(-1) ?? null;
  const lastIdx = last ? name.px.findIndex((b) => b.date >= last) : -1;
  const next =
    opts.nextPrint[name.sym] ??
    HOUSE_NEXT[name.sym] ??
    (name.prints.length >= 2 ? printCadence(name.prints, s.date).projectedNext : null);
  const clock = {
    last,
    sinceLast: lastIdx >= 0 ? i - lastIdx : null,
    next,
    toNext: next ? weekdaysBetween(s.date, next) : null,
  };
  const putExpiry = next ? lastFridayBefore(next) : null;
  const putHold = putExpiry ? weekdaysBetween(s.date, putExpiry) : null;
  const phase = [pricePhase({ ...s, ddMinRecent, ret20 }), printOverlay(clock)]
    .filter(Boolean)
    .join(" · ");
  const options = opts.chain ? await readChain(name.sym, putExpiry, s.date) : null;
  return {
    ...s,
    close: name.closes[i],
    high,
    sinceHigh,
    ret20,
    ddMinRecent,
    rv60: name.rv60[i],
    peerDds: peers.map((p) => [p.sym, ddOn(p, s.date)]),
    // Yahoo serves the session in progress as a bar; before ~4pm ET it is a price, not a close.
    live: s.date === new Date().toISOString().slice(0, 10) && new Date().getUTCHours() < 21,
    clock,
    putExpiry,
    putHold,
    phase,
    options,
  };
}

/** Today's implied vol against forward realized (premium-fit's fit test) and the pre-print puts. */
async function readChain(sym, putExpiry, today) {
  try {
    const f = await premiumFit(sym, { today });
    const { contracts } = await fetchChain(sym, { today });
    const puts = [0.2, 0.3].map((d) => {
      const p = putExpiry ? putAtDelta(contracts, putExpiry, d) : null;
      return p && { delta: d, strike: p.strike, bid: p.bid, iv: p.iv };
    });
    const { verdict, confidence, rank, gap } = f.fit;
    return { asOf: f.asOf, spot: f.spot, iv30: f.iv30, rank, gap, verdict, confidence, puts };
  } catch (e) {
    return { error: String(e?.message ?? e) };
  }
}

/** The first session a name's history sample may use: after warm-up, and from 2005 on. */
const sampleStart = (name) =>
  Math.max(
    WARMUP,
    name.px.findIndex((b) => b.date >= SINCE),
  );

/** Every past session of `name` in the same weather as `today`, at one conditioning level. */
function matchSessions(name, peers, vixOn, today, level) {
  const out = [];
  for (let t = sampleStart(name); t + LOW_HORIZON < name.closes.length; t++) {
    const s = stateAt(name, t, peers, vixOn);
    if (level !== "base" && s.bucket !== today.bucket) continue;
    if ((level === "exact" || level === "dd+sector") && s.wide !== today.wide) continue;
    if (level === "exact" && vixBucket(s.vix) !== vixBucket(today.vix)) continue;
    out.push(t);
  }
  return out;
}

/** One sample × level: episodes, clusters and the outcome bands. */
function bandsFor(sample, universe, vixOn, today, level) {
  const groups = [];
  const eps = [];
  let sessions = 0;
  for (const name of sample) {
    const peers = universe.filter((p) => p !== name);
    const idx = matchSessions(name, peers, vixOn, today, level);
    sessions += idx.length;
    for (const ep of level === "base" ? idx.map((t) => [t]) : episodesOf(idx)) {
      const holds = today.putHold ? [today.putHold] : [];
      const os = ep.map((t) => ({
        ...outcomeAt(name.closes, t, name.dds[t].high, holds),
        rv: name.rv60[t],
      }));
      groups.push(os);
      eps.push({ sym: name.sym, start: name.px[ep[0]].date, end: name.px[ep.at(-1)].date, os });
    }
  }
  if (!sessions) return { level, sessions: 0 };
  const scaleTo = today.rv60;
  const scaled = (f) => (o) => (o.rv && scaleTo ? (f(o) / o.rv) * scaleTo : null);
  const atPut = (o) => o.at?.[today.putHold];
  const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const share = (f) => avg(perEpisode(groups, (o) => (f(o) ? 1 : 0)));
  const ranks = (xs) => xs.length && [0.1, 0.25, 0.5, 0.75, 0.9].map((q) => rankQuantile(xs, q));
  const putQ = (xs) => xs.length && [0.1, 0.2, 0.5].map((q) => quantile(xs, q));
  // Historical assignment odds of today's quoted puts: the share of episodes whose close at the
  // put's expiry sat at or under the strike, raw and vol-scaled.
  const rungs = (today.options?.puts ?? []).filter(Boolean).map((p) => {
    const k = p.strike / today.close - 1;
    return {
      delta: p.delta,
      strike: p.strike,
      raw: share((o) => atPut(o) != null && atPut(o) <= k),
      scaled: share((o) => scaled(atPut)(o) != null && scaled(atPut)(o) <= k),
    };
  });
  return {
    level,
    sessions,
    episodes: level === "base" ? null : groups.length,
    clusters: level === "base" ? null : clusterCount(eps),
    further: band(perEpisode(groups, (o) => o.further)),
    furtherScaled: band(
      perEpisode(
        groups,
        scaled((o) => o.further),
      ),
    ),
    toLow: ranks(perEpisode(groups, (o) => o.toLow)),
    backToEntry: ranks(perEpisode(groups, (o) => o.backToEntry)),
    entryIn63: share((o) => o.backToEntry <= 63),
    highIn126: share((o) => o.backToHigh <= RECOVER_HORIZON),
    atPut: putQ(perEpisode(groups, atPut)),
    atPutScaled: putQ(perEpisode(groups, scaled(atPut))),
    rungs,
    eps: level === "base" ? [] : eps,
  };
}

/** The headline: own history at the most specific level with ≥ MIN_UNITS episodes, else pooled. */
function pickHeadline(rows) {
  for (const sample of ["own", "pooled"])
    for (const level of ["exact", "dd+sector", "dd only"]) {
      const r = rows.find((x) => x.sample === sample && x.level === level);
      const units = sample === "own" ? r?.episodes : r?.clusters;
      if (units >= MIN_UNITS) return r;
    }
  return null;
}

const args = process.argv.slice(2);
const flag = (k) => args.find((a) => a.startsWith(`--${k}=`))?.split("=")[1];
const peersArg =
  flag("peers") ?? (args.includes("--peers") ? args[args.indexOf("--peers") + 1] : undefined);
const targets = (args.find((a) => !a.startsWith("--") && a !== peersArg) ?? "CRWV,NVDA")
  .split(",")
  .map((s) => s.toUpperCase());
const peerList = peersArg ? peersArg.toUpperCase().split(",") : BASKET;
const nextPrint = Object.fromEntries(
  (flag("next-print") ?? "")
    .split(",")
    .filter(Boolean)
    .map((kv) => kv.split(":")),
);
const opts = { chain: !args.includes("--no-chain"), nextPrint };

const vixBars = await bars("^VIX");
const vixMap = new Map(vixBars.map((b) => [b.date, b.close]));
const vixOn = (d) => vixMap.get(d) ?? null;
const universe = [];
for (const sym of [...new Set([...targets, ...peerList])]) universe.push(await loadName(sym));
const out = [];
for (const sym of targets) {
  const name = universe.find((n) => n.sym === sym);
  const peers = universe.filter((n) => n !== name);
  const today = { sym, ...(await readToday(name, peers, vixOn, opts)) };
  printReading(today);
  const rows = [];
  const samples = [
    ["own", [name]],
    ["pooled", universe],
  ];
  for (const [sample, names] of samples)
    for (const level of ["exact", "dd+sector", "dd only", "base"]) {
      const b = bandsFor(names, universe, vixOn, today, level);
      rows.push({ sample, ...b });
      printBand(`${sample === "own" ? sym : "pooled basket"} · ${level}`, b, today);
    }
  // A reading within 1.5 points of a deeper bucket's edge gets that bucket printed beside it:
  // one bad session moves it there, and the band should not jump unseen.
  const edge = [-0.03, -0.1, -0.2, -0.3, -0.45][today.bucket];
  if (edge != null && today.dd - edge < 0.015) {
    const deeper = { ...today, bucket: today.bucket + 1 };
    for (const [sample, names] of samples)
      printBand(
        `${sample === "own" ? sym : "pooled"} · exact, ${DD_LABELS[deeper.bucket]} bucket`,
        bandsFor(names, universe, vixOn, deeper, "exact"),
        today,
      );
  }
  const head = pickHeadline(rows);
  console.log(
    head
      ? `  HEADLINE: ${head.sample} · ${head.level} (${head.sample === "own" ? `${head.episodes} episodes` : `${head.clusters} clusters`} ≥ ${MIN_UNITS})`
      : `  HEADLINE: none — no sample reaches ${MIN_UNITS} independent units; read every band as anecdote`,
  );
  if (args.includes("--episodes"))
    for (const r of rows.filter((x) => x.level === "exact" && x.eps?.length)) {
      console.log(`  episodes, ${r.sample} · exact:`);
      printEpisodes(r);
    }
  const strip = ({ eps, ...r }) => r;
  out.push({ today, rows: rows.map(strip), headline: head && strip(head) });
}
const span = (n) => `${n.sym} ${n.px[sampleStart(n)].date}→${n.px.at(-1).date}`;
console.log(
  `\nbasket ${universe.map(span).join(" · ")}` +
    `\nVIX ${vixBars.at(-1).date} ${vixBars.at(-1).close.toFixed(2)} · paper-only research, not an order`,
);
const json = flag("json");
// JSON has no Infinity: a censored recovery would serialize as null and read as "no data".
const censored = (_k, v) => (v === Number.POSITIVE_INFINITY ? `>${RECOVER_HORIZON}` : v);
if (json) writeFileSync(json, JSON.stringify(out, censored, 1));
