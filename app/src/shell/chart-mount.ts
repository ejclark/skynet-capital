import {
  CandlestickSeries,
  type ChartOptions,
  ColorType,
  createChart,
  type DeepPartial,
  HistogramSeries,
  type IChartApi,
  type LineData,
  LineSeries,
  type LineSeriesPartialOptions,
  LineStyle,
  type MouseEventParams,
} from "lightweight-charts";
import type { Bar } from "../live/bars";
import { barsToSeriesData, type ChartTone, indexBarsByDay, timeKey } from "./chart-data";
import { bollingerPoints, linePoints, type StudyId, type StudySeries } from "./chart-studies";

/**
 * The chart MOUNT (#2017 Phase 1 chart build-out, the mount slice) — the one place that talks to
 * `lightweight-charts` imperatively. Framework-free on purpose: React owns WHEN it runs (an effect
 * in `chart-section.tsx`), this owns WHAT it does, and the split means the deliberate mount smoke
 * test can drive this directly with the happy-dom `colorParsers` shim from `docs/ENGINEERING.md`
 * while the production component never carries that workaround.
 *
 * Colours are read ONCE per mount from the app's own tokens (`--pos` / `--neg` / `--accent`,
 * `theme.css`) via `getComputedStyle` — a real browser hands the hex back as-is, which the library
 * parses natively. The `attributionLogo` default is deliberately left alone (Apache-2.0
 * attribution — see the ENGINEERING gotcha). Height is the CSS's call (`chart-section.css`,
 * phone-first with the 600px breakpoint adding room, and `.has-rsi` adding the second pane's):
 * the observer forwards the container's box to the chart, it never sets one of its own.
 *
 * THE STUDIES (the studies slice). Hue already means exactly one thing on this chart — up/down on
 * a candle or a volume bar — so every study line draws in `--accent` and is told apart by SHAPE:
 * solid vs dashed vs dotted, heavy vs light (`docs/BRAND.md` → Accessibility; a standing reader is
 * red/green colourblind). SMA/EMA/Bollinger are dollar-denominated and share the candles' price
 * scale on pane 0; RSI is a 0-100 reading and gets its own pane 1, with 70/30 reference lines in
 * the neutral `--muted` — a level to read against, never an up/down signal. Toggling a study
 * re-mounts the whole chart (`chart-section.tsx`), so pane 1 exists exactly when RSI is on and
 * there is no add/remove state machine to get wrong.
 */

export interface ChartPalette extends ChartTone {
  readonly text: string;
  readonly border: string;
  readonly accent: string;
}

const FALLBACK: ChartPalette = {
  pos: "#3fb950",
  neg: "#f85149",
  text: "#8b9aab",
  border: "#223041",
  accent: "#35d0ba",
};

/** Read the five tokens this chart draws with, falling back to the dark palette's values only when
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
    accent: token("--accent", FALLBACK.accent),
  };
}

/** Candles take the top ~75% of the pane, volume the bottom band — the standard overlay layout. */
const CANDLE_MARGINS = { top: 0.05, bottom: 0.25 };
const VOLUME_MARGINS = { top: 0.75, bottom: 0 };

/** RSI is a supporting view, not equal billing: with the container grown by `.has-rsi`, its pane
 *  takes this share and the price + volume pane keeps the rest. */
const RSI_PANE_SHARE = 0.28;
const RSI_OVERBOUGHT = 70;
const RSI_OVERSOLD = 30;

/** Which studies are on, and the series `chart-section.tsx` already computed for them — this layer
 *  only maps and draws, never recomputes. */
export interface StudyLayer {
  readonly active: ReadonlySet<StudyId>;
  readonly series: StudySeries;
}

export interface MountedChart {
  /** Tear the chart down: unsubscribe, disconnect the observer, `chart.remove()`. */
  readonly dispose: () => void;
  /** How many panes the mount opened — 2 exactly when RSI is on, else 1. */
  readonly paneCount: number;
}

/** A study line, quiet by default: no last-value label or price line crowding the axis, no
 *  crosshair marker competing with the candle under it. Shape and weight are the caller's. */
const studyLine = (
  color: string,
  lineStyle: LineStyle,
  lineWidth: 1 | 2,
): LineSeriesPartialOptions => ({
  color,
  lineStyle,
  lineWidth,
  lastValueVisible: false,
  priceLineVisible: false,
  crosshairMarkerVisible: false,
});

function addStudyLine(
  chart: IChartApi,
  points: readonly LineData[],
  options: LineSeriesPartialOptions,
  paneIndex = 0,
) {
  const series = chart.addSeries(LineSeries, options, paneIndex);
  series.setData([...points]);
  return series;
}

/** The dollar-denominated overlays, on the candles' own pane and price scale. */
function mountOverlays(
  chart: IChartApi,
  bars: readonly Bar[],
  palette: ChartPalette,
  { active, series }: StudyLayer,
): void {
  if (active.has("sma")) {
    addStudyLine(
      chart,
      linePoints(bars, series.sma),
      studyLine(palette.accent, LineStyle.Solid, 2),
    );
  }
  if (active.has("ema")) {
    addStudyLine(
      chart,
      linePoints(bars, series.ema),
      studyLine(palette.accent, LineStyle.Dashed, 2),
    );
  }
  if (active.has("bollinger")) {
    const { upper, middle, lower } = bollingerPoints(bars, series.bollinger);
    // Three light lines so the bands read as a range around the price, not three rivals to SMA/EMA.
    addStudyLine(chart, middle, studyLine(palette.accent, LineStyle.Solid, 1));
    addStudyLine(chart, upper, studyLine(palette.accent, LineStyle.Dotted, 1));
    addStudyLine(chart, lower, studyLine(palette.accent, LineStyle.Dotted, 1));
  }
}

/** RSI on its own pane (index 1) with the 70 / 30 reference lines — neutral colour, dashed, and
 *  labelled on the axis so the level is a number as well as a line. */
function mountRsiPane(
  chart: IChartApi,
  container: HTMLElement,
  bars: readonly Bar[],
  palette: ChartPalette,
  values: StudySeries["rsi"],
): void {
  const rsiSeries = addStudyLine(
    chart,
    linePoints(bars, values),
    { ...studyLine(palette.accent, LineStyle.Solid, 1), lastValueVisible: true },
    1,
  );
  for (const price of [RSI_OVERBOUGHT, RSI_OVERSOLD]) {
    rsiSeries.createPriceLine({
      price,
      color: palette.text,
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: "",
    });
  }
  // `setHeight` fixes the pane's share of the box the observer keeps forwarding; a zero-height
  // container (a stylesheet-less test document) is left to the library's own split.
  const rsiPane = chart.panes()[1];
  if (rsiPane && container.clientHeight > 0) {
    rsiPane.setHeight(Math.round(container.clientHeight * RSI_PANE_SHARE));
  }
}

/**
 * Mount candles + a volume overlay for `bars` into `container`, plus whichever `studies` are on,
 * reporting the bar under the crosshair through `onHover` (`undefined` when the cursor leaves the
 * data, so the legend can fall back to the latest bar). `extra` merges over the base chart options
 * and exists for the smoke test's `layout.colorParsers` shim — production passes nothing.
 */
export function mountBarsChart(
  container: HTMLElement,
  bars: readonly Bar[],
  palette: ChartPalette,
  onHover: (bar: Bar | undefined) => void,
  studies: StudyLayer | undefined = undefined,
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
      // The RSI pane's divider, in the same rule the grid draws with; the split is the mount's
      // call (`RSI_PANE_SHARE`), never a drag handle.
      panes: {
        separatorColor: palette.border,
        separatorHoverColor: palette.border,
        enableResize: false,
      },
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

  if (studies) {
    mountOverlays(chart, bars, palette, studies);
    if (studies.active.has("rsi"))
      mountRsiPane(chart, container, bars, palette, studies.series.rsi);
  }
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
    paneCount: chart.panes().length,
    dispose: () => {
      observer?.disconnect();
      chart.unsubscribeCrosshairMove(onCrosshair);
      chart.remove();
    },
  };
}
