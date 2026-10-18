#!/usr/bin/env node
import { summarize, touchEvents } from "./bollinger-touch-math.mjs";
/**
 * Bollinger-touch instrument (#4808 slice 3, candidate 1's price-only control).
 *
 *   node scripts/research/bollinger-touch.mjs <SYM>
 *
 * What a close at the edge of its 20-day range is followed by, over the next 5 sessions, net of
 * QQQ's move over the same dates. Deterministic, zero tokens; daily bars come from
 * `market-data.mjs` (cached). This is the control the option-volume signal has to beat.
 */
import { bars } from "./market-data.mjs";

const HORIZON = 5;

const symbol = process.argv[2]?.toUpperCase();
if (!symbol) {
  console.error("usage: node scripts/research/bollinger-touch.mjs <SYM>");
  process.exit(2);
}

const [series, qqq] = await Promise.all([bars(symbol), bars("QQQ")]);
const events = touchEvents(series, { horizon: HORIZON, benchmark: qqq });
const fmt = (s) => `${s.n} touches, mean ${s.meanPct.toFixed(2)}% net of QQQ`;
console.log(`${symbol} — close at the edge of its 20-day range, next ${HORIZON} sessions`);
console.log(`  at the upper band: ${fmt(summarize(events, "upper"))}`);
console.log(`  at the lower band: ${fmt(summarize(events, "lower"))}`);
console.log(
  `  (price-only control for #4808 candidate 1; one stock's touches overlap and cluster)`,
);
