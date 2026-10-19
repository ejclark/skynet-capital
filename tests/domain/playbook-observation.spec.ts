import {
  type DayObservation,
  mergeObservation,
  observationKey,
  observationSlot,
  type SignalObservation,
  worseLevel,
} from "../../src/domain/playbook-observation.js";

/** The identity and the merge rule of the dark run's record (#5489). */

const buy = { side: "buy", shares: 10, kind: "market", price: 97.5, why: "dip" } as const;
const signal = (over: Partial<SignalObservation> = {}): SignalObservation => ({
  kind: "signal",
  playbookId: "MU-DIP-BOUNCE",
  symbol: "MU",
  session: "2026-10-02",
  minutes: 700,
  outcome: "buy",
  vwap: 100,
  range: 1,
  entry: buy,
  level: "none",
  worstLevel: "none",
  age: 0,
  ...over,
});
const dayReading = (over: Partial<DayObservation> = {}): DayObservation => ({
  kind: "day",
  playbookId: "MU-DIP-BOUNCE",
  symbol: "MU",
  session: "2026-10-02",
  minutes: 955,
  level: "none",
  reasons: [],
  tiedUp: 0,
  held: 0,
  sold: 0,
  refused: 0,
  wouldBe: [],
  ...over,
});

describe("worseLevel", () => {
  it("ranks none under signal under gate", () => {
    expect(worseLevel("none", "signal")).toBe("signal");
    expect(worseLevel("gate", "signal")).toBe("gate");
    expect(worseLevel("none", "none")).toBe("none");
  });
});

describe("observationKey", () => {
  it("is one per bar for a signal and one per session for a day's reading", () => {
    expect(observationSlot(signal())).toBe(700);
    expect(observationSlot(dayReading())).toBe(0);
    expect(observationKey(dayReading({ minutes: 600 }))).toBe(
      observationKey(dayReading({ minutes: 955 })),
    );
    expect(observationKey(signal({ minutes: 705 }))).not.toBe(observationKey(signal()));
  });

  it("separates playbooks, tickers and kinds", () => {
    const keys = new Set([
      observationKey(signal()),
      observationKey(signal({ playbookId: "NBIS-DIP-BOUNCE", symbol: "NBIS" })),
      observationKey(dayReading()),
    ]);
    expect(keys.size).toBe(3);
  });
});

describe("mergeObservation", () => {
  const first = { bid: 97.4, ask: 97.6, last: 97.5, seenAt: 1 };

  it("keeps the first quote and raises the worst level, taking the rest from the newer say", () => {
    const merged = mergeObservation(
      signal({ quote: first, level: "gate", worstLevel: "gate" }),
      signal({ level: "none", worstLevel: "none", age: 8, quote: { ...first, seenAt: 9 } }),
    );
    expect(merged).toMatchObject({ level: "none", worstLevel: "gate", age: 8, quote: first });
  });

  it("takes a quote when the first say had none", () => {
    expect(mergeObservation(signal(), signal({ quote: first }))).toMatchObject({ quote: first });
  });

  it("lets the newer reading win outright for a day, and for a first say", () => {
    const newer = dayReading({ held: 2 });
    expect(mergeObservation(dayReading(), newer)).toBe(newer);
    const fresh = signal();
    expect(mergeObservation(undefined, fresh)).toBe(fresh);
  });
});
