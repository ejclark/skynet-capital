/**
 * IPO lockup discovery — finds recent US IPOs on EDGAR and proposes each one's lockup expiry as a
 * `lockup-expiry` market event (#5912 slice 1). The calendar is the lockup-expiry playbook's input:
 * the study reads its past entries, the playbook its future ones.
 *
 *   node scripts/research/lockup-discovery.mjs                    # print what it would file
 *   node scripts/research/lockup-discovery.mjs --write            # write new event JSON files
 *   npm run research:lockups -- --since 2026-04-01 --min-usd 250000000
 *
 * How: EDGAR full-text search lists every final prospectus (form 424B4) filed in the window; blank-
 * check companies (SIC 6770, SPACs) and filings with no ticker are dropped, one filing per company is
 * kept (the latest), and each prospectus is read by `lockup-math.mjs`, which decides IPO vs
 * follow-on, the prospectus date, the lock-up period and whether the date can be `confirmed`.
 * Only expiries still ahead of today are proposed; an id already in `src/domain/market-events/`
 * is never overwritten (an event's own research lane owns its file once it exists).
 *
 * The default window starts 200 days back, so it catches every 180-day lockup still to end; the
 * default floor ($500M raised) keeps the calendar to listings an options market reliably trades — and
 * every entry buys its own research issue and pulse cadence, so the floor is also the lane's load: on
 * 2026-10-20 it was 12 live expiries at $500M against 41 at $100M. Lower it with --min-usd to study.
 * EDGAR asks for a contactable User-Agent and at most 10 requests a second; this stays near 5.
 */

import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { addDays, htmlToText, lockupEvent, parseProspectus } from "./lockup-math.mjs";

const UA = "skynet-capital research (ejclark83@gmail.com)";
const EVENTS_DIR = join(process.cwd(), "src", "domain", "market-events");
const SPAC_SIC = "6770";

const today = new Date().toISOString().slice(0, 10);
const { values } = parseArgs({
  options: {
    since: { type: "string", default: addDays(today, -200) },
    until: { type: "string", default: today },
    "min-usd": { type: "string", default: "500000000" },
    write: { type: "boolean", default: false },
  },
});
const minUsd = Number(values["min-usd"]);

const pause = () => new Promise((r) => setTimeout(r, 200));

async function get(url, as) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return as === "json" ? res.json() : res.text();
}

/** Every 424B4 hit in the window, paged 100 at a time. */
async function prospectusHits() {
  const hits = [];
  for (let from = 0; ; from += 100) {
    const page = await get(
      `https://efts.sec.gov/LATEST/search-index?forms=424B4&dateRange=custom&startdt=${values.since}&enddt=${values.until}&from=${from}`,
      "json",
    );
    hits.push(...page.hits.hits);
    if (hits.length >= page.hits.total.value || page.hits.hits.length === 0) return hits;
    await pause();
  }
}

/** "Iambic Therapeutics, Inc.  (IAM)  (CIK 0001997038)" → { company, symbol }. */
function nameAndTicker(displayName) {
  const m = /^(.*?)\s+\(([A-Z.]+)(?:,[^)]*)?\)\s+\(CIK/.exec(displayName);
  return m
    ? { company: m[1].replace(/,?\s+(Inc|Corp|Ltd|LLC|plc)\.?$/i, ""), symbol: m[2] }
    : undefined;
}

/** One candidate per company: its latest final prospectus, operating companies with a ticker only. */
function candidates(hits) {
  const byCik = new Map();
  for (const h of hits) {
    const s = h._source;
    if (s.sics.includes(SPAC_SIC)) continue;
    const who = nameAndTicker(s.display_names[0] ?? "");
    if (!who) continue;
    const prior = byCik.get(s.ciks[0]);
    if (prior && prior.fileDate >= s.file_date) continue;
    const [adsh, file] = h._id.split(":");
    const cik = String(Number(s.ciks[0]));
    byCik.set(s.ciks[0], {
      ...who,
      fileDate: s.file_date,
      url: `https://www.sec.gov/Archives/edgar/data/${cik}/${adsh.replace(/-/g, "")}/${file}`,
    });
  }
  return [...byCik.values()];
}

const rows = [];
for (const c of candidates(await prospectusHits())) {
  await pause();
  let parsed;
  try {
    parsed = parseProspectus(htmlToText(await get(c.url, "text")));
  } catch (err) {
    rows.push({ ...c, verdict: `unread: ${err.message}` });
    continue;
  }
  if (!parsed.isIpo) continue;
  if (!(parsed.offeringUsd && parsed.offeringUsd >= minUsd)) {
    rows.push({ ...c, verdict: `under floor (${parsed.offeringUsd ?? "size not read"})` });
    continue;
  }
  const event = lockupEvent({ ...c, fetchedOn: today, parsed });
  if (!event) rows.push({ ...c, verdict: "no lock-up date read" });
  else if (event.date < today) rows.push({ ...c, verdict: `already ended ${event.date}` });
  else rows.push({ ...c, event });
}

let written = 0;
for (const r of rows) {
  if (!r.event) {
    console.log(`  ·  ${r.symbol.padEnd(6)} ${r.verdict}`);
    continue;
  }
  const path = join(EVENTS_DIR, `${r.event.id}.json`);
  const exists = existsSync(path);
  const mark = r.event.status === "confirmed" ? "⬢" : "⬡";
  console.log(
    `  ${mark}  ${r.symbol.padEnd(6)} ${r.event.date}  ${r.event.status.padEnd(9)} ${r.event.impact.padEnd(6)} ${r.event.id}${exists ? "  (exists)" : ""}`,
  );
  if (values.write && !exists) {
    // Biome's JSON style keeps a short array on one line; matching it means a run never leaves a diff
    // the formatter would rewrite.
    const json = JSON.stringify(r.event, null, 2).replace(
      /\[\n\s+([^\]\n]+)\n\s+\]/g,
      (_, one) => `[${one}]`,
    );
    writeFileSync(path, `${json}\n`);
    written += 1;
  }
}
console.log(
  values.write
    ? `lockup-discovery: wrote ${written} new event file(s) to src/domain/market-events/`
    : "lockup-discovery: dry run — pass --write to file the new ones",
);
