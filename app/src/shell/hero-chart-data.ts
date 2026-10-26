import type { LineData, Time } from "lightweight-charts";
import type { Bar } from "../live/bars";
import type { EquityCurveFlow, EquityCurvePoint } from "../live/equity-curve";
import { closeHasPassed, marketDayOf } from "../live/market-session";

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

/** A recorded capital flow placed on a day the portfolio line draws (#4563). */
export interface FlowMarker {
  readonly time: Time;
  readonly direction: "added" | "removed";
  readonly label: string;
}

export interface OverlaySeries {
  readonly portfolio: readonly LineData[];
  readonly benchmark: readonly LineData[];
  /** Present only when the account has a recorded flow in this range. */
  readonly flows?: readonly FlowMarker[];
}

/**
 * Each flow on the first day the portfolio line draws WITH the capital in it, so a marker always
 * sits on the point where the jump shows — never on an earlier day, which would put the capital on
 * the line before it arrived. A daily point carries that session's end-of-day value, so the flow is
 * read in market time (the America/New_York day the row's label names): before the close it lands
 * on its own session; after the close (4:00, or 1:00 on an early close) it lands on the next one; a
 * weekend reset shows Monday. A flow newer than the curve's last point is not drawn yet — no point
 * holds the capital — and appears once the curve reaches it.
 */
export function flowMarkers(
  flows: readonly EquityCurveFlow[],
  portfolio: readonly LineData[],
): FlowMarker[] {
  const days = portfolio.map((p) => String(p.time));
  const markers: FlowMarker[] = [];
  for (const flow of flows) {
    const at = new Date(flow.t);
    const day = marketDayOf(at);
    const afterClose = closeHasPassed(day, at);
    const drawn = days.find((d) => (afterClose ? d > day : d >= day));
    if (drawn !== undefined) {
      markers.push({ time: drawn as Time, direction: flow.direction, label: flow.label });
    }
  }
  return markers;
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
  curveFlows: readonly EquityCurveFlow[] = [],
): OverlaySeries {
  const portfolio: LineData[] = curve.map((p) => ({
    time: curveDay(p.t) as Time,
    value: p.value,
  }));
  const placed = flowMarkers(curveFlows, portfolio);
  const flows = placed.length > 0 ? { flows: placed } : {};
  if (curve.length === 0 || benchmarkBars.length === 0) {
    return { portfolio, benchmark: [], ...flows };
  }

  const sorted = daysAscending(benchmarkBars);
  const firstDay = curveDay(curve[0]?.t ?? "");
  const base = closeAtOrBefore(sorted, firstDay) ?? sorted[0]?.close;
  if (base === undefined || base === 0) return { portfolio, benchmark: [], ...flows };

  const benchmark: LineData[] = [];
  for (const point of curve) {
    const day = curveDay(point.t);
    const close = closeAtOrBefore(sorted, day);
    if (close === undefined) continue;
    benchmark.push({ time: day as Time, value: close / base - 1 });
  }
  return { portfolio, benchmark, ...flows };
}
