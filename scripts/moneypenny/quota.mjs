#!/usr/bin/env node
// THE WEEKLY PACE READING, REPORT-ONLY (#6470).
//
//   node scripts/moneypenny/quota.mjs --tick
//   node scripts/moneypenny/quota.mjs --tick --used 21 --resets-at 2026-11-03T05:00:00Z
//
// With no flags the tick reads what the last touch point published on #4153's body (pace-reading.mjs);
// `--json` is what the steering page reads.
//
// One sum: the percent of the weekly limit used against the percent of the week gone. Nothing else
// in the repo computes it, and the dial on #4153 has only ever moved on Eric's word. `--tick` prints
// the reading and what a pace rule WOULD have done; it writes nothing, anywhere, and no flag makes
// it write. Surge stays Eric's alone, conservation follows his explicit phrase (docs/COMPUTE.md), and
// nothing here grants either.
//
// WHAT THE BACK-TEST SAID, AND WHY THIS STOPS AT A PRINT. Over the 17 recorded readings across four
// weeks the rule made 0 moves. The readings furthest ahead of the line sit inside his orders (10-19
// "go - do all the work you can", largest +6); the one run-out outside any order, 09-29, read +1 at
// 99% of the week gone. None clears the band, even with his orders taken away. This week's real
// failure is the other direction:
// 13 to 21% used with 74 to 76% of the week gone, behind pace by 55 to 61. A brake alone would never
// have fired. So a zero count from this tick is what the record predicts whether or not the rule is
// any good, and it cannot justify a grant. What would change that is one real `ahead` reading outside
// a surge or go by 2026-11-24; with none, there is no case for a brake at all. Flat lines were the
// alternative and did worse: 85/95 would have braked against his orders 4 times, on 10-19 and 10-27.
//
// THE RULE'S ORDER, first match wins:
//   blind       no reading, one older than 12h, or one from a week that has already reset. A stale
//               number is said to be stale; it never prints as if it were fresh.
//   stand-down  a person's order is active: a go in his words, or a non-normal dial. His hand wins.
//   ahead       used is more than 10 points over the share of the week gone. Would set conserve.
//   behind      used is more than 10 points under it. Says so and moves nothing: the only move
//               that answers it is surge, which is his.
//   on pace     otherwise.
// The 10 is a first guess with no cost anchor (no dollars-per-point figure holds yet). Reservations
// and a release rule are left out on purpose: no reservation has ever been declared, and a report
// that never moves has nothing to release.
//
// Pure where it decides; `tick` takes its reader injected, so a spec fakes `gh` and can assert the
// only calls it makes are reads.
import { readWorkMode } from "./work-mode.mjs";

const HOUR_MS = 3_600_000;
const WEEK_MS = 168 * HOUR_MS;

/** Points away from the line before the reading stops being "on pace". See the header. */
export const BAND_POINTS = 10;

/** Past this a reading says stale. Two touch points a day leave at most about 12h between readings. */
export const STALE_AFTER_MS = 12 * HOUR_MS;

/** A reading dated further ahead of the clock than this is a typo, not a skew between two machines. */
const FUTURE_SKEW_MS = 300_000;

/** Percent of the week gone at `at`, and how far `used` sits from it. Pure; `at` and `resetsAt` in ms. */
export function pace({ used, at, resetsAt }) {
  const gone = Math.min(100, Math.max(0, ((at - (resetsAt - WEEK_MS)) / WEEK_MS) * 100));
  return { gone, delta: used - gone };
}

/** The order active at `now`, or null. An order is `{ from, until, words }` with ISO times. */
const activeOrder = (orders, now) =>
  orders.find((o) => now >= Date.parse(o.from) && now < Date.parse(o.until)) ?? null;

/** Why this reading cannot be judged at `now`, or null when it can. */
function blindReason(reading, now) {
  const parts = [reading?.used, reading?.at, reading?.resetsAt];
  if (!parts.every(Number.isFinite)) return "no reading";
  if (reading.at - now > FUTURE_SKEW_MS) return "no reading";
  if (now >= reading.resetsAt) return "the week it measured has reset";
  if (now - reading.at > STALE_AFTER_MS) return "stale";
  return null;
}

/**
 * Pure: judge a reading `{ used, at, resetsAt }` (ms) against his dated orders at `now`, and `hand`:
 * words for a person's hand on the dial right now, if any.
 * `wouldSet` is the one dial move a pace rule would have made, or null. It is a report, never a
 * write: nothing in this file acts on it.
 */
export function reckon(reading, { orders = [], hand = null, now = reading?.at ?? 0 } = {}) {
  const blind = blindReason(reading, now);
  if (blind) return { state: "blind", why: blind, wouldSet: null, reading: reading ?? null };
  const { gone, delta } = pace(reading);
  const base = { gone, delta, reading, wouldSet: null };
  const held = hand ?? activeOrder(orders, now)?.words;
  if (held) return { ...base, state: "stand-down", why: held };
  if (delta > BAND_POINTS) return { ...base, state: "ahead", why: "", wouldSet: "conserve" };
  if (delta < -BAND_POINTS) return { ...base, state: "behind", why: "" };
  return { ...base, state: "on-pace", why: "" };
}

const shortTime = (ms) => new Date(ms).toISOString().slice(5, 16).replace("T", " ");

/** Where the reading sits against the line, in words. */
function standing({ state, delta, why }) {
  const by = Math.abs(Math.round(delta));
  if (state === "ahead") return `ahead of pace by ${by}`;
  if (state === "behind") return `behind pace by ${by}`;
  if (state === "stand-down") return `his order stands ("${why}")`;
  return "on pace";
}

/** One line a person reads: the numbers, then where they sit. A stale number says so first. */
export function paceLine(reckoning) {
  const { state, why, reading, gone } = reckoning;
  if (state === "blind") {
    if (why === "no reading") return "pace: no reading";
    const when = `read ${shortTime(reading.at)}Z`;
    const beyond = why === "stale" ? "" : ` (${why})`;
    return `pace: STALE, ${reading.used}% used when ${when}${beyond}`;
  }
  const numbers = `week ${reading.used}% used, ${Math.round(gone)}% gone`;
  return `pace: ${numbers}, ${standing(reckoning)}, resets ${shortTime(reading.resetsAt)}Z`;
}

/** What a pace rule would have done, in words. Never surge and never halt, by construction. */
export function wouldHaveDone(reckoning) {
  if (reckoning.wouldSet) return `would have set ${reckoning.wouldSet}`;
  return "would have moved nothing";
}

/** A non-normal dial is a person's hand, until a rule ever sets one. An unreadable dial's `conserve`
 *  is a fallback nobody chose, so it is no hand. */
const dialHand = (mode) =>
  mode.unreadable || mode.position === "normal" ? null : `dial at ${mode.position}`;

/**
 * One report-only tick: read the dial, judge the reading, print. Its only external call is the dial's
 * own read. From the command line `orders` is always empty, because no record of his words exists
 * yet, so the line says it: a go in his words with the dial left at normal cannot stand this down.
 */
export function tick({ reading = null, orders = [], now = Date.now(), readDial = readWorkMode }) {
  const mode = readDial();
  const verdict = reckon(reading ?? mode.reading ?? null, { orders, hand: dialHand(mode), now });
  const line = `${paceLine(verdict)} · dial ${mode.position} · ${wouldHaveDone(verdict)}${orders.length ? "" : " (his dated words not read)"} · report only, wrote nothing`;
  return { line, verdict, position: mode.position };
}

/** The value after `--flag`, or undefined. */
const flagValue = (argv, flag) => {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : undefined;
};

/** The reading the flags describe, or null. A session passes what get_usage printed. */
function readingFromFlags(argv, now) {
  const used = Number(flagValue(argv, "--used"));
  const resetsAt = Date.parse(flagValue(argv, "--resets-at") ?? "");
  const readAt = flagValue(argv, "--read-at");
  if (!Number.isFinite(used) || Number.isNaN(resetsAt)) return null;
  return { used, resetsAt, at: readAt ? Date.parse(readAt) : now };
}

function main(argv) {
  if (!argv.includes("--tick")) {
    console.error("usage: quota.mjs --tick [--used N --resets-at ISO [--read-at ISO]] [--now ISO]");
    process.exit(2);
  }
  // Flags that name a reading must describe one, or the published number would answer for them.
  const named = argv.includes("--used") || argv.includes("--resets-at");
  if (named && readingFromFlags(argv, 0) === null) {
    console.error("quota.mjs: --used needs a number and --resets-at a time");
    process.exit(2);
  }
  const nowFlag = flagValue(argv, "--now");
  const now = nowFlag ? Date.parse(nowFlag) : Date.now();
  if (Number.isNaN(now)) {
    console.error(`quota.mjs: --now is not a date: ${nowFlag}`);
    process.exit(2);
  }
  const { line, verdict } = tick({ reading: readingFromFlags(argv, now), now });
  if (argv.includes("--json")) {
    console.log(JSON.stringify({ pace: paceLine(reckon(verdict.reading, { now })) }));
    return;
  }
  console.log(line);
}

if (import.meta.url === `file://${process.argv[1]}`) main(process.argv.slice(2));
