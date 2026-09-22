#!/usr/bin/env node
/**
 * FOMC-proximity study — does a quarterly witching sitting N sessions from a Fed decision carry a
 * bigger volume signature than one that doesn't?
 *
 *   node scripts/research/fomc-expiration-proximity.mjs
 *   node scripts/research/fomc-expiration-proximity.mjs --fresh   # bust both caches
 *
 * WHY THIS EXISTS — it is a TRAP DETECTOR, not a signal finder.
 *
 * `fomc-2027-03-17`'s ledger built a "treat the decision and the expiry as one event window"
 * corridor rule on a +2 meeting (decision two sessions BEFORE the third Friday). `fomc-2027-06-09`
 * withdrew it only as "not this meeting's shape" at +6 — leaving it free to reinstate itself the
 * moment another +2 meeting appeared. `fomc-2027-09-15`'s lane refused to reinstate it on decision-
 * day RETURNS (permutation P = 0.163, reversing inside September itself).
 *
 * That left the volume side open, and the naive volume test says YES, loudly: quarterly witchings
 * at gap +2 mean 2.147 relvol against 1.862 for every other quarterly, permutation P = 0.002. A
 * session that ran only that test would reinstate the corridor rule on a three-decimal p-value.
 *
 * IT IS AN ERA ARTIFACT, and this script exists so the control runs automatically next to the
 * claim. The +2 shape is a MODERN FOMC scheduling arrangement — 92% of the +2 cohort is dated
 * 2013 or later against 20% of the rest — while witching volume has grown structurally over the
 * same span (quarterly median 1.63 in 1995-2014, 2.18 in 2015+). Control for era and the effect
 * dies: era-ranked P = 0.326, and inside the modern era alone the sign REVERSES (-0.08, P = 0.53).
 *
 * So the three numbers it always prints together, in this order:
 *   1. RAW — the tempting result, printed first precisely so nobody rediscovers it alone.
 *   2. ERA-RANKED — each witching's percentile inside quarterly witchings within +/-11 years,
 *      the same control `expiration-displacement.mjs` applies to displaced sessions.
 *   3. MODERN-ERA-ONLY — the raw comparison inside 2013+, where the cohorts are era-matched by
 *      construction and no ranking is needed.
 * A claim that survives all three is a claim; a claim that only survives (1) is a calendar.
 *
 * GAP SIGN, defined once: sessions from the nearest FOMC decision day to the expiration session.
 * POSITIVE means the decision came FIRST (+2 = this event's shape); negative means it follows.
 *
 * SAMPLE STARTS 1994 on purpose. The FOMC did not announce a policy decision on the meeting day
 * until February 1994, so "the decision is two sessions before the witching" is not a statement
 * about the market's information set before then.
 *
 * DATA: the Federal Reserve Board's own FOMC calendars (fomccalendars.htm for 2021+, one
 * fomchistorical<year>.htm per year 1990-2020) and the daily-bar basket from
 * expiration-displacement.mjs, whose relative-volume definition this script reuses rather than
 * restates. Volume only; no intraday, no open interest, no GEX.
 * Educational, paper-standard — this measures a calendar mechanic, it does not propose a trade.
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { BASKET, bars, build, expirations } from "./expiration-displacement.mjs";

const CACHE = join(process.cwd(), "node_modules", ".cache", "fomc-expiration-proximity");
const UA = "skynet-capital research (ejclark83@gmail.com)";
const MONTHS = {
  January: 1,
  February: 2,
  March: 3,
  April: 4,
  May: 5,
  June: 6,
  July: 7,
  August: 8,
  September: 9,
  October: 10,
  November: 11,
  December: 12,
};

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};

async function page(url, name) {
  mkdirSync(CACHE, { recursive: true });
  const path = join(CACHE, `${name}.html`);
  if (existsSync(path)) return readFileSync(path, "utf8");
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${url} -> ${res.status} ${res.statusText}`);
  const html = await res.text();
  writeFileSync(path, html);
  return html;
}

/** "September 16-17" / "January 31-February 1" / "March 21" -> the meeting's FINAL day, ISO. */
function endDate(year, text) {
  const t = text
    .replace(/[*†]/g, "")
    .replace(/\(.*?\)/g, "")
    .trim();
  const cross = /^([A-Z][a-z]+)\s+\d{1,2}\s*[-–]\s*([A-Z][a-z]+)\s+(\d{1,2})$/.exec(t);
  const range = /^([A-Z][a-z]+)\s+\d{1,2}\s*[-–]\s*(\d{1,2})$/.exec(t);
  const single = /^([A-Z][a-z]+)\s+(\d{1,2})$/.exec(t);
  const month =
    MONTHS[(cross ?? range ?? single)?.[1] && cross ? cross[2] : (range ?? single)?.[1]];
  const day = cross ? +cross[3] : range ? +range[2] : single ? +single[2] : null;
  if (!(month && day)) return null;
  // A December-January meeting is minuted under the earlier year but ends in the next one.
  const y = cross && MONTHS[cross[1]] === 12 && month === 1 ? year + 1 : year;
  return `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Every scheduled FOMC meeting's final day, read off the Board's own calendars. */
async function decisions() {
  const out = new Set();
  for (let year = 1990; year <= 2020; year++) {
    const html = await page(
      `https://www.federalreserve.gov/monetarypolicy/fomchistorical${year}.htm`,
      String(year),
    );
    for (const m of html.matchAll(/<h5[^>]*>([^<]{3,90})<\/h5>/g)) {
      const s = m[1].trim();
      // Conference calls and notation votes are not scheduled decision days.
      if (!/\bMeeting\b/i.test(s)) continue;
      const iso = endDate(year, s.replace(/\s*Meeting.*$/i, ""));
      if (iso) out.add(iso);
    }
  }
  const cur = (
    await page("https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm", "cur")
  ).replace(/\s+/g, " ");
  const heads = [...cur.matchAll(/<h4><a id="\d+">(\d{4}) FOMC Meetings<\/a><\/h4>/g)];
  for (let i = 0; i < heads.length; i++) {
    const seg = cur.slice(heads[i].index, heads[i + 1]?.index ?? cur.length);
    for (const m of seg.matchAll(
      /fomc-meeting__month[^>]*><strong>([^<]+)<\/strong><\/div> <div class="fomc-meeting__date[^>]*>([^<]+)</g,
    )) {
      const months = m[1]
        .trim()
        .split("/")
        .map((x) => x.trim());
      const iso = endDate(+heads[i][1], `${months[0]} ${m[2].trim()}`.replace(/\s+/g, " "));
      // The month cell carries both names on a cross-month meeting ("October/November").
      const spans = months.length > 1 && /[-–]/.test(m[2]);
      out.add(
        spans
          ? endDate(
              +heads[i][1],
              `${months[0]} 1-${months[1]} ${m[2].split(/[-–]/)[1].replace(/\*/g, "").trim()}`,
            )
          : iso,
      );
    }
  }
  return [...out].filter(Boolean).sort();
}

function permutation(a, b, iterations = 200_000) {
  const observed = Math.abs(mean(a) - mean(b));
  const pool = [...a, ...b];
  let hits = 0;
  for (let k = 0; k < iterations; k++) {
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    if (Math.abs(mean(pool.slice(0, a.length)) - mean(pool.slice(a.length))) >= observed) hits++;
  }
  return (hits + 1) / (iterations + 1);
}

function compare(label, rows, pick, key) {
  const a = rows.filter(pick).map((r) => r[key]);
  const b = rows.filter((r) => !pick(r)).map((r) => r[key]);
  if (a.length < 3 || b.length < 3) return;
  console.log(
    `  ${label.padEnd(36)} n=${String(a.length).padStart(3)}/${String(b.length).padEnd(3)} ` +
      `${mean(a).toFixed(3)} vs ${mean(b).toFixed(3)}  ` +
      `diff ${mean(a) - mean(b) >= 0 ? "+" : ""}${(mean(a) - mean(b)).toFixed(3)}  ` +
      `P=${permutation(a, b).toFixed(4)}`,
  );
}

async function main() {
  if (process.argv.includes("--fresh")) rmSync(CACHE, { recursive: true, force: true });

  const series = {};
  for (const sym of BASKET) series[sym] = await bars(sym);
  const m = build(series);
  const fed = (await decisions()).filter((d) => m.isSession(d));

  // One shared session index, so "gap" is trading sessions rather than calendar days.
  const sessions = series[BASKET[0]].map((r) => r.date);
  const at = new Map(sessions.map((d, i) => [d, i]));
  const fedAt = fed.map((d) => at.get(d));

  const rows = expirations(1994, new Date().getUTCFullYear())
    .filter((e) => e.quarterly && m.isSession(e.session))
    .map((e) => {
      const relvol = m.basket(e.session);
      if (relvol == null) return null;
      const i = at.get(e.session);
      let gap = null;
      for (const j of fedAt) if (gap == null || Math.abs(i - j) < Math.abs(gap)) gap = i - j;
      return { ...e, relvol, gap };
    })
    .filter(Boolean);
  for (const r of rows) {
    const peers = rows
      .filter((o) => o !== r && Math.abs(o.year - r.year) <= 11)
      .map((o) => o.relvol);
    r.pct = peers.filter((v) => v < r.relvol).length / peers.length;
  }

  const plus2 = (r) => r.gap === 2;
  const sept = (r) => r.month === 9;
  const modern = rows.filter((r) => r.year >= 2013);
  const cohort = rows.filter(plus2);
  console.log(
    `\nquarterly witchings 1994+ with data: ${rows.length}   scheduled FOMC decisions: ${fed.length}` +
      `   (+2 cohort median year ${median(cohort.map((r) => r.year))}, ` +
      `${Math.round((cohort.filter((r) => r.year >= 2013).length / cohort.length) * 100)}% dated 2013+ ` +
      `against ${Math.round((rows.filter((r) => !plus2(r) && r.year >= 2013).length / rows.filter((r) => !plus2(r)).length) * 100)}% of the rest)`,
  );

  console.log("\n=== 1. RAW relative volume — the tempting result, read it last ===");
  compare("gap +2 vs every other quarterly", rows, plus2, "relvol");
  compare("decision same week (|gap|<=4)", rows, (r) => Math.abs(r.gap) <= 4, "relvol");
  compare("September vs the other quarters", rows, sept, "relvol");

  console.log("\n=== 2. ERA-RANKED percentile — the control that kills the era confound ===");
  compare("gap +2 vs every other quarterly", rows, plus2, "pct");
  compare("decision same week (|gap|<=4)", rows, (r) => Math.abs(r.gap) <= 4, "pct");
  compare("September vs the other quarters", rows, sept, "pct");

  console.log("\n=== 3. MODERN ERA ONLY (2013+) — cohorts era-matched by construction ===");
  compare("gap +2 vs every other quarterly", modern, plus2, "relvol");
  compare("September vs the other quarters", modern, sept, "relvol");

  console.log("\n=== September AND gap +2 — this calendar's 2024-2027 shape ===");
  for (const r of rows.filter((x) => sept(x) && plus2(x)))
    console.log(
      `  ${r.session}  relvol ${r.relvol.toFixed(2)}  era pctile ${Math.round(r.pct * 100)}`,
    );
  console.log(
    "\n  A difference that appears in (1) and vanishes in (2) and (3) is the calendar moving,",
  );
  console.log("  not the Fed. Report all three or report none.");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
