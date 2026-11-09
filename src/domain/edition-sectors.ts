/**
 * THE WHOLE MARKET ON THE LANDING PAGE (#7077 slice 1b, round 3). Eric's live review of the shipped
 * page (#7018 round 3, 2026-11-08): "Shouldn't we start with a wholestick overview - there are 11
 * official GICS stock market sectors. At the sector level, aggregated information only seems
 * necessary." AT1–AT3: the first screen shows all 11 sectors and the S&P 500, one SPDR fund each,
 * with its move over Day · Week · Month · YTD.
 *
 * CLOSES, NOT MOVES, ARE CHECKED IN. An edition carries each fund's closing price on its own date and
 * on every period's starting date; the moves are worked out here, so a hand-typed percentage can never
 * disagree with the prices it came from. The closes are fetched by `scripts/edition-sectors.mjs`
 * (Yahoo daily closes, split-adjusted, dividends not added back, so a move is a price change) and
 * written beside the stories, the same way the edition itself is fed by hand until #6949 slice 5.
 *
 * THE PERIODS ARE FIXED BY THE CALENDAR, so the loader can check them rather than trust them:
 *   - Day: since the session before the edition's close.
 *   - Week: since the last close of the week before (Friday, or earlier on a holiday).
 *   - Month: since the last close on or before the same date a month back.
 *   - YTD: since the last close of the year before.
 *
 * WHERE EACH PRICE SITS IN ITS 20-DAY RANGE (slice 1c, AT8). Eric, round 3: "a small Bollinger band
 * with a mark". The range is the 20-session Bollinger band, the 20-day average of the closes two
 * standard deviations either side (population deviation, Bollinger's own definition), and the mark is
 * the edition's close. So an edition also carries its last 20 closes per fund, and the band is worked
 * out here from them, never typed. It describes where a price sits, never where it goes: no buy or
 * sell reading is drawn from it anywhere in the app.
 *
 * Which fund stands for which sector is `GICS_SECTORS` in `sector-coverage.ts`, one table for the
 * whole app. SPY stands for the S&P 500. Paper only; nothing here places or sizes an order.
 */
import { isSession, sessionsBefore } from "./market-calendar.js";
import { GICS_SECTORS } from "./sector-coverage.js";

/** The S&P 500's row: the whole market, drawn apart from the sectors (round 3's run 2 fix: "6 of 9
 *  notes had missed the grey line"). */
export const MARKET_FUND = { name: "S&P 500", fund: "SPY" } as const;

/** Every fund the overview draws: the market first, then the 11 sectors in `GICS_SECTORS` order. */
export const SECTOR_FUNDS: readonly { readonly name: string; readonly fund: string }[] = [
  MARKET_FUND,
  ...GICS_SECTORS,
];

export const SECTOR_PERIODS = ["day", "week", "month", "ytd"] as const;
export type SectorPeriod = (typeof SECTOR_PERIODS)[number];

/** What an edition carries: each fund's closes by date, and where they came from. */
export interface EditionSectors {
  /** Where the closes come from, said plainly, with the day they were fetched. */
  readonly source: string;
  /** `closes[fund][YYYY-MM-DD]`: the edition's own close and each period's starting close. */
  readonly closes: Readonly<Record<string, Readonly<Record<string, number>>>>;
}

const DAY_MS = 86_400_000;

const iso = (ms: number): string => new Date(ms).toISOString().slice(0, 10);
const at = (date: string): number => Date.parse(`${date}T00:00:00Z`);

/** The last session on or before `date`. */
function lastSessionOnOrBefore(date: string): string {
  return isSession(date) ? date : sessionsBefore(date, 1);
}

/** The same day a month back, held to the month's last day (Mar 31 → Feb 28). */
function monthBack(date: string): string {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const year = m === 1 ? y - 1 : y;
  const month = m === 1 ? 12 : m - 1;
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(Math.min(d, last)).padStart(2, "0")}`;
}

/** The band's window: 20 sessions, Bollinger's default and the length AT8 names. */
export const RANGE_SESSIONS = 20;

/** The edition's own session and the 19 before it, oldest first: the closes the band is drawn from. */
export function rangeDates(date: string): readonly string[] {
  const out = [date];
  while (out.length < RANGE_SESSIONS) out.unshift(sessionsBefore(out[0] as string, 1));
  return out;
}

/** Every date an edition dated `date` must carry a close for: its own, each period's start, and the
 *  band's 20 sessions. Sorted, no repeats. */
export function neededCloses(date: string): readonly string[] {
  return [...new Set([date, ...Object.values(sectorBases(date)), ...rangeDates(date)])].sort();
}

/** The close each period's move is measured from, for an edition dated `date` (a session). */
export function sectorBases(date: string): Readonly<Record<SectorPeriod, string>> {
  const weekday = new Date(at(date)).getUTCDay();
  const sunday = iso(at(date) - weekday * DAY_MS);
  return {
    day: sessionsBefore(date, 1),
    week: lastSessionOnOrBefore(sunday),
    month: lastSessionOnOrBefore(monthBack(date)),
    ytd: lastSessionOnOrBefore(`${Number(date.slice(0, 4)) - 1}-12-31`),
  };
}

type Fail = (what: string) => never;

const isPrice = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v > 0;

/** Check an edition's `sectors` block: every fund, and for each one exactly its needed closes. */
export function checkSectors(raw: unknown, date: string, fail: Fail): void {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) fail("sectors: not an object");
  const s = raw as Record<string, unknown>;
  if (!(typeof s.source === "string" && s.source.trim())) fail("sectors: name the source");
  if (!isSession(date)) fail(`sectors: ${date} is not a session, so it has no close`);
  const closes = s.closes;
  if (typeof closes !== "object" || closes === null) fail("sectors: closes must be an object");
  const byFund = closes as Record<string, unknown>;
  const wanted = SECTOR_FUNDS.map((f) => f.fund);
  const extra = Object.keys(byFund).find((k) => !wanted.includes(k));
  if (extra !== undefined) fail(`sectors: ${extra} is not one of the overview's funds`);
  const needed = neededCloses(date);
  for (const fund of wanted) {
    const row = byFund[fund];
    if (typeof row !== "object" || row === null) fail(`sectors: no closes for ${fund}`);
    const got = row as Record<string, unknown>;
    const keys = Object.keys(got).sort();
    if (needed.join() !== keys.join())
      fail(`sectors: ${fund} needs closes on exactly ${needed.join(", ")}`);
    for (const d of keys) if (!isPrice(got[d])) fail(`sectors: ${fund} ${d} must be a price`);
  }
}

/** One row of the overview: a fund and its move, in percent, over each period. */
export interface SectorRow {
  readonly name: string;
  readonly fund: string;
  /** True on the S&P 500's row. */
  readonly market?: true;
  /** Percent change, close to close, rounded to two places. */
  readonly moves: Readonly<Record<SectorPeriod, number>>;
  /** AT8: the 20-day band and the close it is read against, in dollars, to two places. */
  readonly range: SectorRange;
  /** AT12 (round 8 Q4 B): the 20 closes the band is drawn from, oldest first, to two places, so a
   *  wide screen can draw them inside their band. Their dates are the view's `rangeSpan`. */
  readonly trail: readonly number[];
}

/** The 20-session Bollinger band: the average two standard deviations either side, and the close. */
export interface SectorRange {
  readonly low: number;
  readonly mid: number;
  readonly high: number;
  readonly close: number;
}

const cents = (v: number): number => Math.round(v * 100) / 100;

/** The band over `closes` (the window, oldest first) and the last of them. */
export function bollinger(closes: readonly number[]): SectorRange {
  const mid = closes.reduce((a, b) => a + b, 0) / closes.length;
  const sd = Math.sqrt(closes.reduce((a, c) => a + (c - mid) ** 2, 0) / closes.length);
  return {
    low: cents(mid - 2 * sd),
    mid: cents(mid),
    high: cents(mid + 2 * sd),
    close: cents(closes.at(-1) as number),
  };
}

/** What the page reads: the rows (the market first), each period's starting date, the source. */
export interface SectorsView {
  readonly source: string;
  readonly from: Readonly<Record<SectorPeriod, string>>;
  /** The first and last of the band's 20 sessions: the dates at the wide chart's two ends (AT12). */
  readonly rangeSpan: { readonly from: string; readonly to: string };
  readonly rows: readonly SectorRow[];
}

const pct = (now: number, then: number): number => Math.round((now / then - 1) * 10_000) / 100;

/** Work the moves out of the closes. Assumes `checkSectors` passed. */
export function sectorsView(sectors: EditionSectors, date: string): SectorsView {
  const from = sectorBases(date);
  const span = rangeDates(date);
  return {
    source: sectors.source,
    from,
    rangeSpan: { from: span[0] as string, to: span.at(-1) as string },
    rows: SECTOR_FUNDS.map((f) => {
      const c = sectors.closes[f.fund] as Readonly<Record<string, number>>;
      const close = c[date] as number;
      const moves = Object.fromEntries(
        SECTOR_PERIODS.map((p) => [p, pct(close, c[from[p]] as number)]),
      ) as Record<SectorPeriod, number>;
      const trail = span.map((d) => c[d] as number);
      return {
        name: f.name,
        fund: f.fund,
        ...(f === MARKET_FUND ? { market: true } : {}),
        moves,
        range: bollinger(trail),
        trail: trail.map(cents),
      };
    }),
  };
}
