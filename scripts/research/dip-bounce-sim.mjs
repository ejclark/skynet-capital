/**
 * The pure core of the dip-to-bounce study (#5489 slice 1): annotate 5-minute bars with session
 * VWAP and the name's own trailing 5-minute range, find the dip entries, and walk each tranche to
 * its target, its day-5 hand-off, or the end of the sample. No I/O — `dip-bounce.mjs` fetches and
 * reports; `tests/research/dip-bounce-sim.spec.ts` pins the arithmetic on constructed bars.
 *
 * Conventions every number in the study inherits:
 *  - A bar's VWAP is the session's volume-weighted typical price through that bar's close.
 *  - The RANGE unit is the mean high-low of the previous RANGE_WINDOW bars (one full session), so
 *    the open's 2x range never sets the unit by itself.
 *  - Entry fills at the signal bar's CLOSE (a market order on the bar that crossed), never at the
 *    touch; a resting limit at the level would look better and is the optimistic reading.
 *  - Exit is a resting sell at the target: filled at the open when a bar opens at or above it
 *    (an overnight gap pays the open), else at the target only when a bar trades THROUGH it.
 *  - Age is counted in sessions: day 0 is the entry session, day 1 the next.
 */

export const RANGE_WINDOW = 78;
export const FIRST_ENTRY_MINUTE = 600; // 10:00 ET — the first 30 minutes never enter
export const HANDOFF_DAY = 5;

/** Flatten sessions into one bar array with day index, VWAP and the trailing range unit. */
export function annotate(sessions) {
  const flat = [];
  const ranges = [];
  let rangeSum = 0;
  sessions.forEach((s, day) => {
    let pv = 0;
    let vol = 0;
    for (const b of s.bars) {
      const typical = (b.high + b.low + b.close) / 3;
      const v = b.volume > 0 ? b.volume : 0;
      pv += typical * v;
      vol += v;
      const range = ranges.length >= RANGE_WINDOW ? rangeSum / RANGE_WINDOW : null;
      flat.push({ ...b, date: s.date, day, vwap: vol > 0 ? pv / vol : typical, range });
      ranges.push(b.high - b.low);
      rangeSum += b.high - b.low;
      if (ranges.length > RANGE_WINDOW) rangeSum -= ranges[ranges.length - 1 - RANGE_WINDOW];
    }
  });
  return flat;
}

/**
 * Dip entries: a bar from 10:00 ET closes at or below VWAP − k × range. One entry per cross; the
 * name re-arms when a bar closes back above the level, or ladders a further tranche when price
 * closes another k ranges below the last entry. Every session starts armed.
 */
export function findEntries(flat, { k, exclude = new Set(), firstMinute = FIRST_ENTRY_MINUTE }) {
  const out = [];
  let armed = true;
  let lastDay = -1;
  let lastEntry = null;
  for (let i = 0; i < flat.length; i++) {
    const b = flat[i];
    if (b.day !== lastDay) {
      armed = true;
      lastEntry = null;
      lastDay = b.day;
    }
    if (b.range == null || b.minutes < firstMinute || exclude.has(b.date)) continue;
    const level = b.vwap - k * b.range;
    if (b.close > level) {
      armed = true;
      continue;
    }
    const deeper = lastEntry != null && b.close <= lastEntry - k * b.range;
    if (armed || deeper) {
      out.push({ i, price: b.close, range: b.range });
      armed = false;
      lastEntry = b.close;
    }
  }
  return out;
}

/** The fill a bar gives a resting sell at `target`, or null. */
const fillAt = (b, target) => {
  if (b.open >= target) return b.open;
  return b.high > target ? target : null;
};

/**
 * Walk one tranche forward. Returns its exit (target, hand-off at the close of day `horizon`, or
 * censored at the sample's last close), its age in sessions at exit, the worst low it sat through
 * (as % below entry), and its close-to-close marks by age for the late-recovery rule.
 */
export function walkTranche(flat, entry, m, horizon = HANDOFF_DAY) {
  const target = entry.price + m * entry.range;
  const startDay = flat[entry.i].day;
  let worst = entry.price;
  for (let j = entry.i + 1; j < flat.length; j++) {
    const b = flat[j];
    const age = b.day - startDay;
    if (age > horizon) {
      return exitOf(flat, entry, j - 1, flat[j - 1].close, horizon, worst, "handoff");
    }
    worst = Math.min(worst, b.low);
    const fill = fillAt(b, target);
    if (fill != null) return exitOf(flat, entry, j, fill, age, worst, "target");
  }
  const last = flat.length - 1;
  const age = flat[last].day - startDay;
  const how = age >= horizon ? "handoff" : "censored";
  return exitOf(flat, entry, last, flat[last].close, age, worst, how);
}

function exitOf(flat, entry, at, price, age, worst, how) {
  return {
    entryAt: entry.i,
    exitAt: at,
    entry: entry.price,
    exit: price,
    age,
    how,
    grossPct: (price / entry.price - 1) * 100,
    worstPct: (worst / entry.price - 1) * 100,
    entryDate: flat[entry.i].date,
  };
}

/** Recovery rates by age: share of tranches that hit target by day N, among those observable. */
export function recoveryBy(trades, lastDay, flat, days) {
  return days.map((n) => {
    const seen = trades.filter((t) => t.how === "target" || flat[t.entryAt].day + n <= lastDay);
    const hit = seen.filter((t) => t.how === "target" && t.age <= n);
    return { day: n, n: seen.length, pct: seen.length ? (100 * hit.length) / seen.length : null };
  });
}
