import type { Rgba } from "lightweight-charts";
import { readChartPalette } from "../../src/shell/chart-mount";
import { mountHeroChart } from "../../src/shell/hero-chart-mount";

/**
 * The ONE deliberate mount smoke test (#3186 slice 2, mirroring `chart-mount.spec.ts`): prove
 * `createChart` → two `addSeries` calls → `chart.remove()` all work end to end with the options
 * the production mount actually passes. The `layout.colorParsers` shim is the happy-dom workaround
 * from `docs/ENGINEERING.md` → House gotchas — it lives HERE and only here.
 */

const hexParser = (color: string): Rgba | null => {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})?$/i.exec(color.trim());
  if (!m) return null;
  const byte = (s: string | undefined) => Number.parseInt(s ?? "ff", 16);
  return [byte(m[1]), byte(m[2]), byte(m[3]), byte(m[4]) / 255] as Rgba;
};

const shim = { layout: { colorParsers: [hexParser] } };

const overlay = {
  portfolio: [
    { time: "2026-09-01", value: 0 },
    { time: "2026-09-02", value: 0.03 },
  ],
  benchmark: [
    { time: "2026-09-01", value: 0 },
    { time: "2026-09-02", value: 0.01 },
  ],
} as const;

describe("mountHeroChart (smoke)", () => {
  it("constructs the portfolio + benchmark overlay and tears down clean", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const mounted = mountHeroChart(container, overlay, readChartPalette(), shim);

    expect(container.querySelector("table, canvas, div")).not.toBeNull();
    expect(() => mounted.dispose()).not.toThrow();
    expect(container.childElementCount).toBe(0);
    container.remove();
  });

  it("mounts cleanly with an empty benchmark series (no data for this symbol/range yet)", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const mounted = mountHeroChart(
      container,
      { portfolio: overlay.portfolio, benchmark: [] },
      readChartPalette(),
      shim,
    );

    expect(() => mounted.dispose()).not.toThrow();
    container.remove();
  });
});
