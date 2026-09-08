import {
  CandlestickSeries,
  type ChartOptions,
  ColorType,
  createChart,
  type DeepPartial,
  HistogramSeries,
  type MouseEventParams,
} from "lightweight-charts";
import type { Bar } from "../live/bars";
import { barsToSeriesData, type ChartTone, indexBarsByDay, timeKey } from "./chart-data";

/**
 * The chart MOUNT (#2017 Phase 1 chart build-out, the mount slice) — the one place that talks to
 * `lightweight-charts` imperatively. Framework-free on purpose: React owns WHEN it runs (an effect
 * in `chart-section.tsx`), this owns WHAT it does, and the split means the deliberate mount smoke
 * test can drive this directly with the happy-dom `colorParsers` shim from `docs/ENGINEERING.md`
 * while the production component never carries that workaround.
 *
 * Colours are read ONCE per mount from the app's own tokens (`--pos` / `--neg`, `theme.css`) via
 * `getComputedStyle` — a real browser hands the hex back as-is, which the library parses natively.
 * The `attributionLogo` default is deliberately left alone (Apache-2.0 attribution — see the
 * ENGINEERING gotcha). Height is the CSS's call (`chart-section.css`, phone-first with the 600px
 * breakpoint adding room): the observer forwards the container's box to the chart, it never sets
 * one of its own.
 */

export interface ChartPalette extends ChartTone {
  readonly text: string;
  readonly border: string;
}

const FALLBACK: ChartPalette = {
  pos: "#3fb950",
  neg: "#f85149",
  text: "#8b9aab",
  border: "#223041",
};

/** Read the four tokens this chart draws with, falling back to the dark palette's values only when
 *  a token is genuinely absent (a stylesheet-less test document) — never overriding a real one. */
export function readChartPalette(root: HTMLElement = document.documentElement): ChartPalette {
  const style = getComputedStyle(root);
  const token = (name: string, fallback: string): string =>
    style.getPropertyValue(name).trim() || fallback;
  return {
    pos: token("--pos", FALLBACK.pos),
    neg: token("--neg", FALLBACK.neg),
    text: token("--muted", FALLBACK.text),
    border: token("--border", FALLBACK.border),
  };
}

/** Candles take the top ~75% of the pane, volume the bottom band — the standard overlay layout. */
const CANDLE_MARGINS = { top: 0.05, bottom: 0.25 };
const VOLUME_MARGINS = { top: 0.75, bottom: 0 };

export interface MountedChart {
  /** Tear the chart down: unsubscribe, disconnect the observer, `chart.remove()`. */
  readonly dispose: () => void;
}

/**
 * Mount candles + a volume overlay for `bars` into `container`, reporting the bar under the
 * crosshair through `onHover` (`undefined` when the cursor leaves the data, so the legend can fall
 * back to the latest bar). `extra` merges over the base chart options and exists for the smoke
 * test's `layout.colorParsers` shim — production passes nothing.
 */
export function mountBarsChart(
  container: HTMLElement,
  bars: readonly Bar[],
  palette: ChartPalette,
  onHover: (bar: Bar | undefined) => void,
  extra: DeepPartial<ChartOptions> = {},
): MountedChart {
  const { candles, volume } = barsToSeriesData(bars, palette);
  const byDay = indexBarsByDay(bars);
  const { layout: extraLayout, ...extraRest } = extra;
  const chart = createChart(container, {
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
    // `maxBarSpacing` only binds when there are few bars for the width (a fresh listing, a short
    // backfill): it stops a handful of days stretching into 40px slabs on a monitor. A real 180-day
    // series sits well under it at every width this app renders.
    timeScale: { borderColor: palette.border, timeVisible: false, maxBarSpacing: 24 },
    ...extraRest,
  });

  const candleSeries = chart.addSeries(CandlestickSeries, {
    upColor: palette.pos,
    downColor: palette.neg,
    wickUpColor: palette.pos,
    wickDownColor: palette.neg,
    borderUpColor: palette.pos,
    borderDownColor: palette.neg,
  });
  candleSeries.priceScale().applyOptions({ scaleMargins: CANDLE_MARGINS });
  candleSeries.setData([...candles]);

  // `priceScaleId: ""` binds the histogram to an overlay scale on the SAME pane, so the margins
  // below carve it a bottom band under the candles instead of opening a second pane.
  const volumeSeries = chart.addSeries(HistogramSeries, {
    priceScaleId: "",
    priceFormat: { type: "volume" },
    lastValueVisible: false,
    priceLineVisible: false,
  });
  volumeSeries.priceScale().applyOptions({ scaleMargins: VOLUME_MARGINS });
  volumeSeries.setData([...volume]);
  chart.timeScale().fitContent();

  const onCrosshair = (param: MouseEventParams) => {
    onHover(param.time === undefined ? undefined : byDay.get(timeKey(param.time)));
  };
  chart.subscribeCrosshairMove(onCrosshair);

  // Track the container, never a fixed width: the rail collapses, the window resizes, the CSS
  // breakpoint changes the height — the chart follows the box it was given. `fitContent` is a
  // one-shot, so it is re-applied here too: a wider box should show the same history with more
  // room per bar, not the phone-width spacing with an empty left half.
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
      chart.unsubscribeCrosshairMove(onCrosshair);
      chart.remove();
    },
  };
}
