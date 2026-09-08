import { rsi } from "../../src/indicators/rsi.js";

describe("rsi", () => {
  it("matches a hand-computed value over a mixed up/down window", () => {
    // [10,12,11,13], period 3. Deltas feeding idx3's window (j=1..3):
    //   values[1]-values[0] = 12-10 = +2 (gain)
    //   values[2]-values[1] = 11-12 = -1 (loss, magnitude 1)
    //   values[3]-values[2] = 13-11 = +2 (gain)
    // gains=4, losses=1, n=3 -> rs = (4/3)/(1/3) = 4 -> rsi = 100 - 100/(1+4) = 80
    const out = rsi([10, 12, 11, 13], 3);
    expect(out[0]).toBeUndefined();
    expect(out[1]).toBeUndefined();
    expect(out[2]).toBeUndefined();
    expect(out[3]).toBe(80);
  });

  it("is undefined until `period` deltas are available (needs period+1 prices)", () => {
    const out = rsi([1, 2, 3], 5);
    expect(out).toEqual([undefined, undefined, undefined]);
  });

  it("returns 100 — not a fabricated value — when the window has no losses at all", () => {
    // Every move up: losses <= 0 is the source's real edge case, not a placeholder.
    const out = rsi([1, 2, 3, 4], 3);
    expect(out[3]).toBe(100);
  });

  it("defaults to a 14-period window", () => {
    const values = Array.from({ length: 15 }, (_, i) => i + 1); // strictly increasing
    const out = rsi(values);
    expect(out[13]).toBeUndefined();
    expect(out[14]).toBe(100);
  });
});
