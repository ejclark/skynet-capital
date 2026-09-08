import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { type Bar, fetchBars } from "../live/bars";
import { barTime, compactVolume } from "./chart-data";
import { mountBarsChart, readChartPalette } from "./chart-mount";
import {
  computeStudies,
  indexStudiesByDay,
  STUDY_IDS,
  STUDY_LABELS,
  type StudyId,
  type StudyReading,
  studyCell,
  toggleStudy,
} from "./chart-studies";
import { StudyToggles } from "./study-toggle";

/**
 * THE CHART SECTION (#2017 Phase 1 chart build-out, the mount slice + the studies slice) — daily
 * candles with a volume band for the ticket's committed `?symbol=`, the `/trade` page's second
 * SECTION beside the ticket (`section-switch.tsx`, #1740's three-word rule: a different shape of
 * data on the same page), with the four canned studies (SMA · EMA · Bollinger · RSI,
 * `src/indicators/`) layered on by toggle.
 *
 * Three honest states, never conflated (`bars.ts`'s doctrine, the same one `quote-header.tsx`
 * holds for quotes): a `barsNote` is rendered VERBATIM (the server said why); an empty `bars`
 * array is a real answer (the feed had nothing for the window), not a failure; anything else
 * mounts the chart. No symbol yet is the section's own empty state — the symbol is picked on the
 * Ticket section and travels here through the URL, so there is no second input to keep in sync.
 *
 * A standing reader is red/green colourblind (CLAUDE.md), so the candle hue is SUPPLEMENTARY: the
 * legend above the canvas reads the bar under the crosshair — date · O · H · L · C · Vol, then a
 * cell per active study — as plain text, defaulting to the latest bar and falling back to it when
 * the cursor leaves the chart. Every real platform draws this line; here it is also the "word" the
 * house rule requires.
 *
 * Studies default OFF and live in component state, never the URL: a member who never touches the
 * toggles sees the base chart exactly as before, and reopening the section lands there again. A
 * toggle re-mounts the whole chart with the new set — the effect below is keyed on the set, so
 * there is no incremental add/remove to get wrong, and RSI's second pane exists exactly while
 * RSI is on (`.has-rsi` grows the box to make room for it, `chart-section.css`).
 */

const price = (value: number): string => value.toFixed(2);

function ChartLegend({
  bar,
  active,
  reading,
}: {
  readonly bar: Bar;
  readonly active: ReadonlySet<StudyId>;
  readonly reading: StudyReading | undefined;
}): ReactElement {
  const cells: readonly (readonly [string, string])[] = [
    ["O", price(bar.o)],
    ["H", price(bar.h)],
    ["L", price(bar.l)],
    ["C", price(bar.c)],
    ["Vol", compactVolume(bar.v)],
    ...STUDY_IDS.filter((id) => active.has(id)).map(
      (id) => [id === "bollinger" ? "BB" : STUDY_LABELS[id], studyCell(id, reading)] as const,
    ),
  ];
  return (
    <p className="chart-legend num" aria-live="polite">
      <span className="chart-legend-day">{barTime(bar.t)}</span>
      {cells.map(([key, value]) => (
        <span key={key} className="chart-legend-cell">
          <span className="chart-legend-k">{key}</span> <b>{value}</b>
        </span>
      ))}
    </p>
  );
}

const NO_STUDIES: ReadonlySet<StudyId> = new Set();

/** Mounted only once there are bars to draw — the imperative chart lives in an effect keyed on
 *  the bars array (a new symbol is a new array) and the active-study set (a toggle is a new set),
 *  torn down and re-mounted fresh on either. */
function BarsChart({ bars }: { readonly bars: readonly Bar[] }): ReactElement {
  const container = useRef<HTMLDivElement>(null);
  const latest = bars[bars.length - 1] as Bar;
  const [hovered, setHovered] = useState<Bar | undefined>(undefined);
  const [active, setActive] = useState(NO_STUDIES);
  // All four, once per bars array, whatever is toggled — cheap, and the legend reads any of them.
  const studies = useMemo(() => computeStudies(bars), [bars]);
  const readings = useMemo(() => indexStudiesByDay(bars, studies), [bars, studies]);

  useEffect(() => {
    const el = container.current;
    if (!el) return;
    const mounted = mountBarsChart(el, bars, readChartPalette(), setHovered, {
      active,
      series: studies,
    });
    return () => {
      mounted.dispose();
      setHovered(undefined);
    };
  }, [bars, studies, active]);

  const shown = hovered ?? latest;
  return (
    <>
      <ChartLegend bar={shown} active={active} reading={readings.get(barTime(shown.t))} />
      <div
        ref={container}
        className={active.has("rsi") ? "chart-canvas has-rsi" : "chart-canvas"}
      />
      <StudyToggles active={active} onToggle={(id) => setActive((set) => toggleStudy(set, id))} />
    </>
  );
}

/** @category trading */
export function ChartSection({ symbol }: { readonly symbol: string }): ReactElement {
  const query = useQuery({
    queryKey: ["bars", symbol],
    queryFn: () => fetchBars(symbol),
    enabled: symbol !== "",
  });

  if (symbol === "") return <p className="note">Pick a symbol to see its chart.</p>;
  if (query.isPending) return <p className="note">Loading {symbol}…</p>;
  if (query.isError) return <p className="note">The chart for {symbol} is unreachable.</p>;
  const answer = query.data;
  if ("barsNote" in answer) return <p className="note">{answer.barsNote}</p>;
  if (answer.bars.length === 0) return <p className="note">No price history for {symbol} yet.</p>;
  return (
    <section className="chart-section" aria-label={`${symbol} daily chart`}>
      <BarsChart bars={answer.bars} />
    </section>
  );
}
