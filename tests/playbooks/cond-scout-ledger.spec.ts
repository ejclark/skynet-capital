import type { ConditionHypothesis } from "../../src/playbooks/cond-scout.js";
import {
  checkShadowExit,
  openShadowProbe,
  probeIntent,
} from "../../src/playbooks/cond-scout-ledger.js";
import { aQuote } from "../support/builders.js";

const DAY = 86_400_000;
const T0 = Date.UTC(2026, 8, 30, 14, 0);

const rebound: ConditionHypothesis = {
  symbol: "AMD",
  condition: "oversold",
  hypothesis: "oversold-rebound",
  reading: { symbol: "AMD", price: 100, rsi: 22 },
  triggers: ["RSI 22.0 ≤ 30", "sentiment 0.10 not negative"],
  strength: 0.27,
  forecast: { direction: "up", horizonMs: 5 * DAY, invalidator: "trades below 95.00 (−5%)" },
};

describe("openShadowProbe", () => {
  it("fills at the ask, in whole shares, and records the quote it paid", () => {
    const probe = openShadowProbe(
      rebound,
      aQuote({ symbol: "AMD", bid: 99.9, ask: 100.1, last: 100 }),
      T0,
      0.05,
    );
    expect(probe).toMatchObject({
      id: `AMD@${T0}`,
      entryPrice: 100.1,
      quantity: 49,
      expiresAt: T0 + 5 * DAY,
      entryQuote: { bid: 99.9, ask: 100.1, last: 100 },
    });
    expect(probe?.notional).toBeCloseTo(49 * 100.1, 6);
    expect(probe?.stopPrice).toBeCloseTo(100.1 * 0.95, 6);
  });

  it("opens nothing without a usable ask or when one share is out of reach", () => {
    expect(openShadowProbe(rebound, aQuote({ symbol: "AMD", ask: 0 }), T0, 0.05)).toBeUndefined();
    expect(
      openShadowProbe(rebound, aQuote({ symbol: "AMD", ask: 6_000, last: 6_000 }), T0, 0.05),
    ).toBeUndefined();
  });
});

describe("checkShadowExit", () => {
  const probe = openShadowProbe(rebound, aQuote({ symbol: "AMD", bid: 99.9, ask: 100 }), T0, 0.05);
  if (!probe) throw new Error("fixture probe did not open");

  it("stays open inside the horizon while the bid holds above the stop", () => {
    expect(
      checkShadowExit(probe, aQuote({ symbol: "AMD", bid: 97, ask: 97.1 }), T0 + DAY),
    ).toBeUndefined();
  });

  it("closes at the bid, as invalidated, once the bid reaches the stop", () => {
    const close = checkShadowExit(
      probe,
      aQuote({ symbol: "AMD", bid: 94.9, ask: 95 }),
      T0 + 2 * DAY,
    );
    expect(close).toMatchObject({ reason: "invalidated", exitPrice: 94.9, daysHeld: 2 });
    expect(close?.realized).toBeCloseTo((94.9 - 100) * 50, 6);
    expect(close?.roi).toBeCloseTo(-0.051, 6);
    expect(close?.roiPerDay).toBeCloseTo(-0.0255, 6);
  });

  it("closes on the horizon, and a broken thesis is recorded as broken even then", () => {
    const late = T0 + 5 * DAY;
    expect(
      checkShadowExit(probe, aQuote({ symbol: "AMD", bid: 104, ask: 104.1 }), late),
    ).toMatchObject({
      reason: "horizon",
      exitPrice: 104,
    });
    expect(
      checkShadowExit(probe, aQuote({ symbol: "AMD", bid: 90, ask: 90.1 }), late)?.reason,
    ).toBe("invalidated");
  });

  it("waits rather than invent an exit price when there is no bid", () => {
    expect(checkShadowExit(probe, aQuote({ symbol: "AMD", bid: 0 }), T0 + 9 * DAY)).toBeUndefined();
  });

  it("floors the day count so a same-hour close can't blow up ROI per day", () => {
    const close = checkShadowExit(
      probe,
      aQuote({ symbol: "AMD", bid: 90, ask: 90.1 }),
      T0 + 60_000,
    );
    expect(close?.roiPerDay).toBeCloseTo((close?.roi ?? 0) * 24, 6);
  });
});

describe("probeIntent", () => {
  it("is a COND-SCOUT buy carrying the forecast, and says no order was sent", () => {
    const intent = probeIntent(rebound, 50);
    expect(intent).toMatchObject({
      symbol: "AMD",
      side: "buy",
      quantity: 50,
      playbookId: "COND-SCOUT",
      forecast: rebound.forecast,
    });
    expect(intent.reason).toContain("no order sent");
  });
});
