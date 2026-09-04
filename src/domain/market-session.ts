/**
 * The regular NYSE session as a pure clock — 9:30 AM to 4:00 PM Eastern, Monday through Friday.
 * Used where a sentence needs to know whether the market is open right now (Moneypenny's steer:
 * "the market is open right now" vs. "closed — schedule it and it fills at the open") without a
 * broker round trip. The desk's own gate (`src/server/desk-gate.ts`) still asks Alpaca before any
 * order, so a holiday this clock doesn't know about costs a sentence, never a fill. Mirrors the
 * shell's `app/src/live/market-hours.ts`.
 */

const OPEN_MINUTES = 9 * 60 + 30;
const CLOSE_MINUTES = 16 * 60;

/** True during the regular session on a weekday, judged in New York time. */
export function regularSessionOpen(now: Date = new Date()): boolean {
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = et.getDay();
  if (day === 0 || day === 6) return false;
  const minutes = et.getHours() * 60 + et.getMinutes();
  return minutes >= OPEN_MINUTES && minutes < CLOSE_MINUTES;
}

export const SESSION_HOURS_LABEL = "9:30 AM–4:00 PM ET, Monday through Friday";
