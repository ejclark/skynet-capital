import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { type Bar, fetchBars } from "../live/bars";
import { barTime, compactVolume } from "./chart-data";
import { mountBarsChart, readChartPalette } from "./chart-mount";

/**
 * THE CHART SECTION (#2017 Phase 1 chart build-out, the mount slice) — daily candles with a
 * volume band for the ticket's committed `?symbol=`, the `/trade` page's second SECTION beside
 * the ticket (`section-switch.tsx`, #1740's three-word rule: a different shape of data on the
 * same page). Candlestick + volume only — the canned-study overlays are the next slice.
 *
 * Three honest states, never conflated (`bars.ts`'s doctrine, the same one `quote-header.tsx`
 * holds for quotes): a `barsNote` is rendered VERBATIM (the server said why); an empty `bars`
 * array is a real answer (the feed had nothing for the window), not a failure; anything else
 * mounts the chart. No symbol yet is the section's own empty state — the symbol is picked on the
 * Ticket section and travels here through the URL, so there is no second input to keep in sync.
 *
 * A standing reader is red/green colourblind (CLAUDE.md), so the candle hue is SUPPLEMENTARY: the
 * legend above the canvas reads the bar under the crosshair — date · O · H · L · C · Vol — as
 * plain text, defaulting to the latest bar and falling back to it when the cursor leaves the
 * chart. Every real platform draws this line; here it is also the "word" the house rule requires.
 */

const price = (value: number): string => value.toFixed(2);

function ChartLegend({ bar }: { readonly bar: Bar }): ReactElement {
  const cells: readonly (readonly [string, string])[] = [
    ["O", price(bar.o)],
    ["H", price(bar.h)],
    ["L", price(bar.l)],
    ["C", price(bar.c)],
    ["Vol", compactVolume(bar.v)],
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

/** Mounted only once there are bars to draw — the imperative chart lives in an effect keyed on
 *  the bars array (a new symbol is a new array), torn down on the way out. */
function BarsChart({ bars }: { readonly bars: readonly Bar[] }): ReactElement {
  const container = useRef<HTMLDivElement>(null);
  const latest = bars[bars.length - 1] as Bar;
  const [hovered, setHovered] = useState<Bar | undefined>(undefined);

  useEffect(() => {
    const el = container.current;
    if (!el) return;
    const mounted = mountBarsChart(el, bars, readChartPalette(), setHovered);
    return () => {
      mounted.dispose();
      setHovered(undefined);
    };
  }, [bars]);

  return (
    <>
      <ChartLegend bar={hovered ?? latest} />
      <div ref={container} className="chart-canvas" />
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
