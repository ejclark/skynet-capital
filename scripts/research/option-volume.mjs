#!/usr/bin/env node
/**
 * Option-volume instrument (#4808 slice 3, candidate 1's signal).
 *
 *   node scripts/research/option-volume.mjs <SYM> [YYYY-MM-DD]
 *
 * One underlying's all-exchange option volume (calls, puts) for a date from the OCC's free volume
 * query; the date defaults to the last weekday before today. Deterministic, zero tokens, no key.
 * The OCC window rolls (about 2 years), so an old date is refused with the OCC's own message.
 */
import { parseVolume } from "./occ-volume-math.mjs";

const symbol = process.argv[2]?.toUpperCase();
if (!symbol) {
  console.error("usage: node scripts/research/option-volume.mjs <SYM> [YYYY-MM-DD]");
  process.exit(2);
}

function lastWeekday() {
  const d = new Date();
  do d.setUTCDate(d.getUTCDate() - 1);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6);
  return d.toISOString().slice(0, 10);
}

const date = process.argv[3] ?? lastWeekday();
const url =
  `https://marketdata.theocc.com/volume-query?reportDate=${date.replaceAll("-", "")}` +
  `&format=csv&volumeQueryType=O&symbolType=U&symbol=${symbol}` +
  "&reportType=D&accountType=ALL&productKind=ALL&porc=BOTH";
const res = await fetch(url);
if (!res.ok) throw new Error(`${url} -> ${res.status} ${res.statusText}`);
const volume = parseVolume(await res.text()).get(symbol);
if (!volume) {
  console.error(
    `${symbol} ${date}: the OCC returned no option volume (holiday, or outside its window)`,
  );
  process.exit(1);
}
console.log(
  `${symbol} ${date} — option volume: ${volume.call} calls, ${volume.put} puts, ${volume.total} total`,
);
