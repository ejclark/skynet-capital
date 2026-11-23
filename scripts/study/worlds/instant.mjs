// The one instant every study world is pinned to (#4943 slice 2), and the only way an input file
// names a time.
//
// WHY ONE INSTANT: a world is a frozen copy of a book, re-composed per commit. If any payload read
// the wall clock (the shoot fixture's heartbeat does — it flips "beating" / "market closed" with
// the real hour), the same world would render differently at 9am and 9pm, and a fixed build could
// not be compared with today's. So the composer pins the process clock to INSTANT, the page pins
// its clock to INSTANT, and the input files never carry an absolute timestamp — only a token
// relative to it, resolved here. Calendar facts that are not "when something happened" (an
// option's expiry, an earnings date) stay absolute dates; they are facts about the market, not
// about the world's clock.
//
// A Thursday mid-session: the market is open, so a live bot is judged on its pass cadence and a
// stopped one reads as stopped rather than as "market closed".
//
// ONE INSTANT PER WORLD, NOT PER HARNESS (#8005): the profile worlds stand on 2026-10-08, before
// campaigns, editions, quests and convictions shipped; a world that studies them names its own
// instant in its input (`"instant"`, inputs.mjs). The composer and the chat child run one process
// per world with STUDY_INSTANT set to it, so everything below — the tokens, the pinned clock —
// reads that world's instant. A reader of a run takes it per world from the manifest
// (`worldInstant`), never from this module.

/** 2026-10-08 15:00 New York (EDT, UTC−4) — the profile worlds' instant, and any world's default. */
export const DEFAULT_INSTANT = "2026-10-08T15:00:00-04:00";

/** An instant a world may name: an ISO New York wall-clock time with its UTC offset. */
const INSTANT_SHAPE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/;

/** `value` if it is an instant a world may name; throws otherwise. */
export function checkInstant(value) {
  if (!(INSTANT_SHAPE.test(String(value)) && !Number.isNaN(Date.parse(value)))) {
    throw new Error(
      `instant: ${value} is not a New York time with its offset (e.g. ${DEFAULT_INSTANT})`,
    );
  }
  return value;
}

/** This process's world instant: STUDY_INSTANT when a world names its own, else the default. */
export const INSTANT = checkInstant(process.env.STUDY_INSTANT ?? DEFAULT_INSTANT);

/** A composed world's instant, read from its run's manifest (one per world since #8005). */
export const worldInstant = (manifest, world) => manifest.instants?.[world] ?? manifest.instant;

const ET_OFFSET = INSTANT.slice(-6);
const INSTANT_DAY = INSTANT.slice(0, 10);
const DAY_MS = 86_400_000;

/** `YYYY-MM-DD` that many calendar days from the instant's New York date (negative = before). */
export function dayFrom(days) {
  return new Date(Date.parse(`${INSTANT_DAY}T00:00:00Z`) + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

/**
 * Resolve one time token to an ISO instant:
 *   "@now"            the instant itself
 *   "@-20s" "@-3m" "@-2h"   that long before it
 *   "@-2d 10:31"      a New York wall-clock time that many calendar days before (0d = today)
 * Anything else is returned untouched, so plain strings pass through a recursive walk.
 */
export function resolveToken(value) {
  if (typeof value !== "string" || !value.startsWith("@")) return value;
  const base = Date.parse(INSTANT);
  if (value === "@now") return new Date(base).toISOString();
  const span = /^@-(\d+(?:\.\d+)?)(s|m|h)$/.exec(value);
  if (span) {
    const unit = { s: 1000, m: 60_000, h: 3_600_000 }[span[2]];
    return new Date(base - Number(span[1]) * unit).toISOString();
  }
  const wall = /^@(-?\d+)d (\d{2}):(\d{2})$/.exec(value);
  if (wall) {
    const iso = `${dayFrom(Number(wall[1]))}T${wall[2]}:${wall[3]}:00${ET_OFFSET}`;
    return new Date(Date.parse(iso)).toISOString();
  }
  throw new Error(`instant: unreadable time token ${value}`);
}

/** Every token in a JSON-shaped value, resolved (arrays and objects walked, other values kept). */
export function resolveTokens(value) {
  if (Array.isArray(value)) return value.map(resolveTokens);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolveTokens(v)]));
  }
  return resolveToken(value);
}

/** Epoch ms of a token — what a decision record's `at` holds. */
export const msOf = (token) => Date.parse(resolveToken(token));

/**
 * Pin THIS process's clock to the instant: `new Date()` and `Date.now()` answer it; every other
 * Date use is untouched. For the composer only — the builders it calls read the wall clock in
 * places no parameter reaches (a heartbeat's "now", a session-open check), and a world must not.
 * Never call this in a process that drives a browser: Playwright's own waits read Date.
 */
export function pinProcessClock() {
  const Real = Date;
  const pinned = Real.parse(INSTANT);
  class PinnedDate extends Real {
    constructor(...args) {
      if (args.length === 0) super(pinned);
      else super(...args);
    }
    static now() {
      return pinned;
    }
  }
  globalThis.Date = PinnedDate;
  return () => {
    globalThis.Date = Real;
  };
}
