import { cachedDateTimeFormat } from "./intl-format.js";
import { MARKET_TIMEZONE } from "./market-day.js";

/**
 * An instant on the exchange's wall clock: its ET `YYYY-MM-DD` and minutes past midnight. The one
 * place a bar's UTC timestamp (or a cycle's `asOf`) becomes the (date, minutes) pair an intraday
 * rule is written in. Total: an unparseable instant answers `undefined`, never a made-up time.
 */
export function etWall(
  at: number,
): { readonly date: string; readonly minutes: number } | undefined {
  if (!Number.isFinite(at)) return undefined;
  const parts = cachedDateTimeFormat("en-CA", {
    timeZone: MARKET_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(at));
  const get = (type: string): string => parts.find((p) => p.type === type)?.value ?? "";
  const hour = Number(get("hour"));
  const minute = Number(get("minute"));
  if (Number.isNaN(hour) || Number.isNaN(minute)) return undefined;
  return { date: `${get("year")}-${get("month")}-${get("day")}`, minutes: hour * 60 + minute };
}
