#!/usr/bin/env node

/**
 * DRAWDOWN QUEST STUDY — what did three moves return after a broad index sat 10%+ under its year
 * high with VIX at 25+?
 *
 *   node scripts/research/drawdown-quest-study.mjs
 *
 * #7028 slice 2. Eric's example (2026-11-07): "after a huge correction in the market, if a
 * portfolio has a lot of cash, it's a great time to enter positions, write cash secured puts,
 * enter long calls". That is a thesis, and corrections can deepen (2000-02, 2008), so a quest
 * built on it must carry the measured base rate of the move after the condition, its sample size
 * and its worst decile, never the word "great". This is the instrument that produces those
 * numbers; `docs/research/drawdown-quests-2026-11.md` is what it printed.
 *
 * Thresholds, control, clusters, power and the three moves were fixed before any result was read
 * and are written in `drawdown-quest-math.mjs`'s header. Nothing here tunes them. Closes only,
 * options modeled (no offline history of option prices). Paper-only; educational; nothing here
 * routes an order.
 */

import { writeFileSync } from "node:fs";
import {
  alignSeries,
  blendedVol,
  CALL_DELTA,
  CALL_YEARS,
  callLegs,
  DRAWDOWN,
  EPISODE_GAP,
  episodesOf,
  flatVol,
  gapInterval,
  moveVerdict,
  PUT_DELTA,
  PUT_SESSIONS,
  pickEntries,
  putCycle,
  SHARE_HOLDS,
  STEP,
  shareReturn,
  stateAt,
  summarize,
  underHigh,
  VIX_FLOOR,
} from "./drawdown-quest-math.mjs";
import { bars } from "./market-data.mjs";

const pct = (x, digits = 0) =>
  x == null ? "n/a" : `${x >= 0 ? "+" : ""}${(x * 100).toFixed(digits)}%`;
const share = (x) => `${(x * 100).toFixed(0)}%`;

/** `--json=path` writes the table slice 3 reads: the base rate each move carries as a quest. */
const jsonPath = process.argv.find((a) => a.startsWith("--json="))?.slice(7);
const table = {};

const vix = await bars("^VIX");

/** The moves, each a function of (series, t) giving a return on the capital it ties up. */
function moves(series) {
  const putVol = series.vix.map((v) => v / 100);
  const callFor = (volAt) => (t) =>
    callLegs({ close: series.close, volAt, t, years: CALL_YEARS, delta: CALL_DELTA });
  const blended = callFor(blendedVol(series));
  return {
    ...Object.fromEntries(
      SHARE_HOLDS.map((hold) => [`shares ${hold}d`, (t) => shareReturn(series.close, t, hold)]),
    ),
    [`put ${PUT_SESSIONS}d @${PUT_DELTA}`]: (t) =>
      putCycle({ close: series.close, vol: putVol, t })?.pnl ?? null,
    "call half-sold": (t) => blended(t)?.half ?? null,
  };
}

function rowsFor(series, entries, episodes, measure) {
  const out = [];
  entries.forEach((t, k) => {
    const value = measure(t);
    if (value != null) out.push({ date: series.dates[t], value, episode: episodes[k] });
  });
  return out;
}

function line(label, rows, { digits = 0, episodes = true } = {}) {
  const s = summarize(
    rows.map((r) => r.value),
    new Set(rows.map((r) => r.episode)).size,
  );
  if (!s.n) return `  ${label.padEnd(34)} n=0`;
  return (
    `  ${label.padEnd(34)} n=${String(s.n).padStart(3)} eps=${episodes ? String(s.episodes).padStart(2) : " -"}` +
    ` mean ${pct(s.mean, digits).padStart(6)} median ${pct(s.median, digits).padStart(6)}` +
    ` won ${pct(s.win).slice(1).padStart(4)} worst-decile ${pct(s.p10, digits).padStart(6)}` +
    ` worst ${pct(s.min, digits).padStart(6)}`
  );
}

const CONDITION = `CONDITION (${DRAWDOWN * 100}%+ under high, VIX ${VIX_FLOOR}+)`;
const CONTROL = "control: condition not holding";
const GROUPS = {
  [CONDITION]: ["both"],
  [CONTROL]: ["drawdown", "vix", "neither"],
  "  diag: drawdown only": ["drawdown"],
  "  diag: VIX only": ["vix"],
  "  diag: neither": ["neither"],
};

/** One move, every group side by side, then the condition against the control. */
function printMove({ name, series, all }, move, measure) {
  console.log(`\n-- ${move}`);
  const rowsOf = {};
  const digits = move.startsWith("put") ? 2 : 0;
  for (const label of Object.keys(GROUPS)) {
    const { entries, episodes } = all[label];
    rowsOf[label] = rowsFor(series, entries, episodes, measure);
    console.log(line(label, rowsOf[label], { digits, episodes: label === CONDITION }));
  }
  const cond = rowsOf[CONDITION];
  const base = rowsOf[CONTROL];
  if (!(cond.length && base.length)) return;
  const gap = gapInterval(cond, base);
  const controlMean = base.reduce((s, r) => s + r.value, 0) / base.length;
  const verdict = moveVerdict(cond, controlMean);
  console.log(
    `  vs control: mean gap ${pct(gap.gap, digits)} (90% ${pct(gap.lo, digits)}..${pct(gap.hi, digits)}, ${gap.years} yrs)` +
      ` | verdict ${verdict.outcome}: ${verdict.clusters} episodes of ${verdict.needed} needed` +
      (verdict.t == null ? "" : `, t ${verdict.t.toFixed(2)}`),
  );
  table[name] ??= {};
  table[name][move] = {
    condition: summarize(
      cond.map((r) => r.value),
      new Set(cond.map((r) => r.episode)).size,
    ),
    control: summarize(base.map((r) => r.value)),
    gap,
    verdict,
  };
}

/** The long call re-priced under other vol reads and exits, condition entries only. */
function printCallSensitivity({ series, all }) {
  const { entries, episodes } = all[CONDITION];
  console.log("\n-- long call, how far the answer leans on the vol read (condition entries)");
  const row = (label, volAt, pick) => {
    const rows = [];
    for (const [k, t] of entries.entries()) {
      const legs = callLegs({ close: series.close, volAt, t });
      if (legs) rows.push({ date: series.dates[t], value: legs[pick], episode: episodes[k] });
    }
    console.log(line(label, rows, { episodes: false }));
  };
  row("blend, half sold (the row)", blendedVol(series), "half");
  row("blend, sold at 2x else held", blendedVol(series), "sold");
  row("blend, held to 6mo left", blendedVol(series), "ran");
  row("blend x0.8, half sold", blendedVol(series, 0.8), "half");
  row("blend x1.25, half sold", blendedVol(series, 1.25), "half");
  row("flat VIX, half sold", flatVol(series), "half");
  const hits = entries
    .map((t) => callLegs({ close: series.close, volAt: blendedVol(series), t }))
    .filter(Boolean);
  console.log(
    `  double reached on ${share(hits.filter((h) => h.hit).length / (hits.length || 1))} of ${hits.length} matured entries`,
  );
}

/** How often the put was assigned, and what it paid, condition against control. */
function printAssignment({ series, all }) {
  console.log("\n-- put: assigned share");
  const vol = series.vix.map((v) => v / 100);
  for (const label of [CONDITION, CONTROL]) {
    const cycles = all[label].entries
      .map((t) => putCycle({ close: series.close, vol, t }))
      .filter(Boolean);
    const n = cycles.length || 1;
    const premium = cycles.reduce((s, c) => s + c.premium, 0) / n;
    console.log(
      `  ${label.split(" (")[0].padEnd(34)} assigned ${share(cycles.filter((c) => c.assigned).length / n)}` +
        ` mean premium ${(premium * 100).toFixed(2)}% of cash secured, n=${cycles.length}`,
    );
  }
}

/** Each condition episode on one line: what the three moves did there. */
function printEpisodes({ series, all, measures }) {
  console.log("\n-- episodes (condition entries): start, entries, 63d shares, put, call half-sold");
  const { entries, episodes } = all[CONDITION];
  const byEpisode = new Map();
  for (const [k, t] of entries.entries()) {
    byEpisode.set(episodes[k], [...(byEpisode.get(episodes[k]) ?? []), t]);
  }
  for (const [id, ts] of byEpisode) {
    const first = ts[0];
    const avg = (m) => {
      const vals = ts.map((t) => measures[m](t)).filter((v) => v != null);
      return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
    };
    console.log(
      `  #${String(id + 1).padStart(2)} ${series.dates[first]} x${String(ts.length).padStart(2)}` +
        ` ${pct(-underHigh(series.close, first))} from high, VIX ${series.vix[first].toFixed(0)}` +
        ` | shares 63d ${pct(avg("shares 63d")).padStart(5)}` +
        ` put ${pct(avg(`put ${PUT_SESSIONS}d @${PUT_DELTA}`), 2).padStart(6)}` +
        ` call ${pct(avg("call half-sold")).padStart(6)}`,
    );
  }
}

function study(name, indexBars) {
  const series = alignSeries(indexBars, vix);
  const counts = { both: 0, drawdown: 0, vix: 0, neither: 0 };
  for (let t = 0; t < series.close.length; t++) {
    const s = stateAt(series, t);
    if (s) counts[s]++;
  }
  console.log(
    `\n=== ${name}: ${series.dates[0]}..${series.dates.at(-1)}, ${series.close.length} sessions`,
  );
  console.log(
    `sessions by state: both ${counts.both}, drawdown only ${counts.drawdown}, VIX only ${counts.vix}, neither ${counts.neither}`,
  );

  const all = {};
  for (const [label, states] of Object.entries(GROUPS)) {
    const entries = pickEntries(series, states);
    all[label] = { entries, episodes: episodesOf(entries) };
  }
  const measures = moves(series);
  const ctx = { name, series, all, measures };
  for (const [move, measure] of Object.entries(measures)) printMove(ctx, move, measure);
  printCallSensitivity(ctx);
  printAssignment(ctx);
  printEpisodes(ctx);

  const last = series.close.length - 1;
  console.log(
    `\nTODAY ${series.dates[last]}: close ${series.close[last].toFixed(2)},` +
      ` ${pct(-underHigh(series.close, last), 1)} from high, VIX ${series.vix[last].toFixed(2)} -> ${stateAt(series, last)}`,
  );
}

console.log(
  `Settings: step ${STEP} sessions, episode gap ${EPISODE_GAP}, put ${PUT_SESSIONS} sessions at ${PUT_DELTA} delta,` +
    ` call ${CALL_YEARS}y ${CALL_DELTA} delta (half sold at 2x, rest out at 6mo left)`,
);
study("SPY", await bars("SPY"));
study("QQQ", await bars("QQQ"));
if (jsonPath) writeFileSync(jsonPath, `${JSON.stringify(table, null, 2)}\n`);
