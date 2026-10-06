import { downsampleMinMax } from "../../src/observatory/downsample.js";

describe("downsampleMinMax", () => {
  it("is a no-op under the point budget", () => {
    const items = [1, 5, 2, 8, 3];
    expect(downsampleMinMax(items, (n) => n, 10)).toEqual(items);
  });

  it("caps the output at roughly the point budget", () => {
    const items = Array.from({ length: 10_000 }, (_, i) => i);
    const out = downsampleMinMax(items, (n) => n, 640);
    expect(out.length).toBeLessThanOrEqual(640);
    expect(out.length).toBeGreaterThan(600);
  });

  it("never drops the series-wide min or max", () => {
    const items = Array.from({ length: 5_000 }, (_, i) => Math.sin(i / 37) * 100);
    const out = downsampleMinMax(items, (n) => n, 200);
    expect(Math.min(...out)).toBeCloseTo(Math.min(...items), 5);
    expect(Math.max(...out)).toBeCloseTo(Math.max(...items), 5);
  });

  it("keeps the output in the original time order", () => {
    const items = Array.from({ length: 2_000 }, (_, i) => ({ at: i, v: Math.random() * 1000 }));
    const out = downsampleMinMax(items, (p) => p.v, 100);
    for (let i = 1; i < out.length; i++) {
      expect((out[i] as { at: number }).at).toBeGreaterThan((out[i - 1] as { at: number }).at);
    }
  });

  it("preserves a spike inside a single bucket rather than smoothing it away", () => {
    const flat = Array.from({ length: 1_000 }, () => 0);
    flat[500] = 999;
    const out = downsampleMinMax(flat, (n) => n, 20);
    expect(Math.max(...out)).toBe(999);
  });
});
