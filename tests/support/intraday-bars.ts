import type { IntradayBar } from "../../src/domain/intraday-bar.js";

/**
 * Constructed 5-minute tapes for the dip-to-bounce specs (#5489). A session is 78 flat bars of 100
 * with a one-dollar range (high = close + 0.5, low = close - 0.5) and volume 100, so the range unit
 * is exactly $1 and a one-share-volume dip bar cannot move VWAP.
 */
type Row = { close: number; open?: number; high?: number; low?: number; volume?: number };

/** One session of 78 five-minute bars from 9:30 ET; `at(minutes)` overrides a bar. */
export function session(date: string, price: number, at: Record<number, Row> = {}): IntradayBar[] {
  return Array.from({ length: 78 }, (_, i) => {
    const minutes = 570 + 5 * i;
    const row = at[minutes] ?? { close: price };
    return {
      date,
      minutes,
      open: row.open ?? row.close,
      high: row.high ?? row.close + 0.5,
      low: row.low ?? row.close - 0.5,
      close: row.close,
      volume: row.volume ?? 100,
    };
  });
}

/** A dip bar: closes 2.5 ranges under a flat $100 tape, with too little volume to move VWAP. */
export const DIP = { close: 97.5, volume: 1 };

/** A $100 session that dips at 11:10 ET (minutes 700) and sits at the dip for the rest of the day,
 *  its highs one half-range short of the $98.50 target. */
export const dipDay = (date: string, at: Record<number, Row> = {}): IntradayBar[] =>
  session(date, 100, {
    700: DIP,
    ...Object.fromEntries(
      Array.from({ length: 51 }, (_, i) => [705 + 5 * i, { close: 97.5, volume: 1 }]),
    ),
    ...at,
  });

/** Consecutive October 2026 sessions (all EDT, UTC-4). */
export const DATES = [
  "2026-10-01",
  "2026-10-02",
  "2026-10-05",
  "2026-10-06",
  "2026-10-07",
  "2026-10-08",
  "2026-10-09",
  "2026-10-12",
  "2026-10-13",
  "2026-10-14",
  "2026-10-15",
] as const;
export const day = (n: number): string => DATES[n] ?? "";

/** An ISO instant for `minutes` past midnight ET on an October 2026 `date` (EDT, UTC-4), plus
 *  `seconds` — the way a pass stamps `asOf`. */
export function etIso(date: string, minutes: number, seconds = 30): string {
  const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  return new Date(`${date}T${hh}:${mm}:${String(seconds).padStart(2, "0")}-04:00`).toISOString();
}
