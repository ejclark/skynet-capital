import type { Rgba } from "lightweight-charts";
import type { Bar } from "../../src/live/bars";
import { mountBarsChart, readChartPalette } from "../../src/shell/chart-mount";

/**
 * The ONE deliberate mount smoke test (#2017 Phase 1 chart build-out, the mount slice): prove
 * `createChart` → `addSeries` (candles + the volume overlay) → `chart.remove()` all work end to
 * end with the options this slice actually passes. The `layout.colorParsers` shim below is the
 * happy-dom workaround from `docs/ENGINEERING.md` → House gotchas — it lives HERE and only here,
 * never in the production component.
 */

const hexParser = (color: string): Rgba | null => {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})?$/i.exec(color.trim());
  if (!m) return null;
  const byte = (s: string | undefined) => Number.parseInt(s ?? "ff", 16);
  return [byte(m[1]), byte(m[2]), byte(m[3]), byte(m[4]) / 255] as Rgba;
};

const bars: Bar[] = [
  { t: "2026-09-01T00:00:00Z", o: 100, h: 105, l: 99, c: 104, v: 1_200_000 },
  { t: "2026-09-02T00:00:00Z", o: 104, h: 106, l: 101, c: 102, v: 845_000 },
  { t: "2026-09-03T00:00:00Z", o: 102, h: 108, l: 101, c: 107, v: 1_900_000 },
];

describe("mountBarsChart (smoke)", () => {
  it("constructs candles + a volume overlay and tears down clean", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const hovered: (Bar | undefined)[] = [];
    const mounted = mountBarsChart(
      container,
      bars,
      readChartPalette(),
      (bar) => hovered.push(bar),
      { layout: { colorParsers: [hexParser] } },
    );
    expect(container.querySelector("table, canvas, div")).not.toBeNull();
    expect(() => mounted.dispose()).not.toThrow();
    expect(container.childElementCount).toBe(0);
    container.remove();
  });

  it("falls back to the dark palette's hex when a token is absent from the document", () => {
    const palette = readChartPalette();
    expect(palette.pos).toMatch(/^#[0-9a-f]{6}$/i);
    expect(palette.neg).toMatch(/^#[0-9a-f]{6}$/i);
    expect(palette.pos).not.toBe(palette.neg);
  });
});
