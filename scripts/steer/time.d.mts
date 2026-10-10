// Type surface for scripts/steer/time.mjs (see scripts/moneypenny/index.d.mts).
export type Slot = "am" | "pm";

export const TZ: string;
export const PAGE_HOUR: { am: number; pm: number };
export function central(t: string | number): {
  date: string;
  hour: number;
  minute: number;
  second: number;
};
export function centralToUtc(date: string, hour: number, minute?: number): string;
export function addDays(date: string, days: number): string;
export const UNNAMED_BEFORE: number;
export function touchPoint(now: string | number): { id: string; date: string; slot: Slot };
export function nextTouchPoint(
  tp: { date: string; slot: Slot },
  now: string | number,
): { id: string; date: string; slot: Slot; at: string; hours: number; label: string };
export function previousTouchPointAt(tp: { date: string; slot: Slot }): string;
export function clockLabel(slot: Slot): string;
export function blockOf(t: string | number): {
  date: string;
  block: "day" | "night";
  late: boolean;
};
