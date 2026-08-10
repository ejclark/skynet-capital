import type { EquitySample } from "../../src/observatory/history-store.js";
import { TransitionBaseline } from "../../src/observatory/transition-baseline.js";

const sample = (over: Partial<EquitySample> = {}): EquitySample => ({
  at: "2026-08-10T00:00:00.000Z",
  participantId: "human-eric",
  equity: 100_000,
  cash: 20_000,
  realizedPl: 0,
  ...over,
});

describe("when a participant has no baseline yet", () => {
  it("derives nothing — there is no honest previous point to compare against", () => {
    const baseline = new TransitionBaseline();

    expect(baseline.advance(sample({ realizedPl: 500 }))).toEqual([]);
  });
});

describe("when consecutive samples arrive within one run", () => {
  it("derives a took_profit once realized P/L rises", () => {
    const baseline = new TransitionBaseline([sample()]);

    const derived = baseline.advance(sample({ at: "2026-08-10T00:05:00.000Z", realizedPl: 500 }));

    expect(derived).toHaveLength(1);
    expect(derived[0]).toMatchObject({ type: "took_profit", realized: 500 });
  });

  it("advances the baseline so the same move is not re-derived on the next tick", () => {
    const baseline = new TransitionBaseline([sample()]);
    baseline.advance(sample({ at: "2026-08-10T00:05:00.000Z", realizedPl: 500 }));

    const second = baseline.advance(sample({ at: "2026-08-10T00:10:00.000Z", realizedPl: 500 }));

    expect(second).toEqual([]);
  });
});

describe("when the server restarts between two samples", () => {
  // The safety case this design exists for: cash always comes fresh from the broker, so pairing a
  // pre-restart sample with the first post-boot one would attribute a pre-restart buy to boot time —
  // and re-fire an already-celebrated ceremony on every restart of a crash loop.
  it("derives nothing across the gap when seeded from the boot sample", () => {
    const preRestart = sample({ at: "2026-08-10T00:00:00.000Z", cash: 20_000 });
    const bootSample = sample({ at: "2026-08-10T02:00:00.000Z", cash: 8_000 }); // the buy happened while down

    // Boot seeds from the PRESENT, not from `preRestart`.
    const baseline = new TransitionBaseline([bootSample]);
    const firstTick = baseline.advance(sample({ at: "2026-08-10T02:05:00.000Z", cash: 8_000 }));

    expect(firstTick).toEqual([]);
    expect(preRestart.cash).toBe(20_000); // the durable past is never consulted
  });

  it("still derives normally for pairs after the boot sample", () => {
    const baseline = new TransitionBaseline([sample({ at: "2026-08-10T02:00:00.000Z" })]);

    const derived = baseline.advance(sample({ at: "2026-08-10T02:05:00.000Z", cash: 8_000 }));

    expect(derived).toHaveLength(1);
    expect(derived[0]).toMatchObject({ type: "deployed_capital", committed: 12_000 });
  });
});

describe("when one sample pair completes two ceremonies at once", () => {
  // Sell one position and buy another inside the same window: an id without the event type would
  // make a fire-once consumer discard the second as a duplicate and drop a real ceremony.
  it("gives each transition a distinct id", () => {
    const baseline = new TransitionBaseline([sample()]);

    const derived = baseline.advance(
      sample({ at: "2026-08-10T00:05:00.000Z", realizedPl: 300, cash: 8_000 }),
    );
    const ids = derived.map((t) => t.id);

    expect(derived.map((t) => t.type)).toEqual(["took_profit", "deployed_capital"]);
    expect(new Set(ids).size).toBe(2);
  });

  it("derives the same id for the same sample pair, so a replay dedupes", () => {
    const pair = () =>
      new TransitionBaseline([sample()]).advance(
        sample({ at: "2026-08-10T00:05:00.000Z", realizedPl: 300 }),
      );

    expect(pair()[0]?.id).toBe(pair()[0]?.id);
  });
});
