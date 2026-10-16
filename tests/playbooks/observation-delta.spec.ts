import type { DayObservation, SignalObservation } from "../../src/domain/playbook-observation.js";
import { observationDelta } from "../../src/playbooks/observation-delta.js";

/** A pass runs every 15s; a bar closes every 300s. Say each observation once, again when it moves. */

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
  minutes: 700,
  level: "none",
  reasons: [],
  tiedUp: 0,
  held: 1,
  sold: 0,
  refused: 0,
  wouldBe: [],
  ...over,
});

describe("observationDelta", () => {
  it("passes everything the first time", () => {
    const newly = observationDelta();
    expect(newly([signal(), dayReading()])).toHaveLength(2);
  });

  it("is silent when a later pass says exactly the same", () => {
    const newly = observationDelta();
    newly([signal(), dayReading()]);
    expect(newly([signal(), dayReading()])).toEqual([]);
  });

  it("ignores the quote: it is read fresh every pass and the store keeps the first", () => {
    const newly = observationDelta();
    const q = (last: number) => ({ bid: last, ask: last, last, seenAt: last });
    newly([signal({ quote: q(97.5) })]);
    expect(newly([signal({ quote: q(97.6) })])).toEqual([]);
    expect(newly([signal()])).toEqual([]);
  });

  it("says an observation again when it moves on: a level reached, a sale, a new bar", () => {
    const newly = observationDelta();
    newly([signal(), dayReading()]);
    const moved = signal({ level: "signal", age: 3 });
    const sold = signal({ sold: { session: "2026-10-08", minutes: 570, price: 99 } });
    expect(newly([moved])).toEqual([moved]);
    expect(newly([sold])).toEqual([sold]);
    expect(newly([dayReading({ minutes: 705 })])).toHaveLength(1);
  });

  it("tells apart the same bar of two playbooks, two tickers, and a signal from a day reading", () => {
    const newly = observationDelta();
    const all = [
      signal(),
      signal({ playbookId: "NBIS-DIP-BOUNCE", symbol: "NBIS" }),
      signal({ minutes: 705 }),
      dayReading(),
    ];
    expect(newly(all)).toHaveLength(4);
    expect(newly(all)).toEqual([]);
  });

  it("keeps a separate memory per instance, so a roster swap says everything once more", () => {
    const first = observationDelta();
    const second = observationDelta();
    first([signal()]);
    expect(second([signal()])).toHaveLength(1);
  });
});
