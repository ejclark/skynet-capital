import type { AlpacaPortfolioHistory } from "../alpaca/alpaca-trading-client.js";

/**
 * THE HERO CHART'S DATA — `/api/accounts/:id/equity-curve` (#3186 slice 2).
 *
 * One account's equity, reduced to a % return series from the range's own start (`base_value`,
 * Alpaca's flow-adjusted starting point — never a locally-differenced guess a deposit would
 * distort). Normalized to % rather than dollars because the client overlays this against an S&P
 * 500 series on the same axis, and a $128k portfolio isn't comparable to a ~$580 share price in
 * raw dollars. A `null` equity entry (Alpaca's honest "no value for this span") is skipped, never
 * zero-filled — a gap in the line is truer than a fabricated flat spot.
 */

export type EquityCurveRange = "7D" | "1M" | "3M" | "1Y" | "YTD" | "ALL";

export const EQUITY_CURVE_RANGES: readonly EquityCurveRange[] = [
  "7D",
  "1M",
  "3M",
  "1Y",
  "YTD",
  "ALL",
];

export interface EquityCurvePoint {
  /** ISO-8601 instant. */
  readonly t: string;
  /** Return since the range's own start, as a fraction (0.052 = +5.2%). */
  readonly value: number;
}

export interface EquityCurveView {
  readonly points: readonly EquityCurvePoint[];
}

export function equityCurveView(history: AlpacaPortfolioHistory | undefined): EquityCurveView {
  const base = history?.base_value;
  if (typeof base !== "number" || !Number.isFinite(base) || base <= 0) return { points: [] };

  const points: EquityCurvePoint[] = [];
  const timestamps = history?.timestamp ?? [];
  const equity = history?.equity ?? [];
  for (let i = 0; i < timestamps.length; i++) {
    const ts = timestamps[i];
    const eq = equity[i];
    if (typeof ts !== "number" || typeof eq !== "number" || !Number.isFinite(eq)) continue;
    points.push({ t: new Date(ts * 1000).toISOString(), value: eq / base - 1 });
  }
  return { points };
}
