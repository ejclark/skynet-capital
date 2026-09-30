import type {
  ShadowClose,
  ShadowProbe,
  ShadowSnapshot,
} from "../../src/playbooks/cond-scout-ledger.js";
import { probeRetro } from "../../src/playbooks/cond-scout-retro.js";

const DAY = 86_400_000;
const T0 = Date.UTC(2026, 8, 30, 14, 0);

const probe: ShadowProbe = {
  id: `AMD@${T0}`,
  symbol: "AMD",
  hypothesis: "oversold-rebound",
  condition: "oversold",
  triggers: ["RSI 22.0 ≤ 30"],
  forecast: { direction: "up", horizonMs: 8 * DAY, invalidator: "below 95.00" },
  openedAt: T0,
  entryPrice: 100,
  entryQuote: { bid: 99.9, ask: 100, last: 100, asOf: "2026-09-30T14:00:00Z" },
  quantity: 50,
  notional: 5_000,
  stopPrice: 95,
  expiresAt: T0 + 8 * DAY,
};

const snap = (days: number, bid: number, rsi?: number, sentiment?: number): ShadowSnapshot => ({
  probeId: probe.id,
  symbol: "AMD",
  at: T0 + days * DAY,
  quote: { bid, ask: bid + 0.1, last: bid, asOf: "" },
  ...(rsi !== undefined
    ? {
        reading: {
          symbol: "AMD",
          price: bid,
          rsi,
          ...(sentiment !== undefined ? { sentiment } : {}),
        },
      }
    : {}),
  markRoi: (bid - 100) / 100,
});

/** An 8-day hold closed on its horizon at +2%, after peaking at +6% on day 2. */
const close: ShadowClose = {
  probe,
  closedAt: T0 + 8 * DAY,
  reason: "horizon",
  exitPrice: 102,
  exitQuote: { bid: 102, ask: 102.1, last: 102, asOf: "" },
  realized: 100,
  roi: 0.02,
  daysHeld: 8,
  roiPerDay: 0.0025,
};
const path = [
  snap(0, 99.9, 22, 0.1),
  snap(1, 103),
  snap(2, 106),
  snap(4, 101),
  snap(6, 104),
  snap(8, 102, 55, 0.3),
];

describe("probeRetro", () => {
  const retro = probeRetro(close, path);

  it("records the outcome, the direction call and the path, not just the ends", () => {
    expect(retro).toMatchObject({
      probeId: probe.id,
      hypothesis: "oversold-rebound",
      reason: "horizon",
      roi: 0.02,
      directionRight: true,
      snapshotCount: 6,
    });
    expect(retro.bestMarkRoi).toBeCloseTo(0.06, 6);
    expect(retro.worstMarkRoi).toBeCloseTo(-0.001, 6);
    expect(retro.rsiDelta).toBe(33);
    expect(retro.sentimentDelta).toBeCloseTo(0.2, 6);
  });

  it("prices earlier exits at 25/50/75% of the hold from the snapshot the probe could have sold at", () => {
    const byLabel = Object.fromEntries(retro.earlierExits.map((c) => [c.label, c]));
    expect(byLabel["25%"]?.roi).toBeCloseTo(0.06, 6); // day 2
    expect(byLabel["50%"]?.roi).toBeCloseTo(0.01, 6); // day 4
    expect(byLabel["75%"]?.roi).toBeCloseTo(0.04, 6); // day 6
  });

  it("answers Eric's question: sooner would have paid faster, and frees the capital", () => {
    const pace = retro.earlierExits.find((c) => c.label === "best pace");
    expect(pace?.daysHeld).toBe(1);
    expect(pace?.roiPerDay).toBeCloseTo(0.03, 6); // +3% in a day vs +0.25%/day actual
    expect(retro.soonerWasBetter).toBe(true);
  });

  it("never lets an hour-old mark win the pace race", () => {
    const early = probeRetro(close, [snap(1 / 24, 101), snap(8, 102)]);
    expect(early.earlierExits.find((c) => c.label === "best pace")).toBeUndefined();
    expect(early.soonerWasBetter).toBe(false);
  });

  it("is honest about a probe with no snapshots inside the hold", () => {
    const bare = probeRetro(close, []);
    expect(bare.earlierExits).toEqual([]);
    expect(bare.snapshotCount).toBe(0);
    expect(bare.bestMarkRoi).toBeCloseTo(0.02, 6);
    expect(bare.rsiDelta).toBeUndefined();
  });

  it("marks a losing exit as a wrong direction call", () => {
    const lost = probeRetro(
      { ...close, exitPrice: 94.9, roi: -0.051, reason: "invalidated" },
      path,
    );
    expect(lost.directionRight).toBe(false);
  });
});
