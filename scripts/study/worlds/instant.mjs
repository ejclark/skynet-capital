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
// ONE INSTANT PER WORLD, NOT PER HARNESS (#8005). The profile's worlds stand on DEFAULT_INSTANT, a
// Thursday mid-session the profile study was cut at. A later area may need a later day — the bot's
// loop shows a conviction view first stated on 2026-10-16, which a world on 10-08 would show eight
// days before it existed. So a world's input may name its own `instant` (`parseInstant` holds it to
// New York's clock), and the composer runs that world's child with it in `STUDY_INSTANT`
// (compose.mjs), so every module here reads that world's instant and nothing else. A process that
// serves several worlds (parity, a session, the facts sheet) never reads INSTANT for one: it reads
// the run's record of each world's instant (`worldInstant`).
//
// A Thursday mid-session: the market is open, so a live bot is judged on its pass cadence and a
// stopped one reads as stopped rather than as "market closed".

/** 2026-10-08 15:00 New York (EDT, UTC−4) — every world that names no instant of its own. */
export const DEFAULT_INSTANT = "2026-10-08T15:00:00-04:00";

const SHAPE = /^(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}:\d{2}([+-]\d{2}:\d{2})$/;

/** New York's UTC offset on one calendar day ("-04:00" or "-05:00"), read at its noon — the
 *  clocks change at 2am, so every session hour of that day shares it. */
export function nyOffset(day) {
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    timeZoneName: "longOffset",
  })
    .formatToParts(new Date(`${day}T12:00:00Z`))
    .find((p) => p.type === "timeZoneName")?.value;
  const offset = name?.replace("GMT", "");
  if (!(offset && /^[+-]\d{2}:\d{2}$/.test(offset))) {
    throw new Error(`instant: no New York offset for ${day}`);
  }
  return offset;
}

/**
 * A world's instant as written: a New York wall-clock time with New York's own offset for that day
 * ("2026-11-19T15:00:00-05:00"). Anything else is refused — an offset that is not New York's would
 * shift every "@-2d 10:31" the input resolves off its session.
 */
export function parseInstant(raw) {
  const m = typeof raw === "string" ? SHAPE.exec(raw) : null;
  if (!m || Number.isNaN(Date.parse(raw))) {
    throw new Error(`instant: ${raw} is not a New York wall-clock time with its offset`);
  }
  if (m[2] !== nyOffset(m[1])) {
    throw new Error(
      `instant: ${raw} carries ${m[2]}, but New York is at ${nyOffset(m[1])} that day`,
    );
  }
  return raw;
}

/** This process's instant: the composing world's (`STUDY_INSTANT`), else the default. */
export const INSTANT =
  process.env.STUDY_INSTANT === undefined
    ? DEFAULT_INSTANT
    : parseInstant(process.env.STUDY_INSTANT);

/** One world's instant from a compose run's manifest: its own record, else the run's one instant
 *  (a run composed before worlds could name their own). */
export function worldInstant(manifest, world) {
  return manifest.instants?.[world] ?? manifest.instant;
}

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
    // That day's own New York offset: a month of history can cross a clock change (#8005).
    const day = dayFrom(Number(wall[1]));
    const iso = `${day}T${wall[2]}:${wall[3]}:00${nyOffset(day)}`;
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
