import { scoreSentiment } from "../../src/news/sentiment-scorer.js";

describe("scoreSentiment", () => {
  it("scores clearly positive news positive", () => {
    expect(scoreSentiment("NVDA beats estimates, profit surges to record")).toBeGreaterThan(0);
  });

  it("scores clearly negative news negative", () => {
    expect(scoreSentiment("AAPL plunges on downgrade and weak guidance")).toBeLessThan(0);
  });

  it("returns 0 for neutral text with no sentiment words", () => {
    expect(scoreSentiment("The company will hold its meeting on Tuesday")).toBe(0);
  });

  it("stays within [-1, 1]", () => {
    const s = scoreSentiment("surge surge surge plunge");
    expect(s).toBeGreaterThanOrEqual(-1);
    expect(s).toBeLessThanOrEqual(1);
  });
});
