#!/usr/bin/env node
/**
 * Energy-for-AI re-check (#6952 slice 1): the 08-12 study's names against today's tape, so a
 * member never sees a three-month-old verdict as current. For every name: the move since the study,
 * the move this year, the distance from its 52-week daily-close high, and its move on the basket's
 * worst shared sessions since the study (the crowding census, refreshed per constraint-watch.md).
 *
 *   node scripts/research/energy-recheck.mjs --as-of=2026-11-06
 *
 * Bars come from `bars()` (Yahoo daily, split/dividend-adjusted, cached under node_modules/.cache).
 * Bust the cache first for a fresh read: `rm -rf node_modules/.cache/earnings-cycle`.
 * `--as-of` cuts every series at that date, so a later re-run reads the same sample.
 *
 * Measured only: this prints prices. Whether a thesis still holds is the fundamentals re-check in
 * docs/research/energy-ai-encounters.md, which cites its sources and dates beside each claim.
 * Offline research tooling: no broker credential, touches no trading path, places nothing.
 */

import {
  barOn,
  changePct,
  dailyReturns,
  peakAndDrawdown,
  shockDays,
} from "./energy-recheck-math.mjs";
import { bars } from "./market-data.mjs";

const STUDY = "2026-08-12";
const YEAR_START = "2025-12-31";
/** The reference efficiency shock the 08-12 crowding census was measured on. */
const DEEPSEEK = "2025-01-27";

/** The 08-12 study's own groupings (docs/research/ai-energy-constraint.md), kept verbatim. */
const GROUPS = [
  ["Tier 1 · enterable on 08-12", ["SPXC", "CMI", "BWXT", "ET", "CEG"]],
  [
    "Tier 2 · behind a condition",
    [
      "ITRI",
      "EQT",
      "VST",
      "GNRC",
      "NRG",
      "LEU",
      "AAON",
      "HUBB",
      "SARO",
      "VMI",
      "ENS",
      "KGS",
      "SEI",
      "PEG",
    ],
  ],
  ["Consensus leaders (not proposed)", ["GEV", "VRT", "POWL", "BE", "TLN"]],
  ["Regulated utilities (zero survivors)", ["D", "SO", "DUK"]],
  ["Killed on 08-12", ["MOD", "OKLO", "SMR", "UEC"]],
  ["Benchmarks", ["SPY", "QQQ", "XLE", "XLU"]],
];
const BENCH = new Set(GROUPS.at(-1)[1]);

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);
const AS_OF = args["as-of"] ?? new Date().toISOString().slice(0, 10);

const fmt = (x, d = 1) => (x == null ? "—" : `${x >= 0 ? "+" : ""}${x.toFixed(d)}%`);
const yearAgo = (date) => `${Number(date.slice(0, 4)) - 1}${date.slice(4)}`;

const series = {};
for (const [, syms] of GROUPS) {
  for (const s of syms) series[s] = (await bars(s)).filter((b) => b.date <= AS_OF);
}

const basket = {};
for (const [s, b] of Object.entries(series)) {
  if (!BENCH.has(s)) basket[s] = dailyReturns(b, STUDY, AS_OF);
}
const shocks = shockDays(basket, { n: 3, minNames: 10 });

console.log(`# Energy-for-AI re-check — tape as of ${AS_OF} (study dated ${STUDY})\n`);
console.log(
  `Columns: since the study · this year · below the 52-week daily-close high · on each of the basket's three worst shared sessions since the study · on ${DEEPSEEK} (DeepSeek, the 08-12 census).\n`,
);
const shockCols = shocks.map((d) => d.date.slice(5));
console.log(
  `| Name | Close | Since ${STUDY.slice(5)} | YTD | From 52w high | ${shockCols.join(" | ")} | ${DEEPSEEK} |`,
);
console.log(`|---|---:|---:|---:|---:|${shockCols.map(() => "---:|").join("")}---:|`);
for (const [group, syms] of GROUPS) {
  console.log(`| **${group}** |${" |".repeat(5 + shockCols.length)}`);
  for (const s of syms) {
    const b = series[s];
    const last = barOn(b, AS_OF);
    const pd = peakAndDrawdown(b, yearAgo(AS_OF), AS_OF);
    const rets = dailyReturns(b, STUDY, AS_OF);
    const ds = dailyReturns(b, DEEPSEEK, DEEPSEEK).get(DEEPSEEK);
    const cells = [
      s,
      last ? last.rawClose.toFixed(2) : "—",
      fmt(changePct(b, STUDY, AS_OF)),
      fmt(changePct(b, YEAR_START, AS_OF)),
      pd ? `${fmt(pd.drawdownPct)} (${pd.peakDate})` : "—",
      ...shocks.map((d) => fmt(rets.get(d.date))),
      fmt(ds),
    ];
    console.log(`| ${cells.join(" | ")} |`);
  }
}
console.log(
  `\nBasket median on the shock sessions: ${shocks.map((d) => `${d.date} ${fmt(d.median)}`).join(" · ")}`,
);
