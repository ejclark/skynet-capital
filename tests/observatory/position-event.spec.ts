import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import type { MarketEvent } from "../../src/domain/market-events.js";
import { decisionsFor } from "../../src/observatory/decisions-view.js";
import { nextEventFor, nextPrintFor } from "../../src/observatory/position-event.js";
import { plainPosition } from "../../src/observatory/position-plain.js";

/**
 * A position's next event (#3689 follow-up): the stock's own print when it can still move the
 * position, else the next Fed / CPI / jobs print — never the long tail of auctions and surveys.
 */

const asOf = "2026-09-23T19:00:00Z";

const macro = (id: string, date: string, over: Partial<MarketEvent> = {}): MarketEvent => ({
  id,
  kind: "macro-print",
  title: id,
  date,
  status: "confirmed",
  source: "TEST: fixture",
  impact: "high",
  symbols: [],
  ...over,
});

const events: MarketEvent[] = [
  macro("treasury-7y-note-2026-09-24", "2026-09-24"),
  macro("jobs-2026-10-02", "2026-10-02"),
  macro("fomc-2026-10-28", "2026-10-28"),
  macro("aapl-launch-2026-10-06", "2026-10-06", {
    kind: "product-launch",
    title: "Apple launch event (Cupertino)",
    symbols: ["AAPL"],
  }),
];
const prints: EarningsPrint[] = [
  { symbol: "TSLA", date: "2026-10-15", status: "estimate", source: "8-K cadence" },
];

describe("nextEventFor", () => {
  it("puts the stock's own earnings first when it lands before expiry", () => {
    expect(nextEventFor("TSLA", "2026-10-17", asOf, events, prints)).toEqual({
      label: "Earnings Oct 15",
      at: "2026-10-15",
      beforeExpiry: true,
      scope: "stock",
    });
  });

  it("doesn't count a print on expiry day, which lands after the option has expired", () => {
    const e = nextEventFor("TSLA", "2026-10-15", asOf, events, prints);
    expect(e).toMatchObject({ label: "Jobs report Oct 2", scope: "market", beforeExpiry: true });
  });

  it("skips the long tail and names the next headline macro print instead", () => {
    expect(nextEventFor("MSFT", "2026-09-25", asOf, events, prints)).toEqual({
      label: "Jobs report Oct 2",
      at: "2026-10-02",
      beforeExpiry: false,
      scope: "market",
    });
  });

  it("names a stock's own high-impact event without its parenthetical", () => {
    expect(nextEventFor("AAPL", undefined, asOf, events, prints)).toMatchObject({
      label: "Apple launch event Oct 6",
      scope: "stock",
      beforeExpiry: false,
    });
  });

  it("gives shares their stock's print within 60 days, and never a before-expiry flag", () => {
    expect(nextEventFor("TSLA", undefined, asOf, events, prints)).toMatchObject({
      label: "Earnings Oct 15",
      beforeExpiry: false,
    });
  });
});

describe("the IV-crush decision", () => {
  it("warns a long option holding through its own print, even if the stock moves its way", () => {
    // the real calendar: MSFT prints Oct 27 (estimate), before a Nov 20 expiry
    const now = new Date(asOf);
    const p = { symbol: "MSFT261120C00500000", quantity: 2, avgPrice: 1500, marketValue: 1200 };
    const [d] = decisionsFor("eric", [{ ...p, plain: plainPosition(p, now) }], []);
    expect(d?.title).toBe("Earnings on Oct 27 could shrink this call even if MSFT rises");
    expect(d?.clocks).toContain("Earnings Oct 27");
    expect(d?.why).toMatch(/iv crush/);
    expect(d?.learn).toEqual({ term: "ivCrush", label: "What is IV crush?" });
    // "decide before the print" — so the print, not the expiry, is the day it's due
    expect(d?.due).toEqual({
      at: "2026-10-27",
      reason: "event",
      label: "Earnings Oct 27",
      estimated: true,
    });
  });
});

describe("nextPrintFor (#3977 slice 4)", () => {
  const book: EarningsPrint[] = [
    { symbol: "NVDA", date: "2026-08-26", status: "confirmed", source: "IR: fixture" },
    { symbol: "NVDA", date: "2026-11-18", status: "confirmed", source: "IR: fixture" },
    {
      symbol: "CRWV",
      date: "2026-11-10",
      status: "estimate",
      source: "8-K cadence",
      window: { start: "2026-11-09", end: "2026-11-16" },
    },
    { symbol: "MU", date: "2026-09-23", status: "confirmed", source: "IR: fixture" },
  ];

  it("names the next confirmed print, skipping one that already happened", () => {
    expect(nextPrintFor("NVDA", asOf, book)).toEqual({
      status: "confirmed",
      at: "2026-11-18",
      label: "Earnings Nov 18",
    });
  });

  it("says an estimate is an estimate, and keeps its bounded window", () => {
    expect(nextPrintFor("CRWV", asOf, book)).toEqual({
      status: "estimate",
      at: "2026-11-10",
      label: "Earnings Nov 10 (estimated)",
      window: { start: "2026-11-09", end: "2026-11-16" },
    });
  });

  it("counts a print today as upcoming — it lands after the close", () => {
    expect(nextPrintFor("MU", asOf, book)).toMatchObject({ at: "2026-09-23" });
  });

  it("never guesses a date for a symbol with no print on file", () => {
    expect(nextPrintFor("SPY", asOf, book)).toEqual({
      status: "unknown",
      label: "No earnings date on file",
    });
  });

  it("rides on every position, even an option whose print lands after it expires", () => {
    // the real calendar: MSFT prints Oct 27 (estimate); an Oct 17 call expires first, so its
    // nextEvent falls back to a macro print, while nextPrint still names the print
    const p = { symbol: "MSFT261017C00500000", quantity: 1, avgPrice: 500, marketValue: 400 };
    const plain = plainPosition(p, new Date(asOf));
    expect(plain.nextEvent?.scope).toBe("market");
    expect(plain.nextPrint).toEqual({
      status: "estimate",
      at: "2026-10-27",
      label: "Earnings Oct 27 (estimated)",
    });
  });
});
