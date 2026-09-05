import type { EquitySample } from "../../src/observatory/history-store.js";
import {
  deriveTransitions,
  type WorldTransition,
} from "../../src/observatory/world-transitions.js";

const s = (over: Partial<EquitySample>): EquitySample => ({
  at: "2026-08-09T12:00:00.000Z",
  participantId: "x",
  equity: 10_000,
  cash: 5_000,
  realizedPl: 0,
  ...over,
});

const later = "2026-08-09T12:05:00.000Z";

describe("deriveTransitions", () => {
  it("emits took_profit when realized P/L rose between samples", () => {
    const prev = s({ realizedPl: 100 });
    const next = s({ at: later, realizedPl: 350 });
    expect(deriveTransitions(prev, next)).toContainEqual({
      id: `took_profit:x:${prev.at}:${later}`,
      type: "took_profit",
      participantId: "x",
      realized: 250,
      at: later,
    });
  });

  it("emits nothing for flat or falling realized P/L (a loss is not a ceremony)", () => {
    expect(deriveTransitions(s({ realizedPl: 100 }), s({ at: later, realizedPl: 100 }))).toEqual(
      [],
    );
    expect(deriveTransitions(s({ realizedPl: 100 }), s({ at: later, realizedPl: 40 }))).toEqual([]);
  });

  it("emits deployed_capital when cash fell meaningfully (capital was committed)", () => {
    const prev = s({ cash: 5_000, equity: 10_000 });
    const next = s({ at: later, cash: 3_000 });
    expect(deriveTransitions(prev, next)).toContainEqual({
      id: `deployed_capital:x:${prev.at}:${later}`,
      type: "deployed_capital",
      participantId: "x",
      committed: 2_000,
      at: later,
    });
  });

  it("ignores cash dips below the committed threshold (noise, not a groundbreak)", () => {
    // 1% of 10k equity = 100; a $50 dip is below the default threshold.
    const prev = s({ cash: 5_000, equity: 10_000 });
    const next = s({ at: later, cash: 4_950 });
    expect(deriveTransitions(prev, next)).toEqual([]);
  });

  it("never derives across participants or out-of-order samples", () => {
    expect(deriveTransitions(s({}), s({ at: later, participantId: "y", realizedPl: 500 }))).toEqual(
      [],
    );
    expect(
      deriveTransitions(s({ at: later }), s({ at: "2026-08-09T11:00:00.000Z", realizedPl: 500 })),
    ).toEqual([]);
  });

  it("emits both transitions when a sell and a bigger buy share the window", () => {
    const prev = s({ cash: 5_000, realizedPl: 0 });
    const next = s({ at: later, cash: 2_000, realizedPl: 300 });
    const types = deriveTransitions(prev, next).map((t) => t.type);
    expect(types).toEqual(["took_profit", "deployed_capital"]);
  });

  it("honors custom thresholds", () => {
    const prev = s({ realizedPl: 0, cash: 5_000, equity: 10_000 });
    const next = s({ at: later, realizedPl: 5, cash: 4_500 });
    expect(deriveTransitions(prev, next, { minRealized: 10, minCommittedPct: 0.1 })).toEqual([]);
  });
});

describe("the graduated transition (#469 slice 4)", () => {
  it("is never derived by deriveTransitions — it is minted directly at the Claim action", () => {
    // A course graduation isn't visible from an equity-sample pair, so no realized/cash delta,
    // however large, should ever produce one here.
    const prev = s({ realizedPl: 0, cash: 5_000, equity: 10_000 });
    const next = s({ at: later, realizedPl: 1_000, cash: 0 });
    const types = deriveTransitions(prev, next).map((t) => t.type);
    expect(types).not.toContain("graduated");
  });

  it("carries the course level, shaped like every other transition (participantId, at, id)", () => {
    const transition: WorldTransition = {
      id: "graduated:human-eric:200",
      type: "graduated",
      participantId: "human-eric",
      level: 200,
      at: later,
    };
    expect(transition.type).toBe("graduated");
    expect(transition.level).toBe(200);
  });
});
