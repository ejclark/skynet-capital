import { sma } from "../../src/indicators/sma.js";

describe("sma", () => {
  it("averages a hand-computable trailing window", () => {
    // [1,2,3,4,5], period 3:
    //   idx2 = (1+2+3)/3 = 2
    //   idx3 = (2+3+4)/3 = 3
    //   idx4 = (3+4+5)/3 = 4
    const out = sma([1, 2, 3, 4, 5], 3);
    expect(out).toEqual([undefined, undefined, 2, 3, 4]);
  });

  it("is undefined for every index before the window is full", () => {
    const out = sma([10, 20], 5);
    expect(out).toEqual([undefined, undefined]);
  });

  it("defaults to a 20-period window", () => {
    const values = Array.from({ length: 25 }, (_, i) => i + 1);
    const out = sma(values);
    expect(out[18]).toBeUndefined();
    // idx19 = average of values[0..19] = (1+...+20)/20 = 10.5
    expect(out[19]).toBeCloseTo(10.5);
  });
});
