import { bollingerBands } from "../../src/indicators/bollinger.js";

describe("bollingerBands", () => {
  it("computes the middle/upper/lower band against a hand-computed population stddev", () => {
    // [1,2,3,4,5], period 5, multiplier 2.
    //   mean = 3
    //   population variance = ((1-3)^2+(2-3)^2+0+(4-3)^2+(5-3)^2) / 5 = (4+1+0+1+4)/5 = 2
    //   stddev = sqrt(2)
    const out = bollingerBands([1, 2, 3, 4, 5], 5, 2);
    expect(out[0]).toBeUndefined();
    expect(out[3]).toBeUndefined();
    const band = out[4];
    expect(band).toBeDefined();
    expect(band?.middle).toBe(3);
    expect(band?.upper).toBeCloseTo(3 + 2 * Math.sqrt(2));
    expect(band?.lower).toBeCloseTo(3 - 2 * Math.sqrt(2));
  });

  it("uses POPULATION stddev (divide by N), not sample stddev (divide by N-1)", () => {
    // Same series as above: sample stddev would divide the sum of squares (10) by 4, not 5,
    // giving stddev = sqrt(2.5) ~= 1.5811 instead of sqrt(2) ~= 1.4142. A future "fix" to sample
    // stddev must fail this test.
    const out = bollingerBands([1, 2, 3, 4, 5], 5, 2);
    const band = out[4];
    const sampleStdDevUpper = 3 + 2 * Math.sqrt(2.5);
    expect(band?.upper).not.toBeCloseTo(sampleStdDevUpper);
    expect(band?.upper).toBeCloseTo(3 + 2 * Math.sqrt(2));
  });

  it("defaults to a 20-period window and a 2 stddev multiplier", () => {
    const values = Array.from({ length: 21 }, () => 5);
    const out = bollingerBands(values);
    expect(out[18]).toBeUndefined();
    // A flat series has zero variance: middle == upper == lower.
    const band = out[19];
    expect(band).toEqual({ middle: 5, upper: 5, lower: 5 });
  });
});
