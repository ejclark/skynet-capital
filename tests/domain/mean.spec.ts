import { mean, meanOrZero } from "../../src/domain/mean.js";

describe("mean", () => {
  it("averages a list", () => {
    expect(mean([1, 2, 6])).toBe(3);
  });
  it("has no mean for an empty list", () => {
    expect(Number.isNaN(mean([]))).toBe(true);
  });
  it("meanOrZero answers 0 for an empty list and the mean otherwise", () => {
    expect(meanOrZero([])).toBe(0);
    expect(meanOrZero([2, 4])).toBe(3);
  });
});
