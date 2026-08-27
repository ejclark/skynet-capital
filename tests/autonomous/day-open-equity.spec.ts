import type { AlpacaAccount } from "../../src/alpaca/alpaca-trading-client.js";
import { fleetDayOpenEquity, parseDayOpenEquity } from "../../src/autonomous/day-open-equity.js";

const account = (last_equity?: string): AlpacaAccount => ({
  id: "acct",
  cash: "0",
  portfolio_value: "0",
  status: "ACTIVE",
  last_equity,
});

describe("parseDayOpenEquity", () => {
  it("parses a normal Alpaca last_equity string", () => {
    expect(parseDayOpenEquity(account("1000000.42"))).toBe(1_000_000.42);
  });

  it("returns null when last_equity is absent — an older/mocked payload, never a crash", () => {
    expect(parseDayOpenEquity(account(undefined))).toBeNull();
  });

  it("returns null on a non-numeric string rather than NaN leaking into the breaker", () => {
    expect(parseDayOpenEquity(account("not-a-number"))).toBeNull();
  });

  it("returns null on an empty string", () => {
    expect(parseDayOpenEquity(account(""))).toBeNull();
  });
});

describe("fleetDayOpenEquity", () => {
  it("sums per-bot equities into the fleet total", () => {
    expect(fleetDayOpenEquity([500_000, 300_000, 200_000])).toBe(1_000_000);
  });

  it("drops the whole seed if ANY bot's read failed — a partial baseline is a wrong baseline", () => {
    expect(fleetDayOpenEquity([500_000, null, 200_000])).toBeNull();
  });

  it("returns null for an empty fleet rather than a false zero", () => {
    expect(fleetDayOpenEquity([])).toBeNull();
  });
});
