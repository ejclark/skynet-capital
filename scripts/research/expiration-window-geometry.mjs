#!/usr/bin/env node
/**
 * Expiration-window geometry study — is the house's five-session vol ratio biased by WHERE a
 * market closure sits relative to the expiration?
 *
 *   node scripts/research/expiration-window-geometry.mjs
 *   node scripts/research/expiration-window-geometry.mjs --fresh   # bust the bar cache
 *
 * WHY THIS EXISTS — three ledgers have now hand-re-implemented the same study.
 *
 * `opex-2027-05-21` measured "the five sessions after an ordinary monthly expiration are more
 * volatile than the five before" on QQQ 2016-2026 and got 62.5%, with quarterly witchings
 * inverting it at 47.5%. `opex-2027-01-15` re-implemented that from scratch, reproduced it to the
 * digit, and found the MEASURE fragile. `opex-2028-02-18` re-implemented it a third time, took it
 * to 25 years and a second instrument, and found the HEADLINE dies outside its window. Each of
 * those sessions wrote the same ~120 lines from nothing, and each cited "no opex-shaped instrument
 * exists in scripts/research/" as the reason. Three of them also carry the kill switch "a house
 * opex instrument gets built and back-tested." This is that instrument, so the fourth session
 * scores the claim instead of rebuilding the ruler.
 *
 * IT IS A TRAP DETECTOR, in the shape fomc-expiration-proximity.mjs established — the numbers it
 * prints are mostly reasons NOT to cite something.
 *
 * THE MEASURE, defined once. For an expiration session T, the PRE window is the five log returns
 * ending at T (closes T-5 -> T) and the POST window is the five starting at it (T -> T+5). The
 * statistic is sd(post) / sd(pre). Above 1.0 means the tape got noisier after expiration.
 *
 * THE BIAS THE MEASURE HAS, and the thing this script exists to quantify: a close-to-close standard
 * deviation treats every return as ONE unit of time, and they are not. In a clean week both windows
 * open across the same 3-day weekend, so the distortion cancels — that is why the naive measure
 * looked fine for a decade. A market closure inside ONE window only breaks the cancellation, and
 * the geometry is NOT symmetric:
 *
 *   HOLIDAY-AFTER   the Monday AFTER expiration is shut. Post spans 10 calendar days, pre 7.
 *                   The post window gains THREE days. (Feb 2028, Jan 2027.)
 *   HOLIDAY-INSIDE  the Monday OF expiration week is shut, so the week runs four sessions. Pre
 *                   spans 8 calendar days, post 7. The pre window gains ONE day. (Jan 2028.)
 *
 * Those two are commonly described as mirror images. They are not, and assuming they are is the
 * trap: one perturbation is three times the other, on the opposite side. The script prints both
 * next to a clean baseline so the asymmetry is visible rather than argued.
 *
 * THE FOUR ESTIMATORS, printed together because the disagreement IS the finding:
 *   raw     close-to-close sd — the house measure, the one every registered opex forward test uses.
 *   norm    each return divided by sqrt(its calendar days) — over-corrects (variance accrues more
 *           slowly than the clock while the market is shut), but it is the cheapest gap control.
 *   1day    single-calendar-day returns only — discards real information and drops n.
 * None of them is correct. A cell where they AGREE is a cell the house measure can be trusted in;
 * a cell where they disagree on SIGN is a cell no forward test should be registered against
 * without its gap-free twin.
 *
 * DATA: split/dividend-adjusted daily bars from market-data.mjs (Yahoo), the third-Friday and
 * holiday-displacement calendar from expiration-displacement.mjs, and this file's own NYSE closure
 * generator (statute plus the Saturday/Sunday observance rules), which is checked against the
 * session series itself rather than trusted. Two index ETFs, because opex-2027-06-17 found SPY does
 * not carry signatures single names do and one instrument is not a result. Closes only; no
 * intraday, no open interest, no GEX.
 * Educational, paper-standard — this measures a calendar mechanic, it does not propose a trade.
 */

import { rmSync } from "node:fs";
import { join } from "node:path";
import { expirations } from "./expiration-displacement.mjs";
import { bars } from "./market-data.mjs";

const SYMBOLS = ["QQQ", "SPY"];
const FROM = 2002;

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
const sd = (xs) => {
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1));
};
const days = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
const shiftDays = (d, n) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

// --- the NYSE closure calendar, generated rather than fetched -------------------------------
// Fetched holiday tables cover three years; this study needs twenty-five. The rules are statute
// (5 U.S.C. 6103) plus the exchange's observance convention, and main() checks every generated
// date against the actual session series before any of it is used.
const utc = (y, m, d) => new Date(Date.UTC(y, m - 1, d));
const iso = (t) => t.toISOString().slice(0, 10);
const nth = (y, m, weekday, n) => {
  const first = utc(y, m, 1);
  return utc(y, m, 1 + ((weekday - first.getUTCDay() + 7) % 7) + 7 * (n - 1));
};
const last = (y, m, weekday) => {
  const end = new Date(Date.UTC(y, m, 0));
  return new Date(end.getTime() - ((end.getUTCDay() - weekday + 7) % 7) * 86_400_000);
};
function easter(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  return utc(year, Math.floor((h + l - 7 * m + 114) / 31), ((h + l - 7 * m + 114) % 31) + 1);
}
/** Saturday -> observed the Friday before; Sunday -> the Monday after. */
const observed = (d) =>
  d.getUTCDay() === 6
    ? new Date(d.getTime() - 86_400_000)
    : d.getUTCDay() === 0
      ? new Date(d.getTime() + 86_400_000)
      : d;

export function closures(year) {
  const out = [
    ["New Year's Day", observed(utc(year, 1, 1))],
    ["MLK", nth(year, 1, 1, 3)],
    ["Washington's Birthday", nth(year, 2, 1, 3)],
    ["Good Friday", new Date(easter(year).getTime() - 2 * 86_400_000)],
    ["Memorial Day", last(year, 5, 1)],
    ["Independence Day", observed(utc(year, 7, 4))],
    ["Labor Day", nth(year, 9, 1, 1)],
    ["Thanksgiving", nth(year, 11, 4, 4)],
    ["Christmas", observed(utc(year, 12, 25))],
  ];
  // Juneteenth became an NYSE holiday in 2022, not when the statute passed.
  if (year >= 2022) out.push(["Juneteenth", observed(utc(year, 6, 19))]);
  return out
    // A New Year's Day falling on a Saturday is the one fixed-date holiday the NYSE does NOT pull
    // back to the Friday — 2028 is the next such year, and it is why January 2028 has one closure.
    .filter(([name, d]) => !(name === "New Year's Day" && utc(year, 1, 1).getUTCDay() === 6))
    .filter(([, d]) => d.getUTCDay() !== 0 && d.getUTCDay() !== 6)
    .map(([name, d]) => ({ name, date: iso(d) }));
}

// --- the study -------------------------------------------------------------------------------

/** One row per expiration: both windows, all three estimators, and the geometry class. */
export function observations(rows, holidays, from = FROM) {
  const at = new Map(rows.map((r, i) => [r.date, i]));
  const out = [];
  for (const e of expirations(from, new Date().getUTCFullYear())) {
    const i = at.get(e.session);
    if (i == null || i - 5 < 0 || i + 5 >= rows.length) continue;
    const returns = (lo, hi) => {
      const r = [];
      for (let k = lo + 1; k <= hi; k++)
        r.push({ v: Math.log(rows[k].close / rows[k - 1].close), d: days(rows[k - 1].date, rows[k].date) });
      return r;
    };
    const pre = returns(i - 5, i);
    const post = returns(i, i + 5);
    const single = (r) => {
      const f = r.filter((x) => x.d === 1);
      return f.length >= 3 ? sd(f.map((x) => x.v)) : null;
    };
    const [sPost, sPre] = [single(post), single(pre)];
    out.push({
      ...e,
      raw: sd(post.map((x) => x.v)) / sd(pre.map((x) => x.v)),
      norm: sd(post.map((x) => x.v / Math.sqrt(x.d))) / sd(pre.map((x) => x.v / Math.sqrt(x.d))),
      oneDay: sPost != null && sPre != null ? sPost / sPre : null,
      preSpan: days(rows[i - 5].date, rows[i].date),
      postSpan: days(rows[i].date, rows[i + 5].date),
      // The two narrow classes, keyed off the calendar rather than off the span, so the span
      // itself stays an independent check on the classification.
      inside: holidays.has(shiftDays(e.friday, -4)),
      after: holidays.has(shiftDays(e.friday, 3)),
      firstAfter: (rows[i + 1].close / rows[i].close - 1) * 100,
    });
  }
  return out;
}

/** Mann-Whitney U (normal approximation, tie-corrected) — the cells here are small and skewed. */
export function mannWhitney(a, b) {
  const all = [...a.map((v) => [v, 0]), ...b.map((v) => [v, 1])].sort((x, y) => x[0] - y[0]);
  const rank = new Array(all.length);
  for (let i = 0; i < all.length; ) {
    let j = i;
    while (j + 1 < all.length && all[j + 1][0] === all[i][0]) j++;
    for (let k = i; k <= j; k++) rank[k] = (i + j + 2) / 2;
    i = j + 1;
  }
  const ra = all.reduce((acc, [, side], k) => acc + (side === 0 ? rank[k] : 0), 0);
  const [n1, n2] = [a.length, b.length];
  const u1 = ra - (n1 * (n1 + 1)) / 2;
  const u = Math.min(u1, n1 * n2 - u1);
  const counts = new Map();
  for (const [v] of all) counts.set(v, (counts.get(v) ?? 0) + 1);
  let ties = 0;
  for (const c of counts.values()) ties += c ** 3 - c;
  const n = n1 + n2;
  const sigma = Math.sqrt(((n1 * n2) / 12) * (n + 1 - ties / (n * (n - 1))));
  const z = (u - (n1 * n2) / 2) / sigma;
  return { z, p: 2 * (1 - normCdf(Math.abs(z))) };
}
const normCdf = (x) => 0.5 * (1 + erf(x / Math.SQRT2));
function erf(x) {
  const sign = x < 0 ? -1 : 1;
  const z = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * z);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-z * z);
  return sign * y;
}

const pct = (rows, pick) => {
  const f = rows.filter((r) => pick(r) != null);
  return f.length ? `${((100 * f.filter((r) => pick(r) > 1).length) / f.length).toFixed(1)}%` : "—";
};

function line(label, rows) {
  if (!rows.length) return console.log(`${label.padEnd(38)} n=  0`);
  const withOne = rows.filter((r) => r.oneDay != null);
  console.log(
    `${label.padEnd(38)} n=${String(rows.length).padStart(3)}  up(raw) ${pct(rows, (r) => r.raw).padStart(6)}` +
      `  up(1day) ${pct(rows, (r) => r.oneDay).padStart(6)}` +
      `  med(raw/norm) ${median(rows.map((r) => r.raw / r.norm)).toFixed(4)}` +
      `  med(raw/1day) ${withOne.length ? median(withOne.map((r) => r.raw / r.oneDay)).toFixed(4) : "—".padEnd(6)}` +
      `  spans ${[...new Set(rows.map((r) => `${r.preSpan}/${r.postSpan}`))].sort().join(",")}`,
  );
}

async function main() {
  if (process.argv.includes("--fresh"))
    rmSync(join(process.cwd(), "node_modules", ".cache", "earnings-cycle"), { recursive: true, force: true });

  const holidays = new Set();
  for (let y = FROM - 1; y <= new Date().getUTCFullYear() + 5; y++)
    for (const c of closures(y)) holidays.add(c.date);

  for (const symbol of SYMBOLS) {
    const rows = await bars(symbol);
    // The generated calendar is CHECKED, not trusted: every closure inside the traded span must be
    // a weekday with no session. A miss here invalidates every class below, so it prints first.
    const sessions = new Set(rows.map((r) => r.date));
    const span = [rows[0].date, rows.at(-1).date];
    const wrong = [...holidays].filter((d) => d >= span[0] && d <= span[1] && sessions.has(d));
    console.log(`\n################ ${symbol} — ${rows.length} sessions ${span[0]} -> ${span[1]}`);
    console.log(`calendar check: ${wrong.length ? `FAILED, traded on ${wrong.join(",")}` : "every generated closure is a non-session"}`);

    const obs = observations(rows, holidays);
    console.log(`\n-- the shelf's own cells (${obs.length} expirations) --`);
    line("all", obs);
    line("ordinary monthlies", obs.filter((r) => !r.quarterly));
    line("quarterly witchings", obs.filter((r) => r.quarterly));

    console.log("\n-- window geometry: the asymmetry --");
    const clean = obs.filter((r) => !r.inside && !r.after && r.preSpan === 7 && r.postSpan === 7);
    const after = obs.filter((r) => r.after);
    const inside = obs.filter((r) => r.inside);
    line("clean 7/7", clean);
    line("holiday AFTER expiry (post +3d)", after);
    line("holiday INSIDE expiry week (pre +1d)", inside);
    line("  inside, January (MLK)", inside.filter((r) => r.month === 1));
    line("  inside, February (Wash. Bday)", inside.filter((r) => r.month === 2));
    const infl = (rows) => rows.map((r) => r.raw / r.norm);
    console.log(
      `Mann-Whitney vs clean:  AFTER P=${mannWhitney(infl(after), infl(clean)).p.toFixed(4)}` +
        `   INSIDE P=${mannWhitney(infl(inside), infl(clean)).p.toFixed(4)}`,
    );
    console.log(
      `month mix of the INSIDE class: ${JSON.stringify(
        inside.reduce((a, r) => ({ ...a, [r.month]: (a[r.month] ?? 0) + 1 }), {}),
      )}  <- it is Jan+Feb by construction, so any return effect found here is confounded with the month`,
    );
    console.log(
      `first session after, mean: INSIDE ${mean(inside.map((r) => r.firstAfter)).toFixed(3)}%` +
        `  clean ${mean(clean.map((r) => r.firstAfter)).toFixed(3)}%` +
        `  AFTER ${mean(after.map((r) => r.firstAfter)).toFixed(3)}%` +
        `   (opex-2028-02-18 leg 7 already refuted this as Jan/Feb plus three crisis years)`,
    );
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`expiration-window-geometry failed: ${error.message}`);
    process.exit(1);
  });
}
