#!/usr/bin/env node
/**
 * OCC whole-market option-volume puller (#4808 slice 3 part 2, the input to candidate 1's run).
 *
 *   node scripts/research/occ-volume-pull.mjs [YYYY-MM-DD from]
 *
 * For every trading session since `from` (default: the start of the OCC's rolling 2-year window),
 * fetches ONE `symbolType=ALL` file (every underlying, about 4,400 rows of 4.5 MB) and caches the
 * per-underlying call/put totals as `node_modules/.cache/occ-volume/<date>.json`. A cached date is
 * never refetched; a refused or empty date writes NOTHING (never a zero — the back-test reads a
 * missing day as missing, not as no volume). Sessions come from QQQ's own bars, so holidays are not
 * asked for.
 *
 * POLITE: one request at a time, at least 1 s apart (the OCC's terms page could not be read —
 * Cloudflare blocks it — so the client assumes the strictest). Read-only public data, no key.
 * This is a cache for one run, NOT the durable archive: that is #4832, which keeps the days the
 * rolling window is about to drop. Data, not code — never committed (#4420).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { bars } from "./market-data.mjs";
import { parseVolume } from "./occ-volume-math.mjs";

export const OCC_CACHE = join(process.cwd(), "node_modules", ".cache", "occ-volume");
const GAP_MS = 1000;

/** Cached `{UNDERLYING: [call, put]}` for a date, or undefined when it was never stored. */
export function cachedVolume(date) {
  const path = join(OCC_CACHE, `${date}.json`);
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : undefined;
}

async function pull(date) {
  const url =
    `https://marketdata.theocc.com/volume-query?reportDate=${date.replaceAll("-", "")}` +
    "&format=csv&volumeQueryType=O&symbolType=ALL&symbol=" +
    "&reportType=D&accountType=ALL&productKind=ALL&porc=BOTH";
  const res = await fetch(url);
  if (!res.ok) return { error: `${res.status} ${res.statusText}` };
  const volume = parseVolume(await res.text());
  if (volume.size === 0) return { error: "no rows" };
  const out = {};
  for (const [underlying, v] of volume) out[underlying] = [v.call, v.put];
  return { out };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const from = process.argv[2] ?? "2024-10-01";
  mkdirSync(OCC_CACHE, { recursive: true });
  const sessions = (await bars("QQQ")).map((b) => b.date).filter((d) => d >= from);
  // The OCC publishes T+1, so today's session is never there yet.
  const today = new Date().toISOString().slice(0, 10);
  let stored = 0;
  let refused = 0;
  for (const date of sessions.filter((d) => d < today)) {
    if (cachedVolume(date)) continue;
    const started = Date.now();
    let result;
    try {
      result = await pull(date);
    } catch (e) {
      result = { error: String(e) };
    }
    if (result.out) {
      writeFileSync(join(OCC_CACHE, `${date}.json`), JSON.stringify(result.out));
      stored += 1;
    } else {
      refused += 1;
      console.error(`${date}: not stored (${result.error})`);
    }
    await new Promise((r) => setTimeout(r, Math.max(0, GAP_MS - (Date.now() - started))));
  }
  console.log(`stored ${stored} new dates, ${refused} refused, of ${sessions.length} sessions`);
}
