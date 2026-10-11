// WHAT A ROUND COST (#5099) — read back from the requests every sealed call already records
// (sealed.mjs → makeCaller writes `usage` beside each answer), never estimated. The first full
// round's ~829 calls were priced by guess because no call kept its tokens; the readout's method
// scorecard made "tokens known" a target.
//
// A replayed call carries the usage of the run that paid for it, so a resumed round's total is
// what the whole out dir cost, once. A stubbed call costs nothing and says so; a call that failed
// may have spent tokens the CLI never reported, so it is counted apart rather than guessed at.
// `duration_ms` is the calls' own time added up: calls made at once overlap, so it is call time,
// never a step's wall time (that is the step's start and done lines in log.jsonl).

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const TOKENS = [
  "input_tokens",
  "output_tokens",
  "cache_creation_input_tokens",
  "cache_read_input_tokens",
];

/** The sum over recorded calls: counts by kind, tokens, dollars, time, calls per model. */
export function sumUsage(records) {
  const total = {
    calls: 0,
    priced: 0,
    replayed: 0,
    stubbed: 0,
    failed: 0,
    unpriced: 0,
    ...Object.fromEntries(TOKENS.map((k) => [k, 0])),
    cost_usd: 0,
    duration_ms: 0,
    models: {},
  };
  for (const r of records) {
    total.calls++;
    if (r.replayed) total.replayed++;
    if (r.error) {
      total.failed++;
      continue;
    }
    if (r.stub) {
      total.stubbed++;
      continue;
    }
    if (!r.usage) {
      total.unpriced++;
      continue;
    }
    total.priced++;
    for (const k of TOKENS) total[k] += r.usage[k] ?? 0;
    total.cost_usd += r.usage.cost_usd ?? 0;
    total.duration_ms += r.usage.duration_ms ?? 0;
    for (const m of r.usage.models ?? []) total.models[m] = (total.models[m] ?? 0) + 1;
  }
  total.cost_usd = Math.round(total.cost_usd * 1e4) / 1e4;
  return total;
}

/** Every recorded call under `dir`: each `requests/` folder at any depth (a session keeps its own). */
export function readRequests(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (!statSync(path).isDirectory()) continue;
    if (name === "requests") {
      for (const f of readdirSync(path).filter((x) => x.endsWith(".json"))) {
        out.push(JSON.parse(readFileSync(join(path, f), "utf8")));
      }
    } else {
      out.push(...readRequests(path));
    }
  }
  return out;
}

/** One step's cost: the sum over every `requests/` folder in `<out>/<step>`. */
export const stepUsage = (out, step) => sumUsage(readRequests(join(out, step)));

/** The round's cost: each step's, and their total. */
export function roundUsage(out, steps) {
  const records = Object.fromEntries(steps.map((s) => [s, readRequests(join(out, s))]));
  return {
    steps: Object.fromEntries(steps.map((s) => [s, sumUsage(records[s])])),
    total: sumUsage(Object.values(records).flat()),
  };
}
