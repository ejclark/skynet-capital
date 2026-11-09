// Fetch the sector closes an edition's whole-market overview needs, and write them into the edition
// (#7077 slice 1b). The overview draws all 11 GICS sectors and the S&P 500, one fund each, over
// Day · Week · Month · YTD; `src/domain/edition-sectors.ts` names the funds, fixes each period's
// starting date from the calendar, and works the moves out of these closes on every request.
//
// The edition is fed by hand until #6949 slice 5 writes it; this is the hand's one step for the
// sectors, so a writer can call the same function later. Yahoo daily closes, split-adjusted, with
// dividends not added back: a move is a price change, which is what the page says.
//
// Usage: npm run edition:sectors -- <YYYY-MM-DD>   (an edition file must already exist for that date)
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { SECTOR_FUNDS, sectorBases } from "../src/domain/edition-sectors.ts";
import { reexecWithProxy } from "./proxy-reexec.mjs";

// Node's fetch ignores HTTPS_PROXY; behind an agent proxy every request would fail (proxy-reexec.mjs).
reexecWithProxy();

const date = process.argv[2] ?? "";
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  process.stderr.write("usage: npm run edition:sectors -- <YYYY-MM-DD>\n");
  process.exit(2);
}
const file = join(process.cwd(), "src", "domain", "editions", `${date}.json`);
const bases = sectorBases(date);
const needed = [...new Set([date, ...Object.values(bases)])].sort();

/** The New York trading day a Yahoo bar's timestamp falls on. */
const nyDay = (seconds) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(seconds * 1000);

async function closes(fund) {
  const from = Math.floor(Date.parse(`${needed[0]}T00:00:00Z`) / 1000) - 86_400;
  const to = Math.floor(Date.parse(`${date}T23:59:59Z`) / 1000) + 86_400;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${fund}?period1=${from}&period2=${to}&interval=1d`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (skynet-capital edition)" },
  });
  if (!res.ok) throw new Error(`${fund}: ${url} -> ${res.status}`);
  const r = (await res.json()).chart?.result?.[0];
  if (!(r && Array.isArray(r.timestamp) && r.indicators?.quote?.[0]?.close))
    throw new Error(`${fund}: no chart data`);
  const byDay = new Map(r.timestamp.map((t, i) => [nyDay(t), r.indicators.quote[0].close[i]]));
  const out = {};
  for (const d of needed) {
    const c = byDay.get(d);
    if (typeof c !== "number") throw new Error(`${fund}: no close on ${d}`);
    out[d] = Math.round(c * 100) / 100;
  }
  return out;
}

const edition = JSON.parse(readFileSync(file, "utf8"));
const byFund = Object.fromEntries(
  await Promise.all(SECTOR_FUNDS.map(async (f) => [f.fund, await closes(f.fund)])),
);
const fetched = new Date().toISOString().slice(0, 10);
edition.sectors = {
  source: `Yahoo daily closes (split-adjusted, dividends not added back), fetched ${fetched}`,
  closes: byFund,
};
writeFileSync(file, `${JSON.stringify(edition, null, 2)}\n`);
process.stdout.write(
  `${file}: ${SECTOR_FUNDS.length} funds, closes on ${needed.join(", ")}. Run biome format on it.\n`,
);
