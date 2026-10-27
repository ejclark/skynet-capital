#!/usr/bin/env node
import { readdirSync } from "node:fs";
import { meanT } from "./backtest-verdict-math.mjs";
/**
 * Candidate 1's one pre-registered back-test (#4808 slice 3 part 2): does heavy option volume, on a
 * day a stock closes at the edge of its 20-day range, predict the next 5 sessions better than the
 * band touch alone? The rules — signal, control, earnings filter, the four cells, the decision —
 * are fixed in `optvol-bollinger-math.mjs` and the five steps in `src/playbooks/candidates.ts`;
 * this file only feeds them data and prints the verdict.
 *
 *   node scripts/research/occ-volume-pull.mjs        # first: caches the OCC whole-market files
 *   node scripts/research/optvol-bollinger-backtest.mjs [universe size, default 500]
 *
 * UNIVERSE (fixed before the run): the underlyings with the most option volume over the cached
 * window, kept only if they have daily bars AND SEC earnings dates — which is also what drops ETFs
 * and indices, whose volume says nothing about a company's print. Deterministic and zero tokens;
 * the verdict is the one `candidates.ts` records. Read-only public data, no key.
 */
import { bars, earningsDates } from "./market-data.mjs";
import { cachedVolume, OCC_CACHE } from "./occ-volume-pull.mjs";
import {
  CELLS,
  candidateEvents,
  cellClusters,
  decide,
  everyNth,
  judgeCell,
  POWER,
} from "./optvol-bollinger-math.mjs";

const UNIVERSE = Number(process.argv[2] ?? 500);
const dates = readdirSync(OCC_CACHE)
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.slice(0, -5))
  .sort();
if (dates.length < 60) {
  console.error(`only ${dates.length} OCC dates cached — run occ-volume-pull.mjs first`);
  process.exit(2);
}
const byDate = new Map(dates.map((d) => [d, cachedVolume(d)]));

// Rank every underlying by its total option volume over the window.
const total = new Map();
for (const day of byDate.values())
  for (const [sym, [call, put]] of Object.entries(day))
    total.set(sym, (total.get(sym) ?? 0) + call + put);
const ranked = [...total].sort((a, b) => b[1] - a[1]).map(([sym]) => sym);

/** `earningsDates` narrates every same-period re-issue it collapses; across 500 stocks that is noise. */
async function quietly(task) {
  const narrate = console.error;
  console.error = () => undefined;
  try {
    return await task();
  } finally {
    console.error = narrate;
  }
}
const qqq = await bars("QQQ");
const events = [];
const kept = [];
let tried = 0;
for (const sym of ranked) {
  if (kept.length >= UNIVERSE || tried >= UNIVERSE * 2) break;
  tried += 1;
  let series;
  let reports;
  try {
    series = await bars(sym);
    reports = await quietly(() => earningsDates(sym));
  } catch {
    continue; // no bars or no SEC filings: an ETF, an index, or a symbol Yahoo spells differently
  }
  if (reports.length === 0 || series.length < 60) continue;
  const totals = series.map((b) => {
    const row = byDate.get(b.date)?.[sym];
    return row ? row[0] + row[1] : undefined;
  });
  kept.push(sym);
  events.push(...candidateEvents(series, qqq, totals, reports));
}

const signals = events.filter((e) => e.kind === "signal");
const controls = events.filter((e) => e.kind === "control");
const judged = CELLS.map((cell) => {
  const clusters = cellClusters(events, cell);
  const t = clusters.length >= 2 ? meanT(clusters.map((c) => c.value)) : { mean: 0, t: 0 };
  const verdict = judgeCell(clusters, POWER);
  // Overlap check (the known limit): the same cell on dates 5 sessions apart, worst of the 5 offsets.
  const spaced = [0, 1, 2, 3, 4]
    .map((k) => everyNth(clusters, 5, k))
    .filter((c) => c.length >= 2)
    .map((c) => meanT(c.map((x) => x.value)).t);
  // Why the dates are noisy: how many signal events sit behind a typical date.
  const perDate = clusters.map((c) => c.signal).sort((a, b) => a - b);
  const medianSignals = perDate[Math.floor(perDate.length / 2)] ?? 0;
  return {
    cell,
    verdict,
    mean: t.mean,
    t: t.t,
    spacedT: spaced.length ? Math.min(...spaced) : 0,
    medianSignals,
  };
});
const decision = decide(judged);

const f = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "n/a");
console.log(
  `universe ${kept.length} stocks (of ${tried} tried) · OCC dates ${dates[0]} → ${dates.at(-1)} (${dates.length}) · ` +
    `${signals.length} signal events, ${controls.length} control events`,
);
for (const j of judged)
  console.log(
    `${j.cell.side.padEnd(5)} ${j.cell.direction.padEnd(12)} clusters ${String(j.verdict.clusters).padStart(3)} ` +
      `(need ${j.verdict.needed} at sd ${f(j.verdict.sdPct)}%) mean ${f(j.mean)}% t ${f(j.t)} ` +
      `spaced-dates t ${f(j.spacedT)}, median ${j.medianSignals} signal event(s) per date → ${j.verdict.outcome}`,
  );
console.log(
  `VERDICT: ${decision.outcome} — ${decision.clusters} independent days of ${decision.needed} needed` +
    (decision.cell ? ` (${decision.cell.side} ${decision.cell.direction})` : ""),
);
