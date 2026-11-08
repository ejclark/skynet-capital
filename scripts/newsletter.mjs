#!/usr/bin/env node
// The weekly newsletter's numbers (#6872, slice N1): one JSON object for one ISO week.
//
// Eric, 2026-11-04: a weekly recap that "bridges the gap between daily development and road
// map/time horizons", with metrics and trends, milestones, last week's plan checked, and every loop
// that needs a person. The model writes the words (N2, /secretary's weekly mode); this script
// writes the numbers, so one week compares with the next. The daily digest keeps what is urgent.
//
//   npm run newsletter -- --week 2026-W45                  # gather, build, print the JSON
//   npm run newsletter -- --week 2026-W45 --save-inputs f  # also keep what it read, to rebuild later
//   npm run newsletter -- --week 2026-W45 --inputs f       # rebuild from saved inputs: no reads at all
//   npm run newsletter -- --week 2026-W45 --append-series  # also write the week to data/newsletter
//   [--as-of ISO]   read the week as of a moment (default now; a week not yet over reads `partial`)
//
// --week defaults to the last week that has ended: a run at Sunday 18:00 CT is Monday 00:00Z, so
// it reads the week that just closed. Module map: newsletter/week.mjs (calendar), records.mjs
// (#4153 reports, state blocks, plan blocks), metrics.mjs, split.mjs (tokens per role and bucket),
// asks.mjs (human steps due), build.mjs (pure), gather.mjs (reads), series.mjs (the data branch).
import { readFileSync, writeFileSync } from "node:fs";
import { isMain } from "./is-main.mjs";
import { buildNewsletter } from "./newsletter/build.mjs";
import { gather } from "./newsletter/gather.mjs";
import { appendSeries, seriesEntry } from "./newsletter/series.mjs";
import { parseWeek, previousWeek, weekOf } from "./newsletter/week.mjs";

function flag(args, name) {
  const at = args.indexOf(name);
  if (at < 0) return undefined;
  const value = args[at + 1];
  if (value === undefined || value.startsWith("--")) throw new Error(`${name} needs a value`);
  return value;
}

export function main(args, nowMs = Date.now()) {
  const known = new Set(["--week", "--as-of", "--inputs", "--save-inputs", "--append-series"]);
  for (const arg of args.filter((a) => a.startsWith("--")))
    if (!known.has(arg)) throw new Error(`unknown flag ${arg}`);
  const fromFile = flag(args, "--inputs");
  let inputs;
  let restCalls = 0;
  if (fromFile) {
    inputs = JSON.parse(readFileSync(fromFile, "utf8"));
    const week = flag(args, "--week");
    if (week && week !== inputs.week)
      throw new Error(`${fromFile} holds ${inputs.week}, not ${week}`);
  } else {
    const week = flag(args, "--week") ?? previousWeek(weekOf(nowMs));
    parseWeek(week);
    const asOf = flag(args, "--as-of");
    const asOfMs = asOf === undefined ? nowMs : Date.parse(asOf);
    if (!Number.isFinite(asOfMs)) throw new Error(`--as-of needs an ISO time, got "${asOf}"`);
    ({ inputs, restCalls } = gather(week, asOfMs));
  }
  const saveTo = flag(args, "--save-inputs");
  if (saveTo) writeFileSync(saveTo, `${JSON.stringify(inputs, null, 2)}\n`);
  const newsletter = buildNewsletter(inputs);
  if (args.includes("--append-series")) {
    // A week stored with a hole would overwrite a whole reading of it; the series takes whole weeks.
    const holes = Object.entries(newsletter.metrics).filter(([, v]) => typeof v === "string");
    if (holes.length)
      throw new Error(`not appended: ${holes.map(([k]) => k).join(", ")} could not be read`);
    console.error(appendSeries(seriesEntry(newsletter)));
  }
  if (restCalls) console.error(`newsletter: ${restCalls} REST calls`);
  return JSON.stringify(newsletter, null, 2);
}

if (isMain(import.meta.url)) {
  try {
    console.log(main(process.argv.slice(2)));
  } catch (err) {
    console.error(`newsletter: ${err.message}`);
    process.exit(1);
  }
}
