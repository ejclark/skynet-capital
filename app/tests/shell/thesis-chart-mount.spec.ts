import type { Rgba } from "lightweight-charts";
import { readChartPalette } from "../../src/shell/chart-mount";
import { mountThesisChart } from "../../src/shell/thesis-chart-mount";

/**
 * The ONE deliberate mount smoke test (#3186 slice 4a, mirroring `hero-chart-mount.spec.ts`): prove
 * `createChart` → `addSeries` → `createSeriesMarkers` → `chart.remove()` all work end to end with
 * the options the production mount actually passes.
 */

const hexParser = (color: string): Rgba | null => {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})?$/i.exec(color.trim());
  if (!m) return null;
  const byte = (s: string | undefined) => Number.parseInt(s ?? "ff", 16);
  return [byte(m[1]), byte(m[2]), byte(m[3]), byte(m[4]) / 255] as Rgba;
};

const shim = { layout: { colorParsers: [hexParser] } };

const equity = [
  { t: "2026-09-01T00:00:00Z", value: 100_000 },
  { t: "2026-09-02T00:00:00Z", value: 101_500 },
];

const markers = [
  {
    n: 1,
    kind: "entry" as const,
    at: "2026-09-01T00:00:00Z",
    label: "Buy 10 NVDA",
    activityAnchor: "act-1",
  },
  {
    n: 2,
    kind: "exit" as const,
    at: "2026-09-02T00:00:00Z",
    label: "Sell 10 NVDA",
    activityAnchor: "act-2",
  },
];

describe("mountThesisChart (smoke)", () => {
  it("constructs the equity line with entry/exit markers and tears down clean", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const mounted = mountThesisChart(container, equity, markers, readChartPalette(), shim);

    expect(container.querySelector("table, canvas, div")).not.toBeNull();
    expect(() => mounted.dispose()).not.toThrow();
    expect(container.childElementCount).toBe(0);
    container.remove();
  });

  it("mounts cleanly with no markers (no fills recorded yet)", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const mounted = mountThesisChart(container, equity, [], readChartPalette(), shim);

    expect(() => mounted.dispose()).not.toThrow();
    container.remove();
  });
});
