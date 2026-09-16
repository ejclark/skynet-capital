import {
  type ChartOptions,
  ColorType,
  createChart,
  createSeriesMarkers,
  type DeepPartial,
  type IChartApi,
  type LineData,
  LineSeries,
  type Time,
} from "lightweight-charts";
import type { ThesisEquityPoint, ThesisMarker } from "../live/desk";
import type { ChartPalette } from "./chart-mount";

/**
 * THE THESIS TRACK-RECORD CHART'S MOUNT (#3186 slice 4a) — same framework-free, teardown/remount
 * doctrine as `chart-mount.ts`/`hero-chart-mount.ts`: one equity line for the bot's own account,
 * with numbered entry/exit markers from `thesisView`'s 2-zone simplification (see
 * `thesis-json-view.ts` for why this isn't the issue's full 5-zone taxonomy yet).
 *
 * Markers don't hit-test clicks on canvas coordinates — the numbered list rendered alongside the
 * chart (`thesis-drawer.tsx`) carries the real `<a href="#act-...">` links; the chart's own numbers
 * exist so a reader can find the same event by eye before clicking through.
 */

export interface MountedThesisChart {
  readonly dispose: () => void;
}

const toLineData = (points: readonly ThesisEquityPoint[]): LineData[] =>
  points.map((p) => ({ time: (Date.parse(p.t) / 1000) as Time, value: p.value }));

export function mountThesisChart(
  container: HTMLElement,
  equity: readonly ThesisEquityPoint[],
  markers: readonly ThesisMarker[],
  palette: ChartPalette,
  extra: DeepPartial<ChartOptions> = {},
): MountedThesisChart {
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

  const series = chart.addSeries(LineSeries, {
    color: palette.accent,
    lineWidth: 2,
    lastValueVisible: true,
    priceLineVisible: false,
  });
  series.setData(toLineData(equity));

  createSeriesMarkers(
    series,
    markers.map((marker) => ({
      time: (Date.parse(marker.at) / 1000) as Time,
      position: marker.kind === "exit" ? "aboveBar" : "belowBar",
      shape: marker.kind === "exit" ? "arrowDown" : "arrowUp",
      color: marker.kind === "exit" ? palette.neg : palette.pos,
      id: marker.activityAnchor,
      text: String(marker.n),
    })),
  );

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
