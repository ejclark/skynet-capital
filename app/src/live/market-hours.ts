/**
 * Market hours, on the client — the regular NYSE session (9:30 AM – 4:00 PM ET, weekdays) as the
 * two facts the onboarding surfaces need: whether it's open RIGHT NOW (Moneypenny's first-trade
 * steer says "open right now" vs. "closed — schedule it and it fills at the open") and the
 * viewer's LOCAL equivalent of the session window (step 3's note reads "9:30 AM to 4:00 PM ET
 * (6:30 AM – 1:00 PM PDT)" to a Californian, and nothing extra to a New Yorker).
 *
 * This mirrors the prototype's `marketIsOpen()` rather than asking the broker: the desk's own
 * gate (`src/server/desk-gate.ts`) still asks Alpaca before any order, so a holiday this clock
 * doesn't know about costs a sentence, never a fill. Both functions take `now` so specs can pin
 * the clock; both swallow Intl failures into the harmless answer.
 */

const OPEN_MINUTES = 9 * 60 + 30;
const CLOSE_MINUTES = 16 * 60;
const ET = "America/New_York";

/** The wall clock in New York for `now`, as a Date whose local fields read ET. */
function easternClock(now: Date): Date {
  return new Date(now.toLocaleString("en-US", { timeZone: ET }));
}

/** True during the regular session, Monday–Friday. Unknown (an Intl failure) reads as open. */
export function marketIsOpen(now = new Date()): boolean {
  try {
    const et = easternClock(now);
    const day = et.getDay();
    if (day === 0 || day === 6) return false;
    const minutes = et.getHours() * 60 + et.getMinutes();
    return minutes >= OPEN_MINUTES && minutes < CLOSE_MINUTES;
  } catch {
    return true;
  }
}

/**
 * " (6:30 AM–1:00 PM PDT)" for a viewer outside Eastern time, "" for one inside it (or when the
 * zone can't be read) — appended verbatim after "4:00 PM ET" in the first-trade note.
 */
export function localSessionSuffix(now = new Date(), timeZone?: string): string {
  try {
    const opts = timeZone ? { timeZone } : {};
    const zone = new Intl.DateTimeFormat("en-US", { ...opts, timeZoneName: "short" })
      .formatToParts(now)
      .find((p) => p.type === "timeZoneName")?.value;
    if (!zone || zone === "EDT" || zone === "EST") return "";
    const offsetMs = now.getTime() - easternClock(now).getTime(); // viewer-zone minus ET
    const at = (h: number, m: number) => {
      const target = new Date(now);
      target.setHours(h, m, 0, 0);
      return new Date(target.getTime() + offsetMs).toLocaleTimeString("en-US", {
        ...opts,
        hour: "numeric",
        minute: "2-digit",
      });
    };
    return ` (${at(9, 30)}–${at(16, 0)} ${zone})`;
  } catch {
    return "";
  }
}
