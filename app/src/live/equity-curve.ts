/**
 * The hero chart's client model (#3186 slice 2) — the REST twin of
 * `src/observatory/equity-curve-json-view.ts`. Same doctrine as `bars.ts`: the client renders what
 * the server said, verbatim; an empty `points` array is a real answer (no history for this
 * range/account), never read as a failure.
 */

export const EQUITY_CURVE_RANGES = ["7D", "1M", "3M", "1Y", "YTD", "ALL"] as const;
export type EquityCurveRange = (typeof EQUITY_CURVE_RANGES)[number];

export interface EquityCurvePoint {
  readonly t: string;
  /** Return since the range's own start, as a fraction (0.052 = +5.2%). */
  readonly value: number;
}

export interface EquityCurve {
  readonly range: EquityCurveRange;
  readonly points: readonly EquityCurvePoint[];
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return (await res.json()) as T;
}

export const fetchEquityCurve = (
  accountId: string,
  range: EquityCurveRange,
): Promise<EquityCurve> =>
  getJson(
    `/api/accounts/${encodeURIComponent(accountId)}/equity-curve?range=${encodeURIComponent(range)}`,
  );

/** How many calendar days of SPY bars to backfill for a given range — matched generously to the
 *  range so the benchmark line never runs shorter than the portfolio's own curve. `bars.ts`'s
 *  server clamps at 1825 days regardless, which is also this module's ceiling for "ALL". */
export function daysFor(range: EquityCurveRange, now: Date = new Date()): number {
  switch (range) {
    case "7D":
      return 7;
    case "1M":
      return 31;
    case "3M":
      return 93;
    case "1Y":
      return 366;
    case "YTD": {
      const jan1 = Date.UTC(now.getUTCFullYear(), 0, 1);
      return Math.max(1, Math.ceil((now.getTime() - jan1) / (24 * 60 * 60 * 1000)) + 1);
    }
    case "ALL":
      return 1825;
  }
}
