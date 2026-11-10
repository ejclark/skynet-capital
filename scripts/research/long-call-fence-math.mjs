/**
 * The pure half of the long-call fence study (`long-call-fence-study.mjs`, #6598 slice 2, Study B):
 * do the AI-dip view's two fences on CRWV-LONG-CALL earn a place as the pair's own setting? No I/O
 * here; the CLI loads bars and prints and hands plain arrays in, so every rule below is specified
 * against constructed numbers (tests/research/long-call-fence-math.spec.ts).
 *
 * THE PLAYBOOK, read off the live code so the replay buys what the bot would buy (`long-call.ts`):
 * the latest listed expiry 120 to 200 calendar days out, the strike nearest 0.60 delta (standard
 * mode), sold at double its cost or with 45 days left, whichever comes first (`long-call-rules.ts`,
 * time wins a tie). No buy on a print's session or the one after (the guard's blackout).
 *
 * THE TWO FENCES, as rules with no fixed date:
 *   quiet         no buy from the print's session until 6 sessions after it (`inQuietPeriod`), so
 *                 the first buy is the 7th session after; the playbook's own first is the 2nd
 *   expiry floor  the 45-day exit must land on or after the day the cycle detector's recovery band
 *                 (sessions back to the entry price) reaches its 75th percentile. The live fence,
 *                 2027-03-18, is that rule read once on 2026-10-16 (72 sessions to 2027-02-01, plus
 *                 45 days). The playbook already takes the LATEST expiry in its window, so the floor
 *                 can never pick a later contract; it can only leave nothing to buy (narrow, never
 *                 widen: a floor past 200 days is a stand-aside, not a longer call).
 *
 * MODELED PREMIUM, AND WHY THE CRUSH IS PRICED. No option-price history exists offline. A plain
 * realized-vol proxy would run the crush backwards: the print-day move lifts trailing realized vol
 * just as real implied vol falls. So implied variance here is a print-free base plus each print
 * still ahead inside the option's life, priced at the name's own past print moves:
 *
 *   σ² · T  =  σ_base² · T  +  (prints ahead) · m²
 *
 * σ_base is 60 sessions of realized vol with every print reaction left out; m is the root mean
 * square of the name's last 8 print reactions known that day. A call bought before a print carries
 * one more m² than the same call a week after, and loses it on the reaction: that is the crush.
 */

import { rankQuantile } from "./cycle-phase-math.mjs";
import { addDays, annualizedVol, daysBetween } from "./premium-fit-math.mjs";
import { headlineSample, normCdf } from "./wheel-cap-math.mjs";

/** The window the long call buys in, calendar days to expiry (`long-call.ts` MIN_DTE, MAX_DTE). */
export const MIN_DTE = 120;
export const MAX_DTE = 200;
/** Sold at this many days left, or at this multiple of its cost (`long-call-rules.ts`). */
export const EXIT_DTE = 45;
export const TAKE_PROFIT = 2;
/** Standard mode's target delta (`LONG_CALL_DELTAS`). */
export const TARGET_DELTA = 0.6;
/** Paid over the model on the way in, given up on the way out (`leap-dip-study.mjs`'s 2%). */
export const SLIPPAGE = 0.02;
/** The quiet fence: sessions after the print with no buy (`conviction-seeds.ts`). */
export const QUIET_SESSIONS = 6;
/** Print reactions an event's priced move is averaged over, and the fewest it needs. */
export const EVENT_LOOKBACK = 8;
export const EVENT_MIN = 2;
/** Calendar days between projected prints once the filed ones run out. */
export const PRINT_GAP_DAYS = 91;
/** An expiry floor no listed expiry can meet: the rule leaves nothing to buy. */
export const NEVER = "9999-12-31";

const iso = (ms) => new Date(ms).toISOString().slice(0, 10);

export { addDays, daysBetween };

/** `n` weekdays after `from`, holidays not skipped: a session count past the tape, approximately. */
export function weekdaysAfter(from, n) {
  let day = from;
  for (let left = n; left > 0; ) {
    day = addDays(day, 1);
    const wd = new Date(`${day}T00:00:00Z`).getUTCDay();
    if (wd !== 0 && wd !== 6) left--;
  }
  return day;
}

const d1Of = (spot, strike, vol, years) =>
  (Math.log(spot / strike) + 0.5 * vol * vol * years) / (vol * Math.sqrt(years));

/** Black–Scholes European call, zero rate and dividend, the same model as Study A's put. */
export function callValue(spot, strike, vol, years) {
  if (!(years > 0 && vol > 0)) return Math.max(spot - strike, 0);
  const d1 = d1Of(spot, strike, vol, years);
  return spot * normCdf(d1) - strike * normCdf(d1 - vol * Math.sqrt(years));
}

/** A call's delta at zero rate: N(d1). */
export const callDelta = (spot, strike, vol, years) => normCdf(d1Of(spot, strike, vol, years));

/** The strike whose call delta is `delta`, by bisection (delta falls as the strike rises). */
export function strikeForCallDelta(spot, vol, years, delta = TARGET_DELTA) {
  let low = spot * 0.01;
  let high = spot * 5;
  for (let k = 0; k < 80; k++) {
    const mid = (low + high) / 2;
    if (callDelta(spot, mid, vol, years) > delta) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

/** The third Friday of a month (`month` 0-based): the standard monthly expiry. */
export function thirdFriday(year, month) {
  const first = new Date(Date.UTC(year, month, 1)).getUTCDay();
  return iso(Date.UTC(year, month, 1 + ((5 - first + 7) % 7) + 14));
}

/** Months a sparse chain lists far out: the March quarterly cycle plus January's LEAP month. */
const QUARTERLY = new Set([0, 2, 5, 8, 11]);

/**
 * The expiry the long call buys on `date`: the latest listed one 120 to 200 days out. `monthly`
 * lists every third Friday (the dense case, the floor's least binding); `quarterly` lists only the
 * March cycle and January, as a thin chain far out does. With `floor` set, an expiry before it is
 * `blocked`: the fence leaves nothing to buy, because no LATER expiry sits inside the window.
 *
 * @returns {{expiry: string, days: number, blocked: boolean} | null} null: nothing listed in the
 *   window at all (both arms idle)
 */
export function entryExpiry(date, { scheme = "monthly", floor = null } = {}) {
  const [y, m] = date.split("-").map(Number);
  let best = null;
  for (let k = 0; k <= 8; k++) {
    const month = (m - 1 + k) % 12;
    if (scheme === "quarterly" && !QUARTERLY.has(month)) continue;
    const expiry = thirdFriday(y + Math.floor((m - 1 + k) / 12), month);
    const days = daysBetween(date, expiry);
    if (days >= MIN_DTE && days <= MAX_DTE) best = { expiry, days };
  }
  if (!best) return null;
  return { ...best, blocked: floor != null && best.expiry < floor };
}

/** Sessions of print-free realized vol the base reads (`VOL_WINDOW`). */
export const VOL_WINDOW = 60;

/**
 * The tape half of the vol model: each print's filing session, the base vol on every session (the
 * last VOL_WINDOW returns with every print's reaction left out, or null until that many exist), and
 * each print's two-session move in excess of two ordinary sessions — what the event alone adds. A
 * print's reaction can land on its filing session or the next (EDGAR has no time of day), so both
 * returns are left out of the base and carried by the event term instead. Shared with the chain
 * replay (`src/scripts/chain-replay.ts`) so the two price options the same way.
 *
 * @param {readonly number[]} closes
 * @param {readonly string[]} dates
 * @param {readonly string[]} prints ascending filing dates
 */
export function printVolModel(closes, dates, prints, window = VOL_WINDOW) {
  const lr = closes.map((c, i) => (i === 0 ? 0 : Math.log(c / closes[i - 1])));
  const printAt = prints.map((p) => dates.findIndex((d) => d >= p)).filter((i) => i > 0);
  const touched = new Set(printAt.flatMap((s) => [s, s + 1]));
  const baseVol = closes.map((_, t) => {
    const clean = [];
    for (let i = t; i >= 1 && clean.length < window; i--) if (!touched.has(i)) clean.push(lr[i]);
    return clean.length < window ? null : annualizedVol(clean);
  });
  const moves = printAt
    .filter((s) => s + 1 < closes.length && baseVol[s - 1] != null)
    .map((s) => {
      const r2 = Math.log(closes[s + 1] / closes[s - 1]);
      const excess = Math.max(0, r2 * r2 - (2 * baseVol[s - 1] ** 2) / 252);
      return { reactedOn: dates[s + 1], move: Math.sqrt(excess) };
    });
  return { printAt, baseVol, moves };
}

/** Implied vol for an option of `years` with `events` prints ahead, each priced at `eventMove`. */
export function impliedVol({ baseVol, years, events, eventMove }) {
  if (!(years > 0)) return baseVol;
  return Math.sqrt(baseVol ** 2 + (events * eventMove ** 2) / years);
}

/**
 * Prints still ahead of `date` that land on or before `expiry`: the filed ones, then one every 91
 * days from the last filed print to fill the gap the tape has not reached. A print filed on `date`
 * itself still counts as ahead: an after-hours release reacts on the next close (`printMoves`).
 *
 * @param {string[]} prints ascending filing dates
 */
export function eventsAhead(prints, date, expiry) {
  let n = prints.filter((p) => p >= date && p <= expiry).length;
  const last = prints.at(-1);
  if (!last) return n;
  for (
    let next = addDays(last, PRINT_GAP_DAYS);
    next <= expiry;
    next = addDays(next, PRINT_GAP_DAYS)
  )
    if (next >= date) n++;
  return n;
}

/**
 * The move a print is priced at on `date`: the root mean square of the last EVENT_LOOKBACK
 * reactions that had landed before `date`, or null with fewer than EVENT_MIN (the CLI then pools
 * the basket's).
 *
 * @param {{reactedOn: string, move: number}[]} moves ascending by `reactedOn`
 */
export function eventMove(moves, date) {
  const known = moves.filter((m) => m.reactedOn < date).slice(-EVENT_LOOKBACK);
  if (known.length < EVENT_MIN) return null;
  return Math.sqrt(known.reduce((s, m) => s + m.move ** 2, 0) / known.length);
}

/**
 * Whether session `t` is a buy the fence holds back: the print's session through `quiet` sessions
 * after it. With `quiet` 1 this is the guard's own blackout (the print and the session after).
 *
 * @param {number[]} printAt ascending session indexes of each print's filing session
 */
export function heldBack(printAt, t, quiet) {
  return printAt.some((s) => t >= s && t <= s + quiet);
}

/**
 * One long call bought at the close of session `t` and held under the playbook's exits: sold the
 * first close it is worth TAKE_PROFIT × what it cost, or at EXIT_DTE days left, whichever comes
 * first (time wins a tie). Return on premium, after SLIPPAGE each way. Null when the tape ends first:
 * an unfinished trade is not an outcome.
 *
 * @param {object} p
 * @param {number[]} p.closes
 * @param {string[]} p.dates
 * @param {number} p.t the buy session
 * @param {string} p.expiry
 * @param {(k: number) => number} p.volAt implied vol for this expiry at the close of session k
 * @param {number} [p.delta]
 * @returns {{roi: number, cause: "profit" | "time", exitAt: number, strike: number} | null}
 */
export function longCallTrade({ closes, dates, t, expiry, volAt, delta = TARGET_DELTA }) {
  const years = (k) => daysBetween(dates[k], expiry) / 365;
  const strike = strikeForCallDelta(closes[t], volAt(t), years(t), delta);
  const paid = callValue(closes[t], strike, volAt(t), years(t)) * (1 + SLIPPAGE);
  for (let k = t + 1; k < closes.length; k++) {
    const mark = callValue(closes[k], strike, volAt(k), years(k)) * (1 - SLIPPAGE);
    if (daysBetween(dates[k], expiry) <= EXIT_DTE)
      return { roi: mark / paid - 1, cause: "time", exitAt: k, strike };
    if (mark >= TAKE_PROFIT * paid)
      return { roi: mark / paid - 1, cause: "profit", exitAt: k, strike };
  }
  return null;
}

/**
 * The recovery band's quantile `q` on one past day: sessions until the entry price came back, from
 * the same headline ladder as Study A's floor (`headlineSample`), built only from entries whose
 * whole recovery window had closed by `asOf`. A censored recovery is Infinity and survives
 * (`rankQuantile` picks a member), so a band where over a quarter never came back reads Infinity.
 *
 * @returns {{sessions: number, sample: string, level: string, units: number} | null}
 */
export function recoveryBand({ sym, state, names, asOf, q = 0.75 }) {
  const hit = headlineSample({ sym, state, names, asOf, pick: (e) => e.backToEntry });
  if (!hit) return null;
  return {
    sessions: rankQuantile(hit.values, q),
    sample: hit.sample,
    level: hit.level,
    units: hit.units,
  };
}

/**
 * The expiry floor the rule sets on session `t`: the session `sessions` later (counted on the tape
 * when it reaches that far, else as weekdays, holidays not skipped), plus EXIT_DTE calendar days, so
 * the time exit lands on or after it. Infinity is NEVER.
 *
 * @param {string[]} dates
 */
export function expiryFloor(dates, t, sessions) {
  if (!Number.isFinite(sessions)) return NEVER;
  const edge =
    dates[t + sessions] ?? weekdaysAfter(dates.at(-1), t + sessions - (dates.length - 1));
  return addDays(edge, EXIT_DTE);
}
