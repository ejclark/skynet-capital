/**
 * THE VENUE CLOCK — which of the member's markets is awake right now, as a total function of one
 * instant. No I/O, no broker read, so it renders on a static page and tests deterministically.
 *
 * The honesty rule this module is built around is asymmetric, and deliberately so. "Closed" can be
 * asserted flatly: nothing trades on a US exchange at 3am on a Sunday, and no exchange calendar
 * changes that. "Open" cannot — a weekday inside regular hours is only *scheduled* to be open, and
 * Thanksgiving would make a flat OPEN a lie. So an open equity session is reported with
 * `certainty: "scheduled"` and the surface says so out loud; the authoritative answer is the
 * broker's own `/v2/clock` (`desk-gate.ts`), which this never pretends to be.
 *
 * Crypto is the one venue where "open" IS certain — that is the entire point of the panel this
 * feeds. `hoursPerWeek` makes the gap a number rather than a vibe: 168 against 32.5.
 */

/** The venues a Skynet desk can hold something in. */
type VenueKey = "crypto" | "us-equities";

/**
 * How much weight a status claim carries. `certain` holds no matter what the exchange calendar
 * says; `scheduled` is true of the published session and could still be a market holiday.
 */
type VenueCertainty = "certain" | "scheduled";

export interface VenueStatus {
  readonly key: VenueKey;
  /** Display name, e.g. "Crypto". */
  readonly label: string;
  readonly open: boolean;
  readonly certainty: VenueCertainty;
  /** One human line under the status — what happens next, or why it never changes. */
  readonly detail: string;
  /** Hours of the 168-hour week this venue trades. The honest size of the gap. */
  readonly hoursPerWeek: number;
}

/** Hours in a week — the denominator every `hoursPerWeek` is read against. */
export const WEEK_HOURS = 168;

/** US regular session, in minutes past ET midnight: 09:30 → 16:00. */
const SESSION_OPEN_MIN = 9 * 60 + 30;
const SESSION_CLOSE_MIN = 16 * 60;

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** ET weekday (0 = Sunday) and minutes past midnight — the whole market day is anchored on ET. */
function etNow(now: Date): { weekday: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const read = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekday = DAY_NAMES.findIndex((d) => d === read("weekday"));
  return {
    weekday: weekday < 0 ? 0 : weekday,
    minutes: Number(read("hour")) * 60 + Number(read("minute")),
  };
}

/** The next weekday the regular session is scheduled to open, as a short day name. */
function nextOpenDay(weekday: number, minutes: number): string {
  const isWeekday = weekday >= 1 && weekday <= 5;
  if (isWeekday && minutes < SESSION_OPEN_MIN) return DAY_NAMES[weekday] as string;
  for (let ahead = 1; ahead <= 7; ahead += 1) {
    const day = (weekday + ahead) % 7;
    if (day >= 1 && day <= 5) return DAY_NAMES[day] as string;
  }
  return "Mon";
}

/** The US equity/option session at this instant — the venue that keeps banker's hours. */
function equityStatus(now: Date): VenueStatus {
  const { weekday, minutes } = etNow(now);
  const inSession =
    weekday >= 1 && weekday <= 5 && minutes >= SESSION_OPEN_MIN && minutes < SESSION_CLOSE_MIN;
  return {
    key: "us-equities",
    label: "US stocks & options",
    open: inSession,
    // A closed claim survives any calendar; an open one is only the PUBLISHED session.
    certainty: inSession ? "scheduled" : "certain",
    detail: inSession
      ? "Regular session — the bell rings at 16:00 ET. Scheduled hours; a market holiday would close it early."
      : `Closed. Next scheduled open ${nextOpenDay(weekday, minutes)} 09:30 ET.`,
    hoursPerWeek: 32.5,
  };
}

/** Crypto — the only row on this board whose "open" needs no asterisk. */
function cryptoStatus(): VenueStatus {
  return {
    key: "crypto",
    label: "Crypto",
    open: true,
    certainty: "certain",
    detail: "Open. No bell, no weekend, no holidays — every hour of every day.",
    hoursPerWeek: WEEK_HOURS,
  };
}

/**
 * The board, crypto first — it leads because it is the row that is always true, and the contrast
 * with the row beneath it is the whole message.
 */
export function venueBoard(now: Date): readonly VenueStatus[] {
  return [cryptoStatus(), equityStatus(now)];
}

/** A venue's share of the week, 0–100, for the bar that makes 32.5 against 168 visible. */
export function weekSharePct(status: VenueStatus): number {
  return (status.hoursPerWeek / WEEK_HOURS) * 100;
}
