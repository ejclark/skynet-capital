/**
 * IPO lockup-expiry event study (#5912 slice 2) — how listings moved against their sector around
 * the day insiders' shares unlocked, and whether either trade shape the plan names pays.
 *
 *   node scripts/research/lockup-study.mjs                 # print the tables the study doc quotes
 *   node scripts/research/lockup-study.mjs --write-events  # also refresh the committed event list
 *
 * The sample is built the way the calendar is (slice 1, `lockup-discovery.mjs`), pointed backwards:
 * EDGAR full-text search for final prospectuses (424B4) saying there has been "no public market"
 * for the stock, one per company (its EARLIEST, the IPO), SPACs and ticker-less filings dropped,
 * each prospectus read by `lockup-math.mjs` for its date, lock-up period, price and size. A listing
 * stays only if its Yahoo history starts at its IPO (otherwise the ticker now belongs to something
 * else) and runs at least 23 sessions past the unlock. The arithmetic is `lockup-study-math.mjs`.
 *
 * Everything fetched is cached under node_modules/.cache (prospectuses as their parsed fields, not
 * the multi-megabyte HTML), so a re-run with new questions costs nothing. EDGAR: contactable
 * User-Agent, under 10 requests a second.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { addDays, htmlToText, lockupEvent, parseProspectus } from "./lockup-math.mjs";
import {
  benchReturns,
  car,
  dayZero,
  putSpreadReturn,
  rawReturn,
  realizedVol,
  sectorEtf,
  sharesOutstandingAfter,
  summarize,
  terciles,
  unlockMultiple,
  volumeRatio,
} from "./lockup-study-math.mjs";
import { bars } from "./market-data.mjs";

const UA = "skynet-capital research (ejclark83@gmail.com)";
const CACHE = join(process.cwd(), "node_modules", ".cache", "lockup-study");
const EVENTS_OUT = join(process.cwd(), "docs", "research", "ipo-lockup-expiry-events.json");
const SPAC_SIC = "6770";
const MIN_USD = 100_000_000;

const { values } = parseArgs({
  options: {
    since: { type: "string", default: "2019-01-01" },
    until: { type: "string", default: "2026-06-30" },
    "write-events": { type: "boolean", default: false },
  },
});

mkdirSync(CACHE, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, as) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.ok) return as === "json" ? res.json() : res.text();
    if (attempt < 3 && (res.status === 429 || res.status >= 500)) {
      await sleep(2000 * (attempt + 1));
      continue;
    }
    throw new Error(`${url} → ${res.status}`);
  }
}

async function cachedJson(name, make) {
  const path = join(CACHE, name);
  if (existsSync(path)) return JSON.parse(readFileSync(path, "utf8"));
  const value = await make();
  writeFileSync(path, JSON.stringify(value));
  return value;
}

/** Every IPO-prospectus hit in one calendar year, paged 100 at a time. */
function yearHits(year) {
  const start = year === Number(values.since.slice(0, 4)) ? values.since : `${year}-01-01`;
  const end = year === Number(values.until.slice(0, 4)) ? values.until : `${year}-12-31`;
  return cachedJson(`efts-${start}-${end}.json`, async () => {
    const hits = [];
    for (let from = 0; ; from += 100) {
      const page = await get(
        `https://efts.sec.gov/LATEST/search-index?q=%22no%20public%20market%22&forms=424B4&dateRange=custom&startdt=${start}&enddt=${end}&from=${from}`,
        "json",
      );
      hits.push(...page.hits.hits.map((h) => ({ id: h._id, ...h._source })));
      if (hits.length >= page.hits.total.value || page.hits.hits.length === 0) return hits;
      await sleep(200);
    }
  });
}

/** "Iambic Therapeutics, Inc.  (IAM)  (CIK 0001997038)" → { company, symbol }. */
function nameAndTicker(displayName) {
  const m = /^(.*?)\s+\(([A-Z.]+)(?:,[^)]*)?\)\s+\(CIK/.exec(displayName);
  return m ? { company: m[1], symbol: m[2].replace(".", "-") } : undefined;
}

/** One candidate per company — its earliest "no public market" prospectus — and a funnel count. */
function candidates(hits, funnel) {
  const byCik = new Map();
  for (const h of hits) {
    if (h.sics.includes(SPAC_SIC)) {
      funnel.spac += 1;
      continue;
    }
    const who = nameAndTicker(h.display_names[0] ?? "");
    if (!who) {
      funnel.noTicker += 1;
      continue;
    }
    const prior = byCik.get(h.ciks[0]);
    if (prior && prior.fileDate <= h.file_date) continue;
    const [adsh, file] = h.id.split(":");
    const cik = String(Number(h.ciks[0]));
    byCik.set(h.ciks[0], {
      ...who,
      adsh,
      sic: h.sics[0],
      fileDate: h.file_date,
      url: `https://www.sec.gov/Archives/edgar/data/${cik}/${adsh.replace(/-/g, "")}/${file}`,
    });
  }
  return [...byCik.values()].sort((a, b) => (a.fileDate < b.fileDate ? -1 : 1));
}

/** The prospectus's fields, read once and cached (the HTML itself is never kept). */
function readProspectus(c) {
  return cachedJson(`p2-${c.adsh}.json`, async () => {
    const text = htmlToText(await get(c.url, "text"));
    return { parsed: parseProspectus(text), sharesOut: sharesOutstandingAfter(text) };
  });
}

/** Run `work` over items with `width` workers, each pausing `gapMs` between its own calls. */
async function pool(items, width, gapMs, work) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: width }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await work(items[i]).catch((err) => ({ error: err.message }));
        await sleep(gapMs);
      }
    }),
  );
  return out;
}

const yearOf = (iso) => Number(iso.slice(0, 4));
const funnel = { hits: 0, spac: 0, noTicker: 0 };
const allHits = [];
for (let y = yearOf(values.since); y <= yearOf(values.until); y++)
  allHits.push(...(await yearHits(y)));
funnel.hits = allHits.length;
const cands = candidates(allHits, funnel);
funnel.companies = cands.length;
console.error(`lockup-study: ${allHits.length} hits → ${cands.length} companies; reading…`);

const read = await pool(cands, 4, 450, readProspectus);
const benchCache = new Map();
async function benchBars(sym) {
  if (!benchCache.has(sym)) benchCache.set(sym, await bars(sym));
  return benchCache.get(sym);
}

const drop = {};
const dropped = (why) => {
  drop[why] = (drop[why] ?? 0) + 1;
};
const events = [];
for (const [i, c] of cands.entries()) {
  const r = read[i];
  if (r.error) {
    dropped("prospectus unreadable");
    continue;
  }
  const { parsed, sharesOut } = r;
  if (!parsed.isIpo) {
    dropped("not an IPO (follow-on or resale)");
    continue;
  }
  if (!(parsed.offeringUsd >= MIN_USD)) {
    dropped("under $100M or size not read");
    continue;
  }
  const ev = lockupEvent({ ...c, fetchedOn: "study", parsed });
  if (!ev) {
    dropped("no prospectus date or lock-up period read");
    continue;
  }
  let px;
  try {
    // One retry: a throttled fetch must not be counted as a delisting.
    px = await bars(c.symbol).catch(() => sleep(3000).then(() => bars(c.symbol)));
  } catch {
    dropped("no Yahoo history (delisted, acquired or renamed)");
    continue;
  }
  const first = px[0]?.date;
  if (
    !first ||
    first < addDays(parsed.prospectus.date, -1) ||
    first > addDays(parsed.prospectus.date, 10)
  ) {
    dropped("Yahoo history does not start at the IPO");
    continue;
  }
  const z = dayZero(px, ev.date);
  if (z < 72 || z + 23 >= px.length) {
    dropped(z < 72 ? "too few sessions before the unlock" : "unlock too recent for D+23");
    continue;
  }
  const etf = sectorEtf(c.sic);
  const bench = benchReturns(px, await benchBars(etf));
  const iwm = benchReturns(px, await benchBars("IWM"));
  const rv = realizedVol(px, z, -70, -11);
  const runUp = (px[z - 11].close / px[0].close) * (px[0].rawClose / parsed.priceUsd) - 1;
  const flush = rawReturn(px, z, -10, 3);
  const w = (a, b) => car(px, bench, z, a, b);
  events.push({
    symbol: c.symbol,
    company: c.company,
    sic: c.sic,
    etf,
    prospectus: parsed.prospectus.date,
    lockupDate: ev.date,
    lockupDays: parsed.lockupDays,
    status: ev.status,
    offeringUsd: parsed.offeringUsd,
    unlockX: unlockMultiple(sharesOut, parsed.sharesOffered),
    runUp,
    rv,
    car: {
      pre: w(-10, -1),
      lit: w(-1, 1),
      d0to3: w(0, 3),
      putHold: w(-10, 3),
      full: w(-10, 10),
      after10: w(4, 13),
      after20: w(4, 23),
    },
    iwmLit: car(px, iwm, z, -1, 1),
    iwmFull: car(px, iwm, z, -10, 10),
    path: Array.from({ length: 21 }, (_, k) => w(-10, k - 10)),
    flush,
    volX: volumeRatio(px, z, [0, 2], [-40, -11]),
    put: putSpreadReturn({ entry: px[z - 11].close, exit: px[z + 3].close, sigma: rv }),
    putIv125: putSpreadReturn({ entry: px[z - 11].close, exit: px[z + 3].close, sigma: rv * 1.25 }),
    // The run-in variant: the same spread expiring at the close of day −1, before any unlocked
    // share can trade. Added after the first read showed the drift lands before day 0 — a
    // post-hoc shape, so the doc grades it as one.
    putPre: putSpreadReturn({
      entry: px[z - 11].close,
      exit: px[z - 1].close,
      sigma: rv,
      sessions: 10,
    }),
    putPre125: putSpreadReturn({
      entry: px[z - 11].close,
      exit: px[z - 1].close,
      sigma: rv * 1.25,
      sessions: 10,
    }),
  });
}
funnel.events = events.length;

// ── report ────────────────────────────────────────────────────────────────────────────────────
const pct = (x, d = 1) => (Number.isFinite(x) ? `${(x * 100).toFixed(d)}%` : "—");
const row = (label, xs) => {
  const s = summarize(xs);
  return s.n
    ? `| ${label} | ${s.n} | ${pct(s.mean, 2)} | ${pct(s.median, 2)} | ${s.t.toFixed(2)} | ${pct(s.negShare, 0)} |`
    : `| ${label} | 0 | — | — | — | — |`;
};
const head = "| Group | n | Mean | Median | t | Below 0 |\n|---|---|---|---|---|---|";
const table = (title, groups, pick) => {
  console.log(`\n### ${title}\n\n${head}`);
  for (const [label, evs] of groups) console.log(row(label, evs.map(pick)));
};

console.log(`## Funnel\n\n${JSON.stringify({ ...funnel, drop }, null, 2)}`);

const conf = events.filter((e) => e.status === "confirmed");
const est = events.filter((e) => e.status === "estimate");
const [u1, u2] = terciles(events.map((e) => e.unlockX));
const big = events.filter((e) => e.offeringUsd >= 500_000_000);
const base = [
  ["All", events],
  ["Confirmed date", conf],
  ["Estimate (early-release / staged)", est],
  ["$500M+ raised", big],
];
const splits = [
  ...base,
  ["Run-up < 0 (below offer)", events.filter((e) => e.runUp < 0)],
  ["Run-up 0–50%", events.filter((e) => e.runUp >= 0 && e.runUp < 0.5)],
  ["Run-up ≥ 50%", events.filter((e) => e.runUp >= 0.5)],
  [`Unlock < ${u1?.toFixed(1)}× float`, events.filter((e) => e.unlockX < u1)],
  [
    `Unlock ${u1?.toFixed(1)}–${u2?.toFixed(1)}×`,
    events.filter((e) => e.unlockX >= u1 && e.unlockX < u2),
  ],
  [`Unlock ≥ ${u2?.toFixed(1)}×`, events.filter((e) => e.unlockX >= u2)],
  ["Unlock not read", events.filter((e) => !Number.isFinite(e.unlockX))],
  ["Biotech (XBI)", events.filter((e) => e.etf === "XBI")],
  ["Tech (XLK)", events.filter((e) => e.etf === "XLK")],
];
const years = [...new Set(events.map((e) => e.lockupDate.slice(0, 4)))].sort();
const byYear = years.map((y) => [
  `Unlock in ${y}`,
  events.filter((e) => e.lockupDate.startsWith(y)),
]);

table(
  "CAR[−1,+1] vs sector ETF — the literature's three days",
  [...splits, ...byYear],
  (e) => e.car.lit,
);
table("CAR[−10,+10] vs sector ETF — the full window", [...splits, ...byYear], (e) => e.car.full);
table("CAR[−10,−1] — the run-in, before any unlocked share can trade", splits, (e) => e.car.pre);
table("CAR[0,+3] — the first four unlocked sessions", splits, (e) => e.car.d0to3);
table("Robustness: CAR[−1,+1] vs IWM", base, (e) => e.iwmLit);
table("Robustness: CAR[−10,+10] vs IWM", base, (e) => e.iwmFull);
table("Volume, days 0..+2 over days −40..−11 (ratio − 1)", base, (e) => e.volX - 1);

console.log("\n### Mean CAR path, day −10 … +10 (all; confirmed; by era)\n");
console.log(
  "| Day | All | Confirmed | Unlocks 2019–2021 | Unlocks 2022–2026 |\n|---|---|---|---|---|",
);
const before22 = events.filter((e) => e.lockupDate < "2022-01-01");
const since22 = events.filter((e) => e.lockupDate >= "2022-01-01");
for (let k = 0; k < 21; k++) {
  const m = (evs) => pct(summarize(evs.map((e) => e.path[k])).mean, 2);
  console.log(`| ${k - 10} | ${m(events)} | ${m(conf)} | ${m(before22)} | ${m(since22)} |`);
}

table(
  "Shape A — ATM/−10% put debit spread, close D−11 → expiry D+3, priced at trailing RV (return on debit)",
  splits,
  (e) => e.put,
);
table("Shape A at 1.25× RV (closer to a catalyst's implied vol)", splits, (e) => e.putIv125);
table(
  "Run-in variant — the same spread, close D−11 → expiry D−1, at trailing RV",
  splits,
  (e) => e.putPre,
);
table("Run-in variant at 1.25× RV", splits, (e) => e.putPre125);

// Does the one split that carries the effect hold in both halves of the sample? The 2021 listing
// boom is a third of all events and its unlocks fell into the 2022 drawdown.
const large = events.filter((e) => e.unlockX >= u2);
const early = (e) => e.lockupDate < "2022-01-01";
const eras = [
  ["Large unlock, unlocks 2019–2021", large.filter(early)],
  ["Large unlock, unlocks 2022–2026", large.filter((e) => !early(e))],
  ["Large unlock, confirmed date", large.filter((e) => e.status === "confirmed")],
  ["Large unlock and run-up ≥ 50%", large.filter((e) => e.runUp >= 0.5)],
  ["Everything else, 2019–2021", events.filter((e) => !(e.unlockX >= u2) && early(e))],
  ["Everything else, 2022–2026", events.filter((e) => !(e.unlockX >= u2 || early(e)))],
];
table("Stability — CAR[−10,−1] by era", eras, (e) => e.car.pre);
table("Stability — CAR[−10,+10] by era", eras, (e) => e.car.full);
table("Stability — run-in put spread at 1.25× RV by era", eras, (e) => e.putPre125);
table("Stability — D+3 put spread at 1.25× RV by era", eras, (e) => e.putIv125);

// The era halves and the one cut the playbook logs ($500M+ raised and run-up ≥ 50%: every live
// calendar entry clears $500M), so the study's call sheet re-runs from this command alone.
const hot = (e) => e.offeringUsd >= 500_000_000 && e.runUp >= 0.5;
const halves = [
  ["All, unlocks 2019–2021", before22],
  ["All, unlocks 2022–2026", since22],
  ["$500M+ and run-up ≥ 50%", events.filter(hot)],
  ["$500M+ and run-up ≥ 50%, 2022–2026", since22.filter(hot)],
];
table("Era halves — CAR[−10,+3], the put trade's holding period", halves, (e) => e.car.putHold);
table("Era halves — CAR[−10,+10]", halves, (e) => e.car.full);
table("Era halves — D+3 put spread at trailing RV", halves, (e) => e.put);
const flushed = events.filter((e) => e.flush <= -0.1);
const flushedConf = conf.filter((e) => e.flush <= -0.1);
const shapeB = [
  ["All, enter close D+3", events],
  ["Double-digit flush (raw D−11→D+3 ≤ −10%)", flushed],
  ["Flush, confirmed date", flushedConf],
  ["No flush", events.filter((e) => e.flush > -0.1)],
];
table("Shape B — buy after the flush: CAR[+4,+13] (two weeks)", shapeB, (e) => e.car.after10);
table("Shape B — CAR[+4,+23] (four weeks)", shapeB, (e) => e.car.after20);

console.log(
  `\n_Terciles fixed before reading: unlock ${u1?.toFixed(2)}× / ${u2?.toFixed(2)}×. Median run-up ${pct(summarize(events.map((e) => e.runUp)).median)}; median trailing RV ${pct(summarize(events.map((e) => e.rv)).median, 0)}._`,
);

if (values["write-events"]) {
  const r4 = (x) => (Number.isFinite(x) ? Math.round(x * 10000) / 10000 : null);
  const compact = events.map((e) => ({
    symbol: e.symbol,
    etf: e.etf,
    prospectus: e.prospectus,
    lockupDate: e.lockupDate,
    lockupDays: e.lockupDays,
    status: e.status,
    offeringUsdM: Math.round(e.offeringUsd / 1e6),
    unlockX: r4(e.unlockX),
    runUp: r4(e.runUp),
    carLit: r4(e.car.lit),
    carFull: r4(e.car.full),
    carPutHold: r4(e.car.putHold),
    carAfter20: r4(e.car.after20),
    flush: r4(e.flush),
    put: r4(e.put),
    putPre: r4(e.putPre),
  }));
  // Two-space JSON is the shape biome formats to, so a re-run leaves no diff the lint would flag.
  writeFileSync(EVENTS_OUT, `${JSON.stringify(compact, null, 2)}\n`);
  console.error(`lockup-study: wrote ${compact.length} events to ${EVENTS_OUT}`);
}
