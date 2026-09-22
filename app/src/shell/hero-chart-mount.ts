import {
  type ChartOptions,
  ColorType,
  createChart,
  type DeepPartial,
  type IChartApi,
  type LineData,
  LineSeries,
  LineStyle,
} from "lightweight-charts";
import type { ChartPalette } from "./chart-mount";
import type { OverlaySeries } from "./hero-chart-data";

/**
 * THE HERO CHART'S MOUNT (#3186 slice 2) — the one place that talks to `lightweight-charts` for
 * the accounts-page equity-vs-benchmark overlay, same split as `chart-mount.ts`: framework-free,
 * torn down and remounted fresh on any range change (`hero-chart.tsx`'s effect), never an
 * incremental update.
 *
 * Both series share ONE price scale, formatted as a percentage — they are already normalized to
 * `% return since range start` (`hero-chart-data.ts`), so there is nothing to convert here. The
 * portfolio line is solid, coloured by its OWN overall direction (`--pos`/`--neg`, real market
 * meaning — CLAUDE.md: never decorative); the benchmark is always the neutral `--muted`, dashed —
 * a reference line never implies a false up/down of its own, and shape (dashed) carries the
 * distinction a standing red/green-colourblind reader needs, not hue alone.
 */

export interface MountedHeroChart {
  readonly dispose: () => void;
}

/** `lightweight-charts`' built-in `"percent"` price format appends `%` to the value AS GIVEN — it
 *  does not scale a fraction, so a 0.03 return would draw as "0.03%" instead of "3.0%". The series
 *  in `hero-chart-data.ts` are fractions (matching the server's `EquityCurvePoint.value` contract,
 *  and easier to unit test that way), so this is the one place that ×100s them for display. */
function toPercentPoints(points: readonly LineData[]): LineData[] {
  return points.map((p) => ({ ...p, value: Number(p.value) * 100 }));
}

/** Mount the portfolio + benchmark overlay into `container`. `extra` merges over the base chart
 *  options, same escape hatch `mountBarsChart` offers for the deliberate mount smoke test. */
export function mountHeroChart(
  container: HTMLElement,
  series: OverlaySeries,
  palette: ChartPalette,
  extra: DeepPartial<ChartOptions> = {},
): MountedHeroChart {
  const { layout: extraLayout, ...extraRest } = extra;
  const chart: IChartApi = createChart(container, {
    width: container.clientWidth,
    height: container.clientHeight,
    layout: {
      background: { type: ColorType.Solid, color: "transparent" },
      textColor: palette.text,
      fontSize: 11,
      ...extraLayout,
    },
    grid: {
      vertLines: { color: palette.border, style: 1 },
      horzLines: { color: palette.border, style: 1 },
    },
    rightPriceScale: { borderColor: palette.border },
    timeScale: { borderColor: palette.border, timeVisible: false },
    ...extraRest,
  });

  const latestPortfolio = series.portfolio[series.portfolio.length - 1] as LineData | undefined;
  const portfolioUp = latestPortfolio ? Number(latestPortfolio.value) >= 0 : true;

  const portfolioSeries = chart.addSeries(LineSeries, {
    color: portfolioUp ? palette.pos : palette.neg,
    lineWidth: 2,
    priceFormat: { type: "percent" },
    lastValueVisible: true,
    priceLineVisible: false,
  });
  portfolioSeries.setData(toPercentPoints(series.portfolio));

  const benchmarkSeries = chart.addSeries(LineSeries, {
    color: palette.text,
    lineStyle: LineStyle.Dashed,
    lineWidth: 1,
    priceFormat: { type: "percent" },
    lastValueVisible: true,
    priceLineVisible: false,
    crosshairMarkerVisible: false,
  });
  benchmarkSeries.setData(toPercentPoints(series.benchmark));

  chart.timeScale().fitContent();

  const observer =
    typeof ResizeObserver === "undefined"
      ? undefined
      : new ResizeObserver((entries) => {
          const rect = entries[0]?.contentRect;
          if (rect && rect.width > 0) {
            chart.applyOptions({ width: rect.width, height: rect.height });
            chart.timeScale().fitContent();
          }
        });
  observer?.observe(container);

  return {
    dispose: () => {
      observer?.disconnect();
      chart.remove();
    },
  };
}
