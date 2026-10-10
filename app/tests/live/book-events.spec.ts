import {
  type BookDesk,
  bookEventsIn,
  describeTouch,
  isHeadlineMacro,
  nextOnBook,
  touchedPositions,
} from "../../src/live/book-events";
import type { DecisionDue, NextPrint, PositionEvent } from "../../src/live/desk";
import { ALL_RANGE as ALL, rangeFor } from "../../src/live/horizon-range";
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
    expect([eric, sauron, dayTrader].map((b) => join(b).decide.length)).toEqual([0, 0, 0]);
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

describe("bookEventsIn — the book's own days (#3977 slice 4)", () => {
  const print = (status: "confirmed" | "estimate", at: string): NextPrint => ({
    status,
    at,
    label: `Earnings ${at}${status === "estimate" ? " (estimated)" : ""}`,
  });
  const unknown: NextPrint = { status: "unknown", label: "Earnings date unknown" };
  const withPrints = (
    id: string,
    rows: readonly [string, NextPrint][],
    decisions: BookDesk["desk"]["decisions"] = [],
  ): BookDesk => ({
    desk: {
      id,
      positions: rows.map(([symbol, nextPrint]) => ({
        symbol,
        quantity: "10",
        isOption: symbol.length > 6,
        nextPrint,
      })),
      decisions,
    },
  });
  const decision = (id: string, symbol: string, display: string, due?: DecisionDue) => ({
    id,
    symbol,
    display,
    title: "Up 42%: consider locking some of it in",
    ...(due ? { due } : {}),
  });

  it("marks a held name's next print the corpus lacks, and an estimate says so in words", () => {
    const desk = withPrints("sauron", [
      ["TSLA", print("confirmed", "2026-10-21")],
      ["AMD", print("estimate", "2026-10-27")],
    ]);
    expect(join(desk, october, []).held.map((e) => `${e.date} ${e.title}`)).toEqual([
      "2026-10-21 TSLA earnings",
      "2026-10-27 AMD earnings (estimated date)",
    ]);
  });

  it("never marks an unknown print — no date is guessed", () => {
    const desk = withPrints("sauron", [["AMD", unknown]]);
    expect(join(desk, ALL, []).held).toEqual([]);
  });

  it("adds no second row when the corpus already has that print, or the next event repeats it", () => {
    const desk: BookDesk = {
      desk: {
        id: "sauron",
        positions: [
          {
            symbol: "META",
            quantity: "50",
            isOption: false,
            nextPrint: print("confirmed", "2026-10-28"),
            nextEvent: stock("Earnings Oct 28", "2026-10-28"),
          },
        ],
      },
    };
    expect(join(desk).held.map((e) => e.id)).toEqual(["meta-2026-10-28-print"]);
    expect(join(desk, october, []).held.map((e) => e.id)).toEqual(["print META 2026-10-28"]);
  });

  it("puts each decision's due day in its own tier, landing on the held row", () => {
    const desk = withPrints(
      "day-trader",
      [["NVDA261016C00180000", unknown]],
      [
        decision("lock-nvda", "NVDA261016C00180000", "NVDA Oct 16 $180 call", {
          at: "2026-10-16",
          reason: "expiry",
          label: "Expires Oct 16",
        }),
        decision("iv-amd", "AMD", "AMD", {
          at: "2026-10-27",
          reason: "event",
          label: "Earnings Oct 27",
          estimated: true,
        }),
        decision("idea", "MRVL", "MRVL"),
      ],
    );
    const { decide } = join(desk, october, []);
    expect(decide.map((e) => [e.date, e.tier, e.title])).toEqual([
      [
        "2026-10-16",
        "decide",
        "NVDA Oct 16 $180 call — Up 42%: consider locking some of it in (Expires Oct 16)",
      ],
      [
        "2026-10-27",
        "decide",
        "AMD — Up 42%: consider locking some of it in (Earnings Oct 27, estimated date)",
      ],
    ]);
    expect(decide[0]?.touches.map((t) => t.rowSymbol)).toEqual(["NVDA261016C00180000"]);
    expect(join(desk, rangeFor("2026-11-02", "week"), []).decide).toEqual([]);
  });
});

describe("nextOnBook — what an empty range names (#5045)", () => {
  const all = (desk: BookDesk) => join(desk, ALL);

  it("is the earliest event on what you hold after the range — never a market-wide print", () => {
    expect(nextOnBook(all(sauron), "2026-10-11")?.id).toBe("meta-2026-10-28-print");
    expect(nextOnBook(all(dayTrader), "2026-10-11")?.id).toBe("aapl-iphone-duo-launch-2026-10-23");
    // EEM has no print: the jobs report, CPI and the Fed are market-wide, so nothing is named.
    expect(nextOnBook(all(eric), "2026-10-11")).toBeUndefined();
  });

  it("starts the day after the range ends, and is undefined when nothing later is dated", () => {
    expect(nextOnBook(all(sauron), "2026-10-27")?.date).toBe("2026-10-28");
    expect(nextOnBook(all(sauron), "2026-10-28")?.id).toBe("nvda-2026-11-19-print");
    expect(nextOnBook(all(sauron), "2026-11-19")).toBeUndefined();
  });

  it("leads with a decision due on the same day as a held event", () => {
    const due: BookDesk = {
      desk: {
        ...sauron.desk,
        decisions: [
          {
            id: "lock-meta",
            symbol: "META",
            display: "META",
            title: "Up 42%: consider locking some of it in",
            due: { at: "2026-10-28", reason: "event", label: "Earnings Oct 28" },
          },
        ],
      },
    };
    expect(nextOnBook(all(due), "2026-10-11")?.tier).toBe("decide");
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
