#!/usr/bin/env node
/**
 * Drop-exit study (#6950, the first encounter of #6948): after a close down ≥ 7%, which exit rule
 * set at that close would have paid, and how often? Replays the 11-05 AI-stock drop and the 11-06
 * bounce against every exit rule's base rate on NVDA, SMH and CRWV.
 *
 *   node scripts/research/drop-exit-study.mjs --as-of=2026-11-06
 *   node scripts/research/drop-exit-study.mjs --as-of=2026-11-06 --all   # full grid at 5% and 10% too
 *
 * Bars come from `bars()` (Yahoo daily, split-adjusted, cached under node_modules/.cache). Bust the
 * cache first for a fresh read: `rm -rf node_modules/.cache/earnings-cycle node_modules/.cache/intraday-edges`.
 * `--as-of` cuts every series at that date, so a later re-run reads the same sample.
 *
 * The five research steps (docs/process/EVENT-RESEARCH.md → Candidate playbooks), each declared
 * here before any conditional outcome was read:
 *   1. fixed threshold — 7% (5% and 10% reported beside it, never chosen between after the fact)
 *   2. power — three primary rules, each with a declared effect; the cluster count needed comes
 *      from that effect and the rule's UNCONDITIONAL spread, so a thin sample reads `underpowered`
 *   3. control — every session (unconditional) and the month-matched down days
 *   4. confound filter — drops on the symbol's own print are excluded and listed apart
 *   5. date clustering — drops within 10 sessions are one episode; the verdict also needs the
 *      2020+ era to agree in sign
 *
 * Offline research tooling: no broker credential, touches no trading path, places nothing.
 */

import { backtestVerdict, clusterByDate } from "./backtest-verdict-math.mjs";
import {
  dropDays,
  episodes,
  exitGrid,
  exitTrade,
  independentWindows,
  isPrintReaction,
  matchedDownDays,
  ruleLabel,
  sd,
  summarize,
} from "./drop-exit-math.mjs";
import { sessions } from "./intraday-bars.mjs";
import { bars, earningsDates } from "./market-data.mjs";

const SYMBOLS = ["NVDA", "SMH", "CRWV"];
const MAIN = 0.07;
const SIDE = [0.05, 0.1];
const FEAR = 25;
const LATEST_ERA = "2020-01-01";
const SLEEVE = ["CEG", "NRG", "TLN", "VST"];
const SLEEVE_BETA = 1.03; // the midterm ledger's own beta vs the S&P 500
const SLEEVE_P90 = 4.39; // its 52-session p90 of the sleeve's excess, percentage points

/** Declared before any conditional outcome was read: the rules the call sheet judges. */
const PRIMARY = [
  { key: "R1", name: "next-morning take-profit", tp: 0.05, stop: null, hold: 1 },
  { key: "R2", name: "hold a quarter", tp: null, stop: null, hold: 63 },
  { key: "R3", name: "hold six months", tp: null, stop: null, hold: 126 },
];
/** The edge each primary rule must show over its month-matched control to matter, in points. */
const EFFECT = { 1: 1, 5: 2, 63: 5, 126: 8 };
const Z_BAR = 1.645;
const Z_POWER = 0.8416;

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);
const AS_OF = args["as-of"] ?? new Date().toISOString().slice(0, 10);
const ENCOUNTER = args.encounter ?? "2026-11-05";
const ALL = Boolean(args.all);

const pct = (x, d = 0) => (Number.isFinite(x) ? `${(x * 100).toFixed(d)}%` : "—");
const pts = (x, d = 1) => (Number.isFinite(x) ? `${x >= 0 ? "+" : ""}${x.toFixed(d)}%` : "—");

async function series(symbol) {
  return (await bars(symbol)).filter((b) => b.date <= AS_OF);
}

async function prints(symbol) {
  try {
    return await earningsDates(symbol);
  } catch {
    return []; // an ETF has no print of its own
  }
}

/** Every trade for one rule over a list of entry indices, unresolved trades dropped. */
const tradesFor = (px, idxs, rule) =>
  idxs.map((t) => ({ t, trade: exitTrade(px, t, rule) })).filter((x) => x.trade);

function study(symbol, px, printDates, vixOn, threshold, rules) {
  const drops = dropDays(px, threshold);
  const dropSet = new Set(drops);
  const eps = episodes(drops);
  const printFrom = printDates[0];
  const onPrint = eps.filter((e) => isPrintReaction(px, e.first, printDates));
  // The encounter is scored apart, never folded into its own base rate.
  const before = (t) => px[t].date < ENCOUNTER;
  const clean = eps
    .filter((e) => !onPrint.includes(e))
    .map((e) => e.first)
    .filter(before);
  const all = Array.from({ length: px.length - 1 }, (_, i) => i + 1).filter(before);

  console.log(
    `\n## ${symbol} · close down ≥ ${pct(threshold)} · ${px[0].date} → ${px.at(-1).date}` +
      `\n   drops ${drops.length} · episodes ${eps.length} · on its own print ${onPrint.length}` +
      (onPrint.length ? ` (${onPrint.map((e) => px[e.first].date).join(", ")})` : "") +
      ` · traded before ${ENCOUNTER} ${clean.length}` +
      (printFrom ? ` · print filter covers ${printFrom}+` : " · no print of its own (ETF)") +
      ` · VIX ≥ ${FEAR} at entry ${clean.filter((t) => vixOn(px[t].date) >= FEAR).length}`,
  );
  console.log(
    "   rule                    | eps  TP/stop/time  | paid  median   worst10 | matched paid median | any day paid median worst10  TP",
  );
  for (const rule of rules) {
    const tr = tradesFor(px, clean, rule);
    const s = summarize(tr.map((x) => x.trade));
    const matched = summarize(
      tr.flatMap(({ t }) =>
        tradesFor(px, matchedDownDays(px, t, dropSet), rule).map((x) => x.trade),
      ),
    );
    const any = summarize(tradesFor(px, all, rule).map((x) => x.trade));
    console.log(
      `   ${ruleLabel(rule).padEnd(23)} | ${String(s.n).padStart(3)}  ${pct(s.tp).padStart(4)}/${pct(s.stop).padStart(4)}/${pct(s.time).padStart(4)} ` +
        `| ${pct(s.hit).padStart(4)} ${pts(s.median).padStart(7)} ${pts(s.p10).padStart(8)} ` +
        `| ${pct(matched.hit).padStart(4)} ${pts(matched.median).padStart(7)}      ` +
        `| ${pct(any.hit).padStart(4)} ${pts(any.median).padStart(7)} ${pts(any.p10).padStart(8)} ${pct(any.tp).padStart(4)}`,
    );
  }
  return { drops, dropSet, eps, clean, all };
}

/** The pre-registered verdict for one primary rule, against the month-matched control. */
function verdict(px, ctx, rule, vixOn) {
  const tr = tradesFor(px, ctx.clean, rule);
  // Episodes whose holds overlap share one recovery, so they are one cluster, keyed by the first.
  const chainOf = new Map();
  for (const chain of episodes(
    tr.map((x) => x.t),
    rule.hold,
  ))
    for (const t of chain.members) chainOf.set(t, px[chain.first].date);
  const events = [];
  for (const { t, trade } of tr) {
    const m = tradesFor(px, matchedDownDays(px, t, ctx.dropSet), rule).map((x) => x.trade.ret);
    if (m.length === 0) continue;
    events.push({
      date: chainOf.get(t),
      value: trade.ret - m.reduce((a, b) => a + b, 0) / m.length,
    });
  }
  const clusters = clusterByDate(events);
  const excess = clusters.length
    ? clusters.reduce((a, c) => a + c.value, 0) / clusters.length
    : NaN;
  const anyRets = tradesFor(px, ctx.all, rule).map((x) => x.trade.ret);
  const power = { sdPct: sd(anyRets), effectPct: EFFECT[rule.hold], zBar: Z_BAR, zPower: Z_POWER };
  const whole = clusters.reduce((a, c) => a + c.value, 0);
  const recent = clusters.filter((c) => c.date >= LATEST_ERA);
  const recentSum = recent.reduce((a, c) => a + c.value, 0);
  const sameSign = recent.length > 0 && Math.sign(recentSum) === Math.sign(whole);
  const v = backtestVerdict(clusters, power, sameSign);
  const fear = summarize(tr.filter(({ t }) => vixOn(px[t].date) >= FEAR).map((x) => x.trade));
  const indep = independentWindows(
    tr.map((x) => x.t),
    rule.hold,
  );
  console.log(
    `   ${rule.key} ${rule.name} (${ruleLabel(rule)}): ${v.outcome.toUpperCase()} · ` +
      `${v.clusters} clusters of ${v.needed} needed (declared edge ${EFFECT[rule.hold]} pts, any-day sd ${power.sdPct.toFixed(1)})` +
      ` · excess over matched ${pts(excess, 2)}` +
      (v.t != null ? ` t ${v.t.toFixed(2)}` : " (descriptive, not a verdict)") +
      ` · ${LATEST_ERA.slice(0, 4)}+ ${recent.length} episodes, same sign ${sameSign}` +
      ` · trades ${tr.length}, non-overlapping ${indep}` +
      ` · VIX ≥ ${FEAR}: paid ${pct(fear.hit)} median ${pts(fear.median)} (n ${fear.n})`,
  );
}

/** What the 11-05 entry has done so far under each take-profit, and the 11-06 bar itself. */
async function encounter(symbol, px, vixOn) {
  const t = px.findIndex((b) => b.date === ENCOUNTER);
  if (t < 1) return console.log(`   ${symbol}: no ${ENCOUNTER} bar in the sample`);
  const e = px[t];
  const n = px[t + 1];
  const drop = e.close / px[t - 1].close - 1;
  let first30 = "—";
  if (n) {
    try {
      const day = (await sessions(symbol, "5m", "5d")).find((s) => s.date === n.date);
      const early = day?.bars.filter((b) => b.minutes < 600) ?? [];
      if (early.length) {
        const hi = Math.max(...early.map((b) => b.high));
        first30 = `${hi.toFixed(2)} (${pts((hi / e.close - 1) * 100)})`;
      }
    } catch {
      first30 = "unavailable";
    }
  }
  console.log(
    `   ${symbol} ${e.date}: close ${e.close.toFixed(2)} (${pts(drop * 100)}), VIX ${vixOn(e.date)?.toFixed(2)}` +
      (n
        ? ` · ${n.date}: open ${n.open.toFixed(2)} (${pts((n.open / e.close - 1) * 100)}), first-30-min high ${first30}, ` +
          `high ${n.high.toFixed(2)} (${pts((n.high / e.close - 1) * 100)}), close ${n.close.toFixed(2)} (${pts((n.close / e.close - 1) * 100)}), VIX ${vixOn(n.date)?.toFixed(2)}`
        : ""),
  );
  for (const tp of [0.03, 0.05, 0.07]) {
    const r = exitTrade(px, t, { tp, stop: 0.08, hold: 126 });
    console.log(
      `     +${Math.round(tp * 100)}% take-profit, −8% stop: ` +
        (r ? `${r.exit} on ${px[r.at].date} at ${pts(r.ret)}` : "neither level hit yet"),
    );
  }
}

/** The midterm ledger's own test: the AI-energy sleeve's excess over the S&P 500 vs its p90. */
async function sleeveTest() {
  const spx = await series("^GSPC");
  const legs = await Promise.all(SLEEVE.map(series));
  const ret = (s, date) => {
    const i = s.findIndex((b) => b.date === date);
    return i > 0 ? (s[i].close / s[i - 1].close - 1) * 100 : NaN;
  };
  const dates = spx.filter((b) => b.date >= ENCOUNTER).map((b) => b.date);
  for (const date of dates) {
    const ew = legs.map((s) => ret(s, date)).reduce((a, b) => a + b, 0) / legs.length;
    const ex = ew - SLEEVE_BETA * ret(spx, date);
    console.log(
      `   ${date}: sleeve ${SLEEVE.join("/")} EW ${pts(ew, 2)}, S&P ${pts(ret(spx, date), 2)}, ` +
        `excess ${ex >= 0 ? "+" : ""}${ex.toFixed(2)} pts vs the ${SLEEVE_P90}-pt p90 → ${Math.abs(ex) > SLEEVE_P90 ? "CROSSED" : "inside"}`,
    );
  }
}

async function main() {
  const vix = await series("^VIX");
  const vixMap = new Map(vix.map((b) => [b.date, b.close]));
  const vixOn = (date) => vixMap.get(date);
  console.log(
    `# Drop-exit study · as of ${AS_OF} · entry = the close of the drop day · paper only\n` +
      "# paid = return > 0 · worst10 = 10th percentile · matched = every down day in the same month\n" +
      "# a session touching both levels counts as the stop; a gap through a level fills at the open",
  );
  const grid = exitGrid();
  const primaryRules = PRIMARY.map(({ tp, stop, hold }) => ({ tp, stop, hold }));
  for (const symbol of SYMBOLS) {
    const px = await series(symbol);
    const printDates = await prints(symbol);
    const ctx = study(symbol, px, printDates, vixOn, MAIN, grid);
    console.log(`\n   Verdicts at ≥ ${pct(MAIN)} (primary rules, declared before the run):`);
    for (const rule of PRIMARY) verdict(px, ctx, rule, vixOn);
    for (const th of SIDE) {
      const side = study(symbol, px, printDates, vixOn, th, ALL ? grid : primaryRules);
      for (const rule of PRIMARY) verdict(px, side, rule, vixOn);
    }
  }
  console.log(`\n# The encounter: ${ENCOUNTER} entry, scored so far`);
  for (const symbol of SYMBOLS) await encounter(symbol, await series(symbol), vixOn);
  console.log("\n# The election link: the midterm ledger's sleeve test on each session since");
  await sleeveTest();
}

await main();
