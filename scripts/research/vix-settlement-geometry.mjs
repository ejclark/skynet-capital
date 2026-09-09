#!/usr/bin/env node
/**
 * VIX-settlement geometry study — does it matter that a VIX settlement sometimes LEADS the equity
 * expiration and sometimes TRAILS it?
 *
 *   node scripts/research/vix-settlement-geometry.mjs
 *   node scripts/research/vix-settlement-geometry.mjs --fresh   # bust this cache and the bar cache
 *
 * WHY THIS EXISTS — it is a TRAP DETECTOR, in the same shape as fomc-expiration-proximity.mjs.
 *
 * VIX futures and options settle on the Wednesday 30 days before the third Friday of the FOLLOWING
 * month (cboe.com/tradable_products/vix/vix_futures/specifications/, quoted verbatim in
 * src/domain/market-events/vix-expiration-2027-05-18.json). Consecutive third Fridays are either 28
 * or 35 days apart, so that Wednesday lands on ONE OF EXACTLY TWO GEOMETRIES relative to its own
 * month's equity expiration, and never anywhere else:
 *
 *   LEAD  (-2 calendar days, -2 sessions)  28-day step — the vol complex settles two sessions
 *                                          BEFORE the third Friday.
 *   TRAIL (+5 calendar days, +3 sessions)  35-day step — it settles three sessions AFTER, into a
 *                                          post-opex tape.
 *
 * The gap is reported in SESSIONS, so a holiday inside the span shifts it off those two values;
 * the LEAD/TRAIL split is by sign, never by magnitude.
 *
 * 2026-09-16 is a LEAD; 2026-10-21 is a TRAIL. The `vix-expiration-2026-09-16` ledger built its
 * framing on the lead shape ("the hedging cushion starts leaving two sessions before the witching"),
 * and a TRAIL settlement inverts that story wholesale. Before any ledger asserts that the inversion
 * MATTERS, something has to measure whether the two cohorts differ at all — otherwise the geometry
 * is a calendar fact being narrated as a market effect, which is precisely the failure
 * fomc-expiration-proximity.mjs was built to catch.
 *
 * THE TWO THINGS IT MEASURES, in the order they matter:
 *
 *   1. Does the settlement session leave a mark in VIX itself? Absolute close-to-close change in
 *      VIX cash on settlement day, LEAD vs TRAIL, permutation-tested. Reported against an
 *      all-session baseline first, so a null reads as a null rather than as "small".
 *   2. Does it leave a mark in equity volume? Basket relative volume (the definition and the
 *      basket both reused from expiration-displacement.mjs, never restated), LEAD vs TRAIL.
 *
 * ERA CONTROL, because that is what killed the last calendar-shaped claim here: every comparison is
 * printed RAW and again for 2013+ alone. The geometry alternates on a ~3-year cycle rather than
 * clustering in an era, so a raw/modern disagreement here is a sample artifact rather than the
 * structural growth fomc-expiration-proximity.mjs found — but the control runs automatically next
 * to the claim either way.
 *
 * DATA: Cboe's own VIX daily history (cdn.cboe.com, the exchange's published index file) plus the
 * daily-bar basket from expiration-displacement.mjs. Sample starts 2006 — VIX OPTIONS listed in
 * February 2006, so before then "the settlement" is a futures-only event and a different animal.
 * Volume and index closes only; no intraday, no open interest, no VRO, no GEX.
 * Educational, paper-standard — this measures a calendar mechanic, it does not propose a trade.
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { BASKET, bars, build, expirations } from "./expiration-displacement.mjs";

const CACHE = join(process.cwd(), "node_modules", ".cache", "vix-settlement-geometry");
const UA = "skynet-capital research (ejclark83@gmail.com)";
const VIX_HISTORY = "https://cdn.cboe.com/api/global/us_indices/daily_prices/VIX_History.csv";
const FROM_YEAR = 2006;
const DRAWS = 10_000;

/** Cboe's published VIX daily closes, keyed ISO date. The exchange's own file, not a vendor's. */
async function vixCloses() {
  mkdirSync(CACHE, { recursive: true });
  const path = join(CACHE, "vix-history.json");
  if (existsSync(path)) return new Map(JSON.parse(readFileSync(path, "utf8")));
  const res = await fetch(VIX_HISTORY, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`VIX history -> ${res.status} ${res.statusText}`);
  const rows = [];
  for (const line of (await res.text()).split("\n").slice(1)) {
    const [date, , , , close] = line.trim().split(",");
    if (!(date && close)) continue;
    const [m, d, y] = date.split("/");
    rows.push([`${y}-${m}-${d}`, Number(close)]);
  }
  writeFileSync(path, JSON.stringify(rows));
  return new Map(rows);
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};

/** Quantile, nearest-rank — the shape a forward test needs to state a threshold on evidence. */
const quantile = (xs, p) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.max(0, Math.round(p * (s.length - 1))))];
};

/**
 * Two-sided permutation test on the difference of medians. Labels are shuffled, never the values,
 * so the null being tested is "the geometry label carries no information" — the only null a
 * calendar split can honestly be tested against.
 */
function permutation(a, b) {
  const observed = Math.abs(median(a) - median(b));
  const pool = [...a, ...b];
  let hits = 0;
  for (let draw = 0; draw < DRAWS; draw++) {
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    if (
      Math.abs(median(shuffled.slice(0, a.length)) - median(shuffled.slice(a.length))) >= observed
    )
      hits++;
  }
  return (hits + 1) / (DRAWS + 1);
}

/**
 * Every monthly VIX settlement session in range, with its geometry. The spec's holiday clause —
 * "if that Wednesday, or the Friday 30 days following it, is a Cboe Options holiday, settlement
 * moves to the business day immediately preceding that Wednesday" — is applied off the real session
 * calendar rather than a holiday table, which is what reproduces cases like VX/K7 -> 2027-05-18
 * (settlement moved because the FRIDAY was Juneteenth, not the Wednesday).
 */
function settlements(cal, isSession, lastSession) {
  const byMonth = new Map(cal.map((e) => [`${e.year}-${e.month}`, e]));
  const out = [];
  for (const entry of cal) {
    const next = byMonth.get(
      entry.month === 12 ? `${entry.year + 1}-1` : `${entry.year}-${entry.month + 1}`,
    );
    if (!next) continue;
    const strip = new Date(`${next.friday}T00:00:00Z`);
    let session = new Date(strip.getTime() - 30 * 86400000).toISOString().slice(0, 10);
    // The clause fires on either leg; stepping back over non-sessions covers both. Past the last
    // known session the calendar cannot answer, so only the Friday leg is applied — a future
    // Wednesday walked backwards against an exhausted session list would invent a date.
    if (next.session !== next.friday)
      session =
        session <= lastSession
          ? previousSession(session, isSession)
          : new Date(new Date(`${session}T00:00:00Z`).getTime() - 86400000)
              .toISOString()
              .slice(0, 10);
    if (session <= lastSession)
      while (!isSession(session)) session = previousSession(session, isSession);
    out.push({ year: entry.year, month: entry.month, session, opex: entry.session });
  }
  return out;
}

const previousSession = (date, isSession) => {
  let t = new Date(`${date}T00:00:00Z`).getTime() - 86400000;
  for (let guard = 0; guard < 10; guard++) {
    const iso = new Date(t).toISOString().slice(0, 10);
    if (isSession(iso)) return iso;
    t -= 86400000;
  }
  return new Date(t).toISOString().slice(0, 10);
};

function report(label, lead, trail) {
  if (lead.length < 5 || trail.length < 5) {
    console.log(
      `  ${label.padEnd(26)} too few observations (lead ${lead.length}, trail ${trail.length})`,
    );
    return;
  }
  console.log(
    `  ${label.padEnd(26)} LEAD med ${median(lead).toFixed(3)} (n=${lead.length})   ` +
      `TRAIL med ${median(trail).toFixed(3)} (n=${trail.length})   ` +
      `diff ${(median(trail) - median(lead)).toFixed(3)}   P = ${permutation(lead, trail).toFixed(3)}`,
  );
}

async function main() {
  if (process.argv.includes("--fresh")) {
    rmSync(CACHE, { recursive: true, force: true });
    rmSync(join(process.cwd(), "node_modules", ".cache", "expiration-displacement"), {
      recursive: true,
      force: true,
    });
  }
  const series = Object.fromEntries(
    await Promise.all([...BASKET, "SPY"].map(async (s) => [s, await bars(s)])),
  );
  const { basket, isSession } = build(series);
  const lastSession = series.SPY.at(-1).date;
  const vix = await vixCloses();
  const dates = [...vix.keys()].sort();
  const priorClose = new Map(dates.map((d, i) => [d, i ? vix.get(dates[i - 1]) : null]));

  const cal = expirations(FROM_YEAR - 1, new Date().getUTCFullYear() + 1);
  const all = settlements(cal, isSession, lastSession);
  const rows = [];
  for (const s of all) {
    if (s.year < FROM_YEAR || !vix.has(s.session)) continue;
    const before = priorClose.get(s.session);
    if (before == null) continue;
    const opexIndex = dates.indexOf(s.opex);
    const sessionIndex = dates.indexOf(s.session);
    rows.push({
      ...s,
      gap: opexIndex >= 0 && sessionIndex >= 0 ? sessionIndex - opexIndex : null,
      dVix: Math.abs(vix.get(s.session) - before),
      relvol: basket(s.session),
    });
  }
  const scored = rows.filter((r) => r.gap != null);
  const lead = scored.filter((r) => r.gap < 0);
  const trail = scored.filter((r) => r.gap > 0);

  console.log(
    `\nVIX monthly settlements ${FROM_YEAR}+: n=${scored.length} ` +
      `(lead ${lead.length}, trail ${trail.length}) — gaps seen: ` +
      `${[...new Set(scored.map((r) => r.gap))].sort((a, b) => a - b).join(", ")} sessions from opex`,
  );

  // Baseline first: without it a small LEAD/TRAIL difference reads as "small effect" when the
  // honest reading is "settlement days are not distinguishable from any other day either".
  const allMoves = dates
    .map((d, i) => (i ? Math.abs(vix.get(d) - vix.get(dates[i - 1])) : null))
    .filter((v, i) => v != null && dates[i] >= `${FROM_YEAR}-01-01`);
  const settleMoves = scored.map((r) => r.dVix);
  console.log(
    `\nBASELINE  |dVIX| all sessions ${FROM_YEAR}+ med ${median(allMoves).toFixed(3)} ` +
      `(n=${allMoves.length})   settlement sessions med ` +
      `${median(settleMoves).toFixed(3)} (n=${scored.length})   ` +
      `P = ${permutation(allMoves, settleMoves).toFixed(3)}`,
  );
  // Printed so a ledger can state a forward-test threshold on evidence rather than on a round number.
  const trailMoves = trail.map((r) => r.dVix);
  console.log(
    `          settlement |dVIX| p75 ${quantile(settleMoves, 0.75).toFixed(3)} ` +
      `p90 ${quantile(settleMoves, 0.9).toFixed(3)}   ` +
      `TRAIL-only p75 ${quantile(trailMoves, 0.75).toFixed(3)} ` +
      `p90 ${quantile(trailMoves, 0.9).toFixed(3)}`,
  );

  console.log("\nRAW");
  report(
    "|dVIX| on settlement",
    lead.map((r) => r.dVix),
    trail.map((r) => r.dVix),
  );
  report(
    "basket relvol",
    lead.map((r) => r.relvol).filter((v) => v != null),
    trail.map((r) => r.relvol).filter((v) => v != null),
  );

  console.log("\nMODERN ERA (2013+)");
  const modern = (rs) => rs.filter((r) => r.year >= 2013);
  report(
    "|dVIX| on settlement",
    modern(lead).map((r) => r.dVix),
    modern(trail).map((r) => r.dVix),
  );
  report(
    "basket relvol",
    modern(lead)
      .map((r) => r.relvol)
      .filter((v) => v != null),
    modern(trail)
      .map((r) => r.relvol)
      .filter((v) => v != null),
  );

  // Forward rows carry no VIX close yet, so the session-index gap is unavailable; calendar days
  // carry the same sign and are the only honest label before the sessions exist.
  const today = new Date().toISOString().slice(0, 10);
  console.log("\nUPCOMING");
  for (const s of all.filter((r) => r.session > today).slice(0, 5)) {
    const days = Math.round(
      (new Date(`${s.session}T00:00:00Z`) - new Date(`${s.opex}T00:00:00Z`)) / 86400000,
    );
    console.log(
      `  ${s.session}  opex ${s.opex}  ${days > 0 ? `+${days}` : days} calendar days ` +
        `(${days > 0 ? "TRAIL" : "LEAD"})`,
    );
  }
  console.log();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
