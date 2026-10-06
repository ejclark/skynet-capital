/**
 * "Today", else "Sep 18" — an option lifecycle event's DAY, never a clock time, and read in UTC.
 * Shared by the Orders pane's lifecycle card and Activity's lifecycle rows (#4650), so both date an
 * expiry or an assignment the same way.
 *
 * Both halves of that are corrections of the obvious version. A lifecycle activity usually carries
 * a DATE with no time of day, which `parseLifecycleActivity` normalizes to the last instant of that
 * day so it sorts after the fills it closes (`option-lifecycle.ts`). Rendering that stamp as a time
 * would print "11:59 PM" — a time the event never had, and one still in the future for most of the
 * day. Rendering it in the browser's own zone would date a 18 Sep expiry "Sep 19" for every member
 * east of UTC, which is a false claim about a settlement date rather than a formatting nicety.
 */
export function lifecycleDayText(at: string, now: Date): string {
  const stamp = new Date(at);
  if (Number.isNaN(stamp.getTime())) return at;
  const day = (d: Date) => d.toISOString().slice(0, 10);
  return day(stamp) === day(now)
    ? "Today"
    : stamp.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
}
