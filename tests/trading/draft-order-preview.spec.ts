import { addLeg, emptyDraft, type NewLeg } from "../../src/trading/draft-order.js";
import { draftPreview } from "../../src/trading/draft-order-preview.js";

/**
 * Slice 3's pure half: the payoff arithmetic behind the review screen. The interesting cases are
 * the vertical spread (textbook max gain = net credit, max loss = width minus credit) and the
 * naked leg, where the EARS criterion says the review screen must show `"unlimited"` — a string,
 * never a very large number pretending to be one.
 */

const SHORT_CALL: NewLeg = {
  underlying: "NVDA",
  optionType: "call",
  strike: 180,
  expiration: "2026-09-18",
  action: "sell",
  contracts: 1,
  limitPrice: 4.2,
};
const LONG_CALL: NewLeg = { ...SHORT_CALL, strike: 200, action: "buy", limitPrice: 1.1 };

describe("draftPreview", () => {
  it("prices a call credit spread with the textbook numbers", () => {
    const spread = addLeg(addLeg(emptyDraft(), SHORT_CALL), LONG_CALL);
    const preview = draftPreview(spread);

    expect(preview.pricedFully).toBe(true);
    expect(preview.netPremium).toBeCloseTo(310); // (4.20 - 1.10) × 100 — a net credit
    expect(preview.maxGain).toBeCloseTo(310); // capped at the net credit
    expect(preview.maxLoss).toBeCloseTo(1_690); // (200 - 180) × 100 - 310
    expect(preview.unlimitedLoss).toBe(false);
    expect(preview.undefinedRiskLegIds).toEqual([]);
  });

  it("shows the literal string 'unlimited' for a naked short call, never a numeric placeholder", () => {
    const naked = addLeg(emptyDraft(), SHORT_CALL);
    const preview = draftPreview(naked);

    expect(preview.maxLoss).toBe("unlimited");
    expect(preview.unlimitedLoss).toBe(true);
    expect(preview.undefinedRiskLegIds).toEqual(["leg-1"]);
  });

  it("reports uncapped max gain for a long call, and its premium as the whole max loss", () => {
    const longCall = addLeg(emptyDraft(), LONG_CALL);
    const preview = draftPreview(longCall);

    expect(preview.maxGain).toBe("uncapped");
    expect(preview.maxLoss).toBeCloseTo(110); // premium 1.10 × 100
    expect(preview.unlimitedLoss).toBe(false);
  });

  it("flags an unpriced leg instead of pretending its premium is real", () => {
    const unpriced = addLeg(emptyDraft(), { ...SHORT_CALL, limitPrice: undefined });
    const preview = draftPreview(unpriced);

    expect(preview.pricedFully).toBe(false);
  });

  it("has nothing to price on an empty draft", () => {
    const preview = draftPreview(emptyDraft());

    expect(preview.legCount).toBe(0);
    expect(preview.netPremium).toBeUndefined();
    expect(preview.maxGain).toBe(0);
    expect(preview.maxLoss).toBe(0);
    expect(preview.unlimitedLoss).toBe(false);
  });
});
