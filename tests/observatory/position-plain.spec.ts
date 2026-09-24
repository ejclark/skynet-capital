import { plainPosition } from "../../src/observatory/position-plain.js";

// A position in plain words (#3689 slice 6). Premiums arrive per contract (x100), as the broker
// adapter scales them. The clock: Wed 2026-09-23, 3 pm ET.
const now = new Date("2026-09-23T19:00:00Z");

describe("plainPosition", () => {
  it("says what a long put bets on, when it expires, and its breakeven, best and worst", () => {
    // 8 TSLA Oct 17 $400 puts bought at $14.10 each ($1,410/contract).
    const p = plainPosition(
      { symbol: "TSLA261017P00400000", quantity: 8, avgPrice: 1410, marketValue: 5040 },
      now,
    );
    expect(p).toMatchObject({
      plainName: "Put option · profits if TSLA falls",
      expiresIn: "24 days",
      expiresInDays: 24,
      breakeven: "$385.90",
      best: "+$308,720", // (400 × 100 × 8) − 11,280 paid, if TSLA went to $0
      worst: "−$11,280",
    });
  });

  it("gives a long call an unlimited best case and loses at most what it cost", () => {
    const p = plainPosition(
      { symbol: "NVDA261218C00130000", quantity: 6, avgPrice: 785, marketValue: 10920 },
      now,
    );
    expect(p).toMatchObject({
      plainName: "Call option · profits if NVDA rises",
      breakeven: "$137.85",
      best: "unlimited",
      worst: "−$4,710",
    });
  });

  it("turns a sold call around: the premium is the best case, the risk has no ceiling", () => {
    const p = plainPosition(
      { symbol: "AAPL261016C00250000", quantity: -2, avgPrice: 310, marketValue: -500 },
      now,
    );
    expect(p).toMatchObject({
      plainName: "Sold call · profits if AAPL stays below $250.00",
      best: "+$620",
      worst: "unlimited",
    });
  });

  it("reads shares plainly: no expiry, breakeven at cost, can lose what they cost", () => {
    const p = plainPosition(
      { symbol: "AAPL", quantity: 200, avgPrice: 189.2, marketValue: 42_930 },
      now,
    );
    expect(p).toMatchObject({
      plainName: "Shares · profits if AAPL rises",
      expiresIn: "no expiry",
      breakeven: "$189.20",
      best: "unlimited",
      worst: "−$37,840",
    });
  });

  it("calls the expiry day 'today', not '0 days'", () => {
    const p = plainPosition(
      { symbol: "SPY260923C00660000", quantity: 1, avgPrice: 120, marketValue: 80 },
      now,
    );
    expect(p.expiresIn).toBe("today");
  });
});
