import { ema } from "../../src/indicators/ema.js";

describe("ema", () => {
  it("seeds the first value with the SMA of the window, then applies the smoothing factor", () => {
    // [1,2,3,4,5], period 3, k = 2/(3+1) = 0.5
    //   idx2 seed = SMA(1,2,3) = 2
    //   idx3 = 2 + 0.5*(4-2) = 3
    //   idx4 = 3 + 0.5*(5-3) = 4
    const out = ema([1, 2, 3, 4, 5], 3);
    expect(out[0]).toBeUndefined();
    expect(out[1]).toBeUndefined();
    expect(out[2]).toBe(2);
    expect(out[3]).toBe(3);
    expect(out[4]).toBe(4);
  });

  it("is undefined for every index before the window is full", () => {
    const out = ema([10, 20], 5);
    expect(out).toEqual([undefined, undefined]);
  });

  it("is a single parameterized function — different periods produce different series", () => {
    // The source hardcodes two EMAs (kf=2/10 -> N=9 "fast", ks=2/22 -> N=21 "slow") inline; this
    // port is one function a caller runs twice, so two different periods must diverge.
    const values = [100, 102, 101, 105, 110, 108, 112];
    const fast = ema(values, 3);
    const slow = ema(values, 5);
    expect(fast).not.toEqual(slow);
  });
});
