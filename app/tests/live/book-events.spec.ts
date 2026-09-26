import {
  type BookDesk,
  bookEventsIn,
  describeTouch,
  isHeadlineMacro,
  touchedPositions,
} from "../../src/live/book-events";
import type { PositionEvent } from "../../src/live/desk";
import { rangeFor } from "../../src/live/horizon-range";
import type { ResearchCall, ResearchEvent } from "../../src/live/research";

/**
 * The book's calendar (#3807 slice 2c) — the corpus joined to what a book holds, in two tiers,
 * over the three offline fixtures `held-events.spec.ts` dates: human-eric holds EEM (no print),
 * sauron NVDA + META (prints 2026-10-28), the day-trader NVDA + AAPL (prints 2026-10-29).
 */

const jobs: PositionEvent = {
  label: "Jobs report Oct 2",
  at: "2026-10-02",
  beforeExpiry: false,
  scope: "market",
};
const stock = (label: string, at: string): PositionEvent => ({
  label,
  at,
  beforeExpiry: false,
  scope: "stock",
});
const book = (id: string, rows: readonly [string, string, PositionEvent?][]): BookDesk => ({
  desk: {
    id,
    positions: rows.map(([symbol, quantity, nextEvent]) => ({
      symbol,
      quantity,
      isOption: symbol.length > 6,
      ...(nextEvent ? { nextEvent } : {}),
    })),
  },
});

const eric = book("human-eric", [["EEM", "12000", jobs]]);
const sauron = book("sauron", [
  ["NVDA", "40", jobs],
  ["META", "50", stock("Earnings Oct 28", "2026-10-28")],
]);
const dayTrader = book("day-trader", [
  ["NVDA", "100", jobs],
  ["NVDA261016C00180000", "3", jobs],
  ["NVDA261120C00200000", "2", jobs],
  ["AAPL", "200", stock("Earnings Oct 29", "2026-10-29")],
]);

const ev = (id: string, date: string, symbols: string[] = []): ResearchEvent => ({
  id,
  title: id,
  date,
  symbols,
  researched: false,
});
const EVENTS: ResearchEvent[] = [
  ev("jobs-2026-10-02", "2026-10-02"),
  ev("mrvl-investor-day-2026-10-06", "2026-10-06", ["MRVL"]),
  ev("cpi-2026-10-14", "2026-10-14"),
  ev("treasury-20y-bond-2026-10-21", "2026-10-21"),
  ev("aapl-iphone-duo-launch-2026-10-23", "2026-10-23", ["AAPL"]),
  ev("fomc-2026-10-28", "2026-10-28"),
  ev("meta-2026-10-28-print", "2026-10-28", ["META"]),
  ev("aapl-2026-10-29-print", "2026-10-29", ["AAPL"]),
  ev("nvda-2026-11-19-print", "2026-11-19", ["NVDA"]),
];
const CALLS: ResearchCall[] = [
  {
    eventId: "meta-2026-10-28-print",
    call: "Stand aside",
    horizon: "Today",
    href: "/research/events/meta-2026-10-28-print",
    horizons: {
      month: { call: "Stand aside into the print", horizon: "This month", confidence: "low" },
    },
  },
];
const october = rangeFor("2026-10-15", "month");
const join = (desk: BookDesk, range = october, events = EVENTS) =>
  bookEventsIn({ desks: [desk], events, calls: CALLS, range, lens: "month" });

describe("bookEventsIn — the three fixtures across October 2026", () => {
  it("counts held and market-wide per book", () => {
    const counts = [eric, sauron, dayTrader].map((b) => {
      const { held, market } = join(b);
      return [b.desk.id, held.length, market.length];
    });
    expect(counts).toEqual([
      ["human-eric", 0, 3],
      ["sauron", 1, 3],
      ["day-trader", 2, 3],
    ]);
  });

  it("keeps only the headline macro prints market-wide — never an auction or a name not held", () => {
    expect(join(dayTrader).market.map((e) => e.id)).toEqual([
      "jobs-2026-10-02",
      "cpi-2026-10-14",
      "fomc-2026-10-28",
    ]);
    expect(isHeadlineMacro(ev("treasury-20y-bond-2026-10-21", "2026-10-21"))).toBe(false);
    expect(join(dayTrader).held.map((e) => e.id)).not.toContain("mrvl-investor-day-2026-10-06");
  });

  it("carries the ledger's call under the lens, and the position it lands on", () => {
    const [meta] = join(sauron).held;
    expect(meta?.call).toEqual({
      call: "Stand aside into the print",
      horizon: "This month",
      confidence: "low",
      href: "/research/events/meta-2026-10-28-print",
    });
    expect(meta?.touches.map(describeTouch)).toEqual(["META · 50 shares · no expiry"]);
  });
});

describe("bookEventsIn — the range predicate", () => {
  it("includes both ends of the range and nothing outside it", () => {
    expect(join(sauron, rangeFor("2026-10-26", "week")).held.map((e) => e.date)).toEqual([
      "2026-10-28",
    ]);
    expect(
      join(dayTrader, { start: "2026-10-29", end: "2026-10-29" }).held.map((e) => e.id),
    ).toEqual(["aapl-2026-10-29-print"]);
    expect(join(dayTrader, { start: "2026-10-30", end: "2026-11-18" }).held).toEqual([]);
    expect(join(dayTrader, rangeFor("2026-11-19", "day")).held.map((e) => e.id)).toEqual([
      "nvda-2026-11-19-print",
    ]);
  });
});

describe("bookEventsIn — the backstop when the corpus is missing", () => {
  it("still dates each position's own next event, once per day", () => {
    const { held, market } = join(dayTrader, october, []);
    expect(held.map((e) => `${e.date} ${e.title}`)).toEqual(["2026-10-29 AAPL earnings"]);
    expect(market.map((e) => `${e.date} ${e.title}`)).toEqual(["2026-10-02 Jobs report"]);
  });
});

describe("touchedPositions — symbol · qty · next expiry", () => {
  it("folds shares and contracts on one underlying, with the soonest expiry", () => {
    const nvda = touchedPositions([dayTrader]).find((t) => t.symbol === "NVDA");
    expect(nvda).toMatchObject({
      shares: 100,
      contracts: 5,
      expiry: "2026-10-16",
      rowSymbol: "NVDA",
    });
    expect(nvda && describeTouch(nvda)).toBe(
      "NVDA · 100 shares · 5 contracts · next expiry Oct 16",
    );
  });
});
