/**
 * IPO discovery — finds US IPOs on EDGAR and files each one's listing and lockup expiry as market
 * events (#5912). The calendar is the IPO playbook's input: the study reads its past entries, the
 * playbook its future ones.
 *
 *   node scripts/research/lockup-discovery.mjs                    # print what it would file
 *   node scripts/research/lockup-discovery.mjs --write            # write and retire event JSON files
 *   npm run research:lockups -- --since 2026-04-01 --min-usd 250000000
 *   node scripts/research/lockup-discovery.mjs --today 2026-06-04 --until 2026-06-04   # a replay
 *
 * Two passes over EDGAR full-text search, blank-check companies (SIC 6770, SPACs) dropped from both:
 *
 * 1. BEFORE PRICING (slice 3) — every public registration statement (S-1, F-1 and amendments) in
 *    the last 120 days, the latest per company, from companies with no 424B4 yet. Each is read by
 *    `listing-math.mjs` and files an `estimate` pair: an `ipo-listing` dated by the measured base
 *    rates, and its `lockup-expiry` from the S-1's own lock-up clause. A company already carrying a
 *    live estimate is left alone (one estimate per listing, not one per amendment), and a deal whose
 *    expected pricing has passed with no 424B4 has stalled, so it files nothing.
 * 2. AT PRICING (slice 1) — every final prospectus (424B4) in the window, read by `lockup-math.mjs`
 *    for IPO vs follow-on, the prospectus date and the lock-up. It files the dated `lockup-expiry`
 *    while that is still ahead, and the dated `ipo-listing` when the listing priced inside the
 *    close-out window or an estimate is waiting for it. Then every estimate pass 1 wrote for that
 *    company is marked `supersededBy` its dated twin — unless the estimate's id still has an
 *    unscored forward test, which its research lane must score first (event-scan --validate), or
 *    the ticker changed between filings, which a person settles.
 *
 * A deal that stalls and comes back files a fresh pair, which retires the stale one the same way.
 * One that never comes back leaves a lockup estimate for shares that may never list: 30 days past
 * its expected pricing with no 424B4, that file is removed while nothing references it.
 *
 * Ownership: an id already in `src/domain/market-events/` is never overwritten, with one exception
 * this file wrote itself — an estimate whose `source` still opens with `EST: S-1 …`. A research lane
 * that re-sources an entry takes it over, and from then on discovery leaves it alone.
 *
 * Defaults: the 424B4 window starts 200 days back, so it catches every 180-day lockup still to end;
 * the floor ($500M raised) keeps the calendar to listings an options market reliably trades — and
 * every entry buys its own research issue and pulse cadence, so the floor is also the lane's load:
 * on 2026-10-20 it was 12 live expiries at $500M against 41 at $100M. `--watch` names listings known
 * to be large from reporting (Anthropic, `docs/research/anthropic-ipo.md`) whose first S-1 may leave
 * the size blank: they are filed without a size, at `high` impact. EDGAR asks for a contactable
 * User-Agent and at most 10 requests a second; this stays near 5.
 */

import { existsSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { unscoredForwardTests } from "../forward-test-pending.mjs";
import {
  expectedPricing,
  listingEstimates,
  listingEvent,
  orphanedLockups,
  readRegistration,
  registeredUsd,
  registrationEstimateCik,
  supersessions,
} from "./listing-math.mjs";
import { addDays, htmlToText, lockupEvent, parseProspectus } from "./lockup-math.mjs";

const UA = "skynet-capital research (ejclark83@gmail.com)";
const EVENTS_DIR = join(process.cwd(), "src", "domain", "market-events");
const FORWARD_TESTS_DIR = join(process.cwd(), "docs", "research", "forward-tests");
const LEDGER_DIR = join(process.cwd(), "docs", "research", "events");
const SPAC_SIC = "6770";
// A listing that priced this recently still gets its close-out session (assessment-cadence.json
// `closeOutWithinDays`), which is where the listing phase's day-1 read gets written down.
const RECENT_LISTING_DAYS = 6;
// How far past its expected pricing a listing estimate may sit with no 424B4 before its lockup
// estimate counts as an orphan (listing-math.mjs, `orphanedLockups`).
const STALL_DAYS = 30;

// `--today` replays a past day — what the pass would have filed then (pair it with `--until`).
const { values: clock } = parseArgs({ options: { today: { type: "string" } }, strict: false });
const today = clock.today ?? new Date().toISOString().slice(0, 10);
const { values } = parseArgs({
  options: {
    today: { type: "string" },
    since: { type: "string", default: addDays(today, -200) },
    "s1-since": { type: "string", default: addDays(today, -120) },
    until: { type: "string", default: today },
    "min-usd": { type: "string", default: "500000000" },
    watch: { type: "string", default: "Anthropic" },
    write: { type: "boolean", default: false },
  },
});
const minUsd = Number(values["min-usd"]);
const watched = values.watch
  .split(",")
  .map((w) => w.trim().toLowerCase())
  .filter(Boolean);

const pause = () => new Promise((r) => setTimeout(r, 200));

/** EDGAR's full-text search answers a burst of paging with the odd 500; a retry clears it. */
async function get(url, as, tries = 3) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (res.status >= 500 && tries > 1) {
    await new Promise((r) => setTimeout(r, 2000));
    return get(url, as, tries - 1);
  }
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return as === "json" ? res.json() : res.text();
}

/** Every hit for `forms` in the window, paged 100 at a time. */
async function searchHits(forms, since) {
  const hits = [];
  for (let from = 0; ; from += 100) {
    const page = await get(
      `https://efts.sec.gov/LATEST/search-index?forms=${forms}&dateRange=custom&startdt=${since}&enddt=${values.until}&from=${from}`,
      "json",
    );
    hits.push(...page.hits.hits);
    if (hits.length >= page.hits.total.value || page.hits.hits.length === 0) return hits;
    await pause();
  }
}

/** "Iambic Therapeutics, Inc.  (IAM)  (CIK 0001997038)" → { company, symbol }; symbol is absent
 *  before a listing ("Aspen Neuroscience, Inc.  (CIK 0002124080)"). */
function nameAndTicker(displayName) {
  const m = /^(.*?)\s+(?:\(([A-Z.]+)(?:,[^)]*)?\)\s+)?\(CIK/.exec(displayName);
  return m
    ? { company: m[1].replace(/,?\s+(Inc|Corp|Ltd|LLC|plc)\.?$/i, ""), symbol: m[2] }
    : undefined;
}

/** One candidate per company — its latest filing — operating companies only. `firstFiledOn` is
 *  the earliest filing of that company in the window (for a registration, its first public S-1). */
function candidates(hits) {
  const byCik = new Map();
  for (const h of hits) {
    const s = h._source;
    if (s.sics.includes(SPAC_SIC)) continue;
    const who = nameAndTicker(s.display_names[0] ?? "");
    if (!who) continue;
    const cik = String(Number(s.ciks[0]));
    const prior = byCik.get(cik);
    const firstFiledOn =
      prior && prior.firstFiledOn < s.file_date ? prior.firstFiledOn : s.file_date;
    if (prior && prior.fileDate >= s.file_date) {
      prior.firstFiledOn = firstFiledOn;
      continue;
    }
    const [adsh, file] = h._id.split(":");
    const folder = `https://www.sec.gov/Archives/edgar/data/${cik}/${adsh.replace(/-/g, "")}`;
    byCik.set(cik, {
      ...who,
      cik,
      form: s.form,
      fileDate: s.file_date,
      firstFiledOn,
      folder,
      url: `${folder}/${file}`,
    });
  }
  return [...byCik.values()];
}

/** Every canonical event on disk (proposals are another lane's). */
const existing = readdirSync(EVENTS_DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(join(EVENTS_DIR, f), "utf8")));
const estimateCiks = new Set(existing.map(registrationEstimateCik).filter(Boolean));
const liveEstimate = (cik) =>
  existing.find(
    (e) =>
      e.kind === "ipo-listing" &&
      registrationEstimateCik(e) === cik &&
      !e.supersededBy &&
      e.date >= today,
  );

/** The fee table's registered total, for a first S-1 that leaves its price range blank. */
async function feeTableUsd(folder) {
  const index = await get(`${folder}/index.json`, "json");
  const fees = index.directory.item.find((i) => /fee.*\.xml$/i.test(i.name));
  if (!fees) return undefined;
  await pause();
  return registeredUsd(await get(`${folder}/${fees.name}`, "text"));
}

const rows = [];
const prospectuses = await searchHits("424B4", values.since);
const priced = new Set(prospectuses.map((h) => String(Number(h._source.ciks[0]))));

// Pass 1 — before pricing: a public registration statement files an estimate pair.
for (const c of candidates(await searchHits("S-1,F-1", values["s1-since"]))) {
  if (priced.has(c.cik)) continue;
  const tag = { symbol: c.symbol ?? `cik${c.cik}`, company: c.company };
  const latest = expectedPricing({
    form: c.form,
    filedOn: c.fileDate,
    firstFiledOn: c.firstFiledOn,
  });
  if (latest.date < today) continue; // stalled before this window's reach; not worth a fetch
  const standing = liveEstimate(c.cik);
  if (standing) {
    rows.push({ ...tag, verdict: `estimate stands: ${standing.id}` });
    continue;
  }
  await pause();
  let text;
  try {
    text = htmlToText(await get(c.url, "text"));
  } catch (err) {
    rows.push({ ...tag, verdict: `unread: ${err.message}` });
    continue;
  }
  const parsed = parseProspectus(text);
  const reg = readRegistration(text, parsed);
  if (!reg.isIpo) continue;
  const symbol = reg.symbol ?? c.symbol;
  const watch = watched.some((w) => c.company.toLowerCase().includes(w));
  let size = reg.offeringUsd ? { usd: reg.offeringUsd, from: "range" } : undefined;
  if (!size) {
    await pause();
    const registered = await feeTableUsd(c.folder).catch(() => undefined);
    if (registered) size = { usd: registered, from: "fee-table" };
  }
  if (!((size && size.usd >= minUsd) || (watch && size?.from !== "range"))) {
    if (size || watch)
      rows.push({ ...tag, verdict: `under floor (${size?.usd ?? "size not read"})` });
    continue;
  }
  if (!symbol) {
    rows.push({ ...tag, verdict: `no proposed symbol in its ${c.form} yet` });
    continue;
  }
  const pricing = expectedPricing({
    form: c.form,
    filedOn: c.fileDate,
    firstFiledOn: c.firstFiledOn,
    hasRange: Boolean(reg.range),
  });
  if (pricing.date < today) {
    rows.push({ symbol, verdict: `stalled: expected to price ${pricing.date}, no 424B4` });
    continue;
  }
  const impact = watch && size?.from !== "range" ? "high" : undefined;
  for (const event of listingEstimates({
    ...c,
    symbol,
    fetchedOn: today,
    reg,
    parsed,
    pricing,
    size,
    impact,
  }))
    rows.push({ symbol, event });
}

// Pass 2 — at pricing: the 424B4 dates the pair.
for (const c of candidates(prospectuses)) {
  if (!c.symbol) continue;
  await pause();
  let parsed;
  try {
    parsed = parseProspectus(htmlToText(await get(c.url, "text")));
  } catch (err) {
    rows.push({ ...c, verdict: `unread: ${err.message}` });
    continue;
  }
  if (!parsed.isIpo) continue;
  const owed = estimateCiks.has(c.cik);
  if (!(owed || (parsed.offeringUsd && parsed.offeringUsd >= minUsd))) {
    rows.push({ ...c, verdict: `under floor (${parsed.offeringUsd ?? "size not read"})` });
    continue;
  }
  const input = { ...c, fetchedOn: today, parsed };
  const listing = listingEvent(input);
  if (listing && (owed || listing.date >= addDays(today, -RECENT_LISTING_DAYS)))
    rows.push({ ...c, event: listing, dated: true });
  const event = lockupEvent(input);
  if (!event) rows.push({ ...c, verdict: "no lock-up date read" });
  else if (event.date < today && !owed) rows.push({ ...c, verdict: `already ended ${event.date}` });
  else rows.push({ ...c, event, dated: true });
}

// Biome's JSON style keeps a short array on one line; matching it means a run never leaves a diff
// the formatter would rewrite.
const writeEvent = (event) =>
  writeFileSync(
    join(EVENTS_DIR, `${event.id}.json`),
    `${JSON.stringify(event, null, 2).replace(/\[\n\s+([^\]\n]+)\n\s+\]/g, (_, one) => `[${one}]`)}\n`,
  );

let written = 0;
for (const r of rows) {
  if (!r.event) {
    console.log(`  ·  ${r.symbol.padEnd(6)} ${r.verdict}`);
    continue;
  }
  const prior = existing.find((e) => e.id === r.event.id);
  // The confirming flip: the dated event takes over an estimate this file wrote under the same id.
  const flip = prior && r.dated && registrationEstimateCik(prior) !== undefined;
  const mark = r.event.status === "confirmed" ? "⬢" : "⬡";
  console.log(
    `  ${mark}  ${r.symbol.padEnd(6)} ${r.event.date}  ${r.event.status.padEnd(9)} ${r.event.impact.padEnd(6)} ${r.event.id}${flip ? "  (dates its estimate)" : prior ? "  (exists)" : ""}`,
  );
  if (values.write && (flip || !prior)) {
    writeEvent(r.event);
    written += 1;
  }
}

let retired = 0;
const retiring = new Set();
const newer = rows.filter((r) => r.event).map((r) => r.event);
for (const { id, supersededBy, blocked } of supersessions(existing, newer)) {
  retiring.add(id);
  const open = unscoredForwardTests(id, FORWARD_TESTS_DIR);
  if (blocked || open.length) {
    const why = blocked ?? `${open.length} unscored forward test(s) — score them first`;
    console.log(`  ⚠  ${id} not retired: ${why}`);
    continue;
  }
  console.log(`  ↳  ${id} superseded by ${supersededBy}`);
  if (values.write) {
    writeEvent({ ...existing.find((e) => e.id === id), supersededBy });
    retired += 1;
  }
}

// A stalled deal's lockup estimate is removed while nothing references it yet: it sits months out,
// past the research horizon, so normally no ledger or forward test has been written against it.
let removed = 0;
for (const e of orphanedLockups(existing, { today, priced, stallDays: STALL_DAYS })) {
  if (retiring.has(e.id)) continue;
  const ledger = join(LEDGER_DIR, `${e.id}.md`);
  const fragment = join(FORWARD_TESTS_DIR, `${e.id}.md`);
  if (existsSync(ledger) || existsSync(fragment)) {
    console.log(`  ⚠  ${e.id}: its listing stalled, but research cites it — retire it by hand`);
    continue;
  }
  console.log(`  ✕  ${e.id}: its listing stalled ${STALL_DAYS}+ days with no 424B4 — removed`);
  if (values.write) {
    unlinkSync(join(EVENTS_DIR, `${e.id}.json`));
    removed += 1;
  }
}

console.log(
  values.write
    ? `lockup-discovery: wrote ${written}, retired ${retired}, removed ${removed} event file(s) in src/domain/market-events/`
    : "lockup-discovery: dry run — pass --write to file the new ones",
);
