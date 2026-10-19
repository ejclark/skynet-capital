import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { fetchBars } from "../live/bars";
import {
  daysFor,
  EQUITY_CURVE_RANGES,
  type EquityCurveRange,
  fetchEquityCurve,
} from "../live/equity-curve";
import { percentTone, signedPercent } from "../ui";
import { readChartPalette } from "./chart-mount";
import { alignOverlay, type FlowMarker, type OverlaySeries } from "./hero-chart-data";
import { type HighLine, mountHeroChart } from "./hero-chart-mount";

/**
 * THE HERO CHART (#3186 slice 2) — the account's equity curve against an S&P 500 benchmark, with a
 * range selector (7D/1M/3M/1Y/YTD/ALL) that re-fetches and re-scales both series together. Lives in
 * the Summary section body, one account at a time (the "All accounts" aggregate keeps the roster
 * table for this slice — summing per-account curves is real work, deliberately not bundled here).
 *
 * Two independent fetches (the account's own curve, SPY's daily bars) combine in `hero-chart-data`'s
 * pure `alignOverlay` before anything is drawn — same split as `/trade`'s chart: the DOM-touching
 * mount stays a thin, framework-free layer (`hero-chart-mount.ts`), React only owns when it runs.
 */

const BENCHMARK_SYMBOL = "SPY";

/** The legend's change since the range began, a fraction written as a signed percent (#5204), and
 *  toned from that same printed figure, so a move that reads "0.0%" is never coloured a loss. */
const LEGEND_DIGITS = 1;
const pct = (value: number): string => signedPercent(value * 100, LEGEND_DIGITS);
const tone = (value: number): "pos" | "neg" | "flat" => percentTone(value * 100, LEGEND_DIGITS);

/** Exported for its spec only — the chart mount itself can't run under happy-dom. */
export function HeroChartLegend({
  overlay,
  high,
}: {
  readonly overlay: OverlaySeries;
  readonly high?: HighLine;
}): ReactElement | null {
  const lastPortfolio = overlay.portfolio[overlay.portfolio.length - 1];
  const lastBenchmark = overlay.benchmark[overlay.benchmark.length - 1];
  if (!lastPortfolio) return null;
  return (
    <p className="hero-chart-legend num" aria-live="polite">
      <span className="hero-chart-legend-cell">
        <span className="hero-chart-legend-swatch hero-chart-legend-swatch--portfolio" />
        You{" "}
        <b className={`tone-${tone(Number(lastPortfolio.value))}`}>
          {pct(Number(lastPortfolio.value))}
        </b>
      </span>
      {lastBenchmark ? (
        <span className="hero-chart-legend-cell">
          <span className="hero-chart-legend-swatch hero-chart-legend-swatch--benchmark" />
          S&amp;P 500 <b>{pct(Number(lastBenchmark.value))}</b>
        </span>
      ) : null}
      {high ? (
        <span className="hero-chart-legend-cell hero-chart-legend-high">
          <span className="hero-chart-legend-swatch hero-chart-legend-swatch--high" />
          {high.label}
        </span>
      ) : null}
    </p>
  );
}

/** The curve's recorded capital flows, named under the chart (#4563): the canvas marker only says
 *  where; this says how much, that it is not a gain, and that we inferred it. Exported for its spec. */
export function HeroChartFlows({
  flows,
}: {
  readonly flows: readonly FlowMarker[] | undefined;
}): ReactElement | null {
  if (!flows || flows.length === 0) return null;
  return (
    <div className="hero-chart-flows">
      <ul>
        {flows.map((flow) => (
          <li key={`${String(flow.time)}:${flow.label}`}>
            <span className="hero-chart-flow-glyph" aria-hidden="true">
              ■
            </span>
            {flow.label}
          </li>
        ))}
      </ul>
      <p className="note">
        A balance change with no trade to explain it — inferred from our own records, not reported
        by the broker.
      </p>
    </div>
  );
}

/** Mounted only once there's an overlay to draw — torn down and remounted fresh whenever the
 *  aligned series changes (a new range fetched both series anew). */
function HeroChartCanvas({
  overlay,
  high,
}: {
  readonly overlay: OverlaySeries;
  readonly high?: HighLine;
}): ReactElement {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = container.current;
    if (!el) return;
    const mounted = mountHeroChart(el, overlay, readChartPalette(), {}, high);
    return () => mounted.dispose();
  }, [overlay, high]);

  return (
    <>
      <HeroChartLegend overlay={overlay} high={high} />
      <div ref={container} className="hero-chart-canvas" />
      <HeroChartFlows flows={overlay.flows} />
    </>
  );
}

export function HeroChart({
  accountId,
  high,
}: {
  readonly accountId: string;
  /** The all-time-high reference line (#3689); omitted when the account's history is unknown. */
  readonly high?: HighLine;
}): ReactElement {
  const [range, setRange] = useState<EquityCurveRange>("1M");

  const curve = useQuery({
    queryKey: ["equity-curve", accountId, range],
    queryFn: () => fetchEquityCurve(accountId, range),
  });
  const benchmark = useQuery({
    queryKey: ["bars", BENCHMARK_SYMBOL, range],
    queryFn: () => fetchBars(BENCHMARK_SYMBOL, daysFor(range)),
  });

  const rangeSelect = (
    <fieldset className="hero-chart-range">
      <legend className="visually-hidden">Chart range</legend>
      {EQUITY_CURVE_RANGES.map((r) => (
        <button
          key={r}
          type="button"
          className={r === range ? "hero-chart-range-btn is-active" : "hero-chart-range-btn"}
          aria-pressed={r === range}
          onClick={() => setRange(r)}
        >
          {r}
        </button>
      ))}
    </fieldset>
  );

  let body: ReactElement;
  if (curve.isPending || benchmark.isPending) {
    body = <p className="note">Loading the chart…</p>;
  } else if (curve.isError) {
    body = <p className="note">Net worth history is unreachable right now.</p>;
  } else if (curve.data.points.length === 0) {
    body = <p className="note">No net worth history for this range yet.</p>;
  } else {
    const bars = benchmark.data && "bars" in benchmark.data ? benchmark.data.bars : [];
    const overlay = alignOverlay(curve.data.points, bars, curve.data.flows);
    body = <HeroChartCanvas overlay={overlay} high={high} />;
  }

  return (
    <section className="hero-chart" aria-label="Net worth vs S&P 500">
      {rangeSelect}
      {body}
    </section>
  );
}
