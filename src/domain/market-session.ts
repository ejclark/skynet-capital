/**
 * The regular NYSE session as a pure clock — 9:30 AM to 4:00 PM Eastern, Monday through Friday,
 * minus the exchange holidays and 1:00 PM early closes in `market-calendar.ts`. Used where a
 * sentence or a liveness check needs to know whether the market is open without a broker round
 * trip. The desk's own gate (`src/server/desk-gate.ts`) still asks Alpaca before any order.
 * Mirrors the shell's `app/src/live/market-hours.ts` (which does not yet read the calendar).
 */
import { MARKET_CLOSURES } from "./market-calendar.js";

const OPEN_MINUTES = 9 * 60 + 30;
const CLOSE_MINUTES = 16 * 60;
const EARLY_CLOSE_MINUTES = 13 * 60;

/** True during the regular session on a trading day, judged in New York time. */
export function regularSessionOpen(now: Date = new Date()): boolean {
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = et.getDay();
  if (day === 0 || day === 6) return false;
  const date = `${et.getFullYear()}-${String(et.getMonth() + 1).padStart(2, "0")}-${String(et.getDate()).padStart(2, "0")}`;
  const closure = MARKET_CLOSURES.find((c) => c.date === date);
  if (closure && !closure.early) return false;
  const minutes = et.getHours() * 60 + et.getMinutes();
  const close = closure?.early ? EARLY_CLOSE_MINUTES : CLOSE_MINUTES;
  return minutes >= OPEN_MINUTES && minutes < close;
}

export const SESSION_HOURS_LABEL = "9:30 AM–4:00 PM ET, Monday through Friday";
