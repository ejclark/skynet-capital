// STEER CLOCK — which touch point a moment belongs to, in Central time (#5056).
//
// Eric works about 8–4 Central, so a touch point is named by its Central date and half of the
// day: `2026-10-10-am` is the morning page, `2026-10-10-pm` the evening one. The name is also the
// round key every saved record hangs under (`tp/<id>/…`), so two pages can never share a record.
// CDT becomes CST on 2026-11-01; every conversion goes through Intl with the zone named, never a
// fixed offset, so the switch moves nothing here.
//
// Pure: no clock is read. Callers pass `now` (an ISO string or epoch ms).

export const TZ = "America/Chicago";
/** The nominal hour (Central) each page opens at; the gap between them sizes the queue. */
export const PAGE_HOUR = { am: 8, pm: 16 };

const PARTS = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

const ms = (t) => (typeof t === "number" ? t : Date.parse(t));

/** Central wall-clock parts of an instant: `{ date: "YYYY-MM-DD", hour, minute }`. */
export function central(t) {
  const at = ms(t);
  if (Number.isNaN(at)) throw new Error(`steer/time: not a time: ${t}`);
  const p = Object.fromEntries(PARTS.formatToParts(new Date(at)).map((x) => [x.type, x.value]));
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    hour: Number(p.hour),
    minute: Number(p.minute),
    second: Number(p.second),
  };
}

/** The UTC instant (ISO) of a Central wall-clock time on `date`. DST-correct for any date. */
export function centralToUtc(date, hour, minute = 0) {
  const [y, m, d] = date.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d, hour, minute);
  const wall = central(guess);
  const [wy, wm, wd] = wall.date.split("-").map(Number);
  const offset = Date.UTC(wy, wm - 1, wd, wall.hour, wall.minute) - guess;
  return new Date(guess - offset).toISOString().replace(/\.\d{3}Z$/, "Z");
}

/** Shift a `YYYY-MM-DD` by whole days (calendar arithmetic, no zone involved). */
export function addDays(date, days) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** The touch point `now` falls in: before noon Central is the morning page, after is the evening. */
export function touchPoint(now) {
  const { date, hour } = central(now);
  const slot = hour < 12 ? "am" : "pm";
  return { id: `${date}-${slot}`, date, slot };
}

/** The page after this one — when it opens, and how many hours of building lie between. */
export function nextTouchPoint({ date, slot }, now) {
  const next = slot === "am" ? { date, slot: "pm" } : { date: addDays(date, 1), slot: "am" };
  const at = centralToUtc(next.date, PAGE_HOUR[next.slot]);
  const hours = Math.max(0, Math.round((Date.parse(at) - ms(now)) / 36e5));
  return { ...next, id: `${next.date}-${next.slot}`, at, hours, label: clockLabel(next.slot) };
}

/** The nominal open time of the page before this one: the reel's start when no Done is known. */
export function previousTouchPointAt({ date, slot }) {
  return slot === "am"
    ? centralToUtc(addDays(date, -1), PAGE_HOUR.pm)
    : centralToUtc(date, PAGE_HOUR.am);
}

/** "8am" / "4pm" — how the page names the next touch point. */
export const clockLabel = (slot) => (slot === "am" ? "8am" : "4pm");

/** Which block of the day a merge landed in, by Central hour: the page's own two windows. */
export function blockOf(t) {
  const { date, hour } = central(t);
  if (hour >= PAGE_HOUR.am && hour < PAGE_HOUR.pm) return { date, block: "day", late: false };
  // A night runs 16:00 → 08:00 and belongs to the date it started on.
  const night = hour < PAGE_HOUR.am ? addDays(date, -1) : date;
  return { date: night, block: "night", late: hour >= 23 || hour < PAGE_HOUR.am };
}
