import {
  participantCostBasis,
  participantInvested,
  participantReturnPct,
  participantUnrealized,
} from "../../src/observatory/participant-card.js";
import type {
  ParticipantSnapshot,
  PositionView,
} from "../../src/observatory/participant-snapshot.js";

const pos = (symbol: string, overrides: Partial<PositionView> = {}): PositionView => ({
  symbol,
  quantity: overrides.quantity ?? 10,
  avgPrice: overrides.avgPrice ?? 100,
  marketValue: overrides.marketValue ?? 1_000,
});

const snap = (overrides: Partial<ParticipantSnapshot> = {}): ParticipantSnapshot => ({
  id: "sauron",
  displayName: "Sauron",
  kind: "bot",
  cash: 10_000,
  equity: 20_000,
  positions: [],
  ...overrides,
});

describe("participant-card", () => {
  describe("participantUnrealized / participantInvested / participantReturnPct", () => {
    it("sums unrealized P/L and invested value across positions", () => {
      const snapshot = snap({
        positions: [
          pos("NVDA", { quantity: 10, avgPrice: 90, marketValue: 1_000 }),
          pos("META", { quantity: 5, avgPrice: 50, marketValue: 300 }),
        ],
      });
      // NVDA: 1000 - 10*90 = 100; META: 300 - 5*50 = 50
      expect(participantUnrealized(snapshot)).toBe(150);
      expect(participantInvested(snapshot)).toBe(1_300);
    });

    it("reports 0% return when nothing is invested", () => {
      expect(participantReturnPct(snap({ positions: [] }))).toBe(0);
    });

    it("computes the open positions' return as a percent of what they cost, not of market value", () => {
      const snapshot = snap({
        positions: [pos("NVDA", { quantity: 10, avgPrice: 90, marketValue: 1_000 })],
      });
      // +100 on a $900 cost is +11.11% — on the $1,000 market value it would read +10%.
      expect(participantReturnPct(snapshot)).toBeCloseTo(11.111, 2);
    });

    it("reads a position down half its cost as -50%, never -100%", () => {
      const snapshot = snap({
        positions: [pos("NVDA", { quantity: 10, avgPrice: 100, marketValue: 500 })],
      });
      expect(participantReturnPct(snapshot)).toBeCloseTo(-50, 5);
    });

    it("measures a written option against the premium collected, without cancelling a long", () => {
      const snapshot = snap({
        positions: [
          pos("NVDA", { quantity: 10, avgPrice: 100, marketValue: 1_100 }),
          // Sold one put for $255; buying it back costs $550 → -$295.
          pos("NVDA261106P00080000", {
            quantity: -1,
            avgPrice: 255,
            marketValue: -550,
          }),
        ],
      });
      expect(participantCostBasis(snapshot)).toBe(1_255);
      // (+100 − 295) / 1,255
      expect(participantReturnPct(snapshot)).toBeCloseTo(-15.538, 2);
    });

    it("handles a loss (negative unrealized P/L)", () => {
      const snapshot = snap({
        positions: [pos("NVDA", { quantity: 10, avgPrice: 120, marketValue: 1_000 })],
      });
      expect(participantUnrealized(snapshot)).toBe(-200);
      // -200 on a $1,200 cost.
      expect(participantReturnPct(snapshot)).toBeCloseTo(-16.667, 2);
    });
  });
});
