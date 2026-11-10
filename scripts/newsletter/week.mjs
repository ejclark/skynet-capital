// The newsletter's calendar (#6872): ISO weeks, the window a run reads, and which cadences fall due.
//
// THE WEEK IS AN ISO WEEK IN UTC, Monday 00:00Z to the next Monday 00:00Z. The newsletter posts on
// Sunday at 18:00 CT, and from 2026-11-01 Central time is UTC-6, so that post time IS Monday 00:00Z:
// the week closes the moment the issue goes out, and no merge lands in two newsletters. (In summer,
// CDT, the post falls an hour before the week closes; that hour belongs to the week it is in.)
//
// A run before the week ends reads up to its `asOf` and says `partial`, so a mid-week reading can
// never pass for the whole week's numbers.

const DAY = 86400000;
const WEEK = 7 * DAY;
const WEEK_RE = /^(\d{4})-W(\d{2})$/;

/** The week the plan's first newsletter covers. "Every two weeks" counts from it, so it is fixed. */
export const CADENCE_ANCHOR = "2026-W45";

/** Monday 00:00Z of ISO week 1: the Monday on or before 4 January. */
function weekOneMonday(year) {
  const jan4 = Date.UTC(year, 0, 4);
  return jan4 - ((new Date(jan4).getUTCDay() + 6) % 7) * DAY;
}

/** 52 or 53: a year whose 28 December falls in week 53 has one. */
function weeksIn(year) {
  return Math.round((weekOneMonday(year + 1) - weekOneMonday(year)) / WEEK);
}

const isoDate = (ms) => new Date(ms).toISOString().slice(0, 10);

/** `2026-W45` → its bounds. A week that does not exist throws: a run for it would read nothing. */
export function parseWeek(text) {
  const m = WEEK_RE.exec(String(text ?? ""));
  if (!m) throw new Error(`--week needs YYYY-Www, got "${text}"`);
  const year = Number(m[1]);
  const num = Number(m[2]);
  if (num < 1 || num > weeksIn(year)) throw new Error(`${text} is not a week of ${year}`);
  const startMs = weekOneMonday(year) + (num - 1) * WEEK;
  return {
    week: text,
    startMs,
    endMs: startMs + WEEK,
    start: isoDate(startMs),
    end: isoDate(startMs + WEEK),
  };
}

/** The ISO week a moment falls in. */
export function weekOf(ms) {
  const monday = Math.floor(ms / DAY) * DAY - ((new Date(ms).getUTCDay() + 6) % 7) * DAY;
  // The ISO year is the year of the week's Thursday.
  const year = new Date(monday + 3 * DAY).getUTCFullYear();
  const num = Math.round((monday - weekOneMonday(year)) / WEEK) + 1;
  return `${year}-W${String(num).padStart(2, "0")}`;
}

export const previousWeek = (week) => weekOf(parseWeek(week).startMs - DAY);

/**
 * The window a run reads: the week, cut at `asOfMs` when the week has not ended. A run dated
 * before the week began reads nothing and says so rather than reading another week.
 */
export function windowOf(week, asOfMs) {
  const w = parseWeek(week);
  if (!Number.isFinite(asOfMs)) throw new Error("windowOf needs an asOf time");
  if (asOfMs <= w.startMs) throw new Error(`${week} has not started at ${isoDate(asOfMs)}`);
  const untilMs = Math.min(w.endMs, asOfMs);
  return {
    ...w,
    sinceMs: w.startMs,
    untilMs,
    since: new Date(w.startMs).toISOString(),
    until: new Date(untilMs).toISOString(),
    partial: untilMs < w.endMs,
  };
}

/** A registry Cadence cell → `weekly` · `every two weeks` · `monthly`, or null when unreadable. */
export function cadenceOf(cell) {
  const text = String(cell ?? "")
    .toLowerCase()
    .replace(/[*_`]/g, "")
    .trim();
  if (/^weekly\b/.test(text)) return "weekly";
  if (/^(every two weeks|every 2 weeks|biweekly|fortnightly)\b/.test(text))
    return "every two weeks";
  if (/^monthly\b/.test(text)) return "monthly";
  return null;
}

/**
 * Does a cadence fall due in this week? Weekly: every week. Every two weeks: the anchor week and
 * every second week after it (and before it). Monthly: the week holding the month's first Monday,
 * so each month has exactly one.
 */
export function isDue(cadence, week) {
  const { startMs } = parseWeek(week);
  if (cadence === "weekly") return true;
  if (cadence === "every two weeks") {
    const apart = Math.round((startMs - parseWeek(CADENCE_ANCHOR).startMs) / WEEK);
    return ((apart % 2) + 2) % 2 === 0;
  }
  if (cadence === "monthly") return new Date(startMs).getUTCDate() <= 7;
  return false;
}

/** How many weeks `later` falls after `earlier`; 0 for the same week. */
export function weeksBetween(earlier, later) {
  return Math.round((parseWeek(later).startMs - parseWeek(earlier).startMs) / WEEK);
}
