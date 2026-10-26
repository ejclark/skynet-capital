import type { LineData, Time } from "lightweight-charts";
import type { Bar } from "../live/bars";
import type { EquityCurvePoint } from "../live/equity-curve";

/**
 * The hero chart's PURE half (#3186 slice 2) — an account's equity-curve points and a symbol's
 * daily bars, both reduced to `% return since the range's own start` and aligned onto the SAME set
 * of business days, so `lightweight-charts` can draw them on one shared scale. Kept DOM-free (same
 * doctrine as `chart-data.ts`) so the alignment logic — the one genuinely fiddly part of this
 * slice — is fully unit-testable without mounting a chart.
 *
 * The two series are NOT assumed to share a start date or a trading calendar: the portfolio curve
 * and the benchmark bars come from two independent fetches. Each portfolio day looks up the
 * nearest benchmark bar AT OR BEFORE it (never after — that would leak future price into a past
 * point) rather than assuming index `i` on one array lines up with index `i` on the other.
 */

export interface OverlaySeries {
  readonly portfolio: readonly LineData[];
  readonly benchmark: readonly LineData[];
}

/** Equity-curve points and bars both carry a full ISO instant; the chart draws business days. */
export const curveDay = (t: string): string => t.slice(0, 10);

/** Bars sorted oldest-first by day, deduped to one bar per day (the feed is already daily, but
 *  never assumed). */
function daysAscending(bars: readonly Bar[]): { readonly day: string; readonly close: number }[] {
  const byDay = new Map<string, number>();
  for (const bar of bars) byDay.set(curveDay(bar.t), bar.c);
  return [...byDay.entries()]
    .map(([day, close]) => ({ day, close }))
    .sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0));
}

/** The benchmark close nearest at-or-before `day`, or `undefined` before the benchmark's own
 *  history starts. */
function closeAtOrBefore(
  sorted: readonly { readonly day: string; readonly close: number }[],
  day: string,
): number | undefined {
  let found: number | undefined;
  for (const point of sorted) {
    if (point.day > day) break;
    found = point.close;
  }
  return found;
}

/**
 * Combine one account's equity-curve points with a benchmark symbol's daily bars into two aligned
 * `% return from range start` series. The benchmark's own "start" is the bar nearest at-or-before
 * the portfolio curve's FIRST day — not the benchmark fetch's own first bar, which can land a day
 * or two earlier/later than the portfolio's own range boundary.
 */
export function alignOverlay(
  curve: readonly EquityCurvePoint[],
  benchmarkBars: readonly Bar[],
): OverlaySeries {
  const portfolio: LineData[] = curve.map((p) => ({
    time: curveDay(p.t) as Time,
    value: p.value,
  }));
  if (curve.length === 0 || benchmarkBars.length === 0) return { portfolio, benchmark: [] };

  const sorted = daysAscending(benchmarkBars);
  const firstDay = curveDay(curve[0]?.t ?? "");
  const base = closeAtOrBefore(sorted, firstDay) ?? sorted[0]?.close;
  if (base === undefined || base === 0) return { portfolio, benchmark: [] };

  const benchmark: LineData[] = [];
  for (const point of curve) {
    const day = curveDay(point.t);
    const close = closeAtOrBefore(sorted, day);
    if (close === undefined) continue;
    benchmark.push({ time: day as Time, value: close / base - 1 });
  }
  return { portfolio, benchmark };
}
