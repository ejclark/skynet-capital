import type { PositionEvent } from "../../src/live/desk";
import {
  describeHeldEvent,
  type HeldBook,
  heldEventsIn,
  underlyingOf,
} from "../../src/live/held-events";
import { rangeFor } from "../../src/live/horizon-range";

/**
 * The by-day direction of the server's per-position `nextEvent` join (#3807 slice 2·1), over the
 * three offline fixtures as `src/observatory/position-event.ts` would date them in late September
 * 2026 from the checked-in calendars: `human-eric` holds EEM, an ETF with no print, so its next
 * event is the headline macro print — the jobs report of 2026-10-02 (`jobs-2026-10-02.json`);
 * `sauron` holds NVDA (its Aug 26 print is behind us — the jobs report again) and META (prints
 * 2026-10-28, `earnings-calendar.ts`); `day-trader` holds NVDA and AAPL (prints 2026-10-29).
 */

const jobs: PositionEvent = {
  label: "Jobs report Oct 2",
  at: "2026-10-02",
  beforeExpiry: false,
  scope: "market",
};
const metaPrint: PositionEvent = {
  label: "Earnings Oct 28",
  at: "2026-10-28",
  beforeExpiry: false,
  scope: "stock",
};
const aaplPrint: PositionEvent = { ...metaPrint, label: "Earnings Oct 29", at: "2026-10-29" };

const book = (id: string, positions: readonly [string, PositionEvent | undefined][]): HeldBook => ({
  desk: { id, positions: positions.map(([symbol, nextEvent]) => ({ symbol, nextEvent })) },
});

const eric = book("human-eric", [["EEM", jobs]]);
const sauron = book("sauron", [
  ["NVDA", jobs],
  ["META", metaPrint],
]);
const dayTrader = book("day-trader", [
  ["NVDA", jobs],
  ["AAPL", aaplPrint],
]);

const weekOf = (day: string) => rangeFor(day, "week");
const october = rangeFor("2026-10-15", "month");

describe("heldEventsIn — the three fixtures", () => {
  it("finds nothing held for Eric the week of Sep 28, with the jobs report market-wide", () => {
    const line = heldEventsIn([eric], weekOf("2026-09-28"));
    expect(line.held).toEqual([]);
    expect(line.market).toEqual([
      { ...jobs, symbol: "EEM", deskId: "human-eric", positions: 1, beforeExpiry: undefined },
    ]);
    expect(line.positions).toBe(1);
  });

  it("finds META's print for Sauron the week of Oct 26, and no market print in that week", () => {
    const line = heldEventsIn([sauron], weekOf("2026-10-26"));
    expect(line.held.map((e) => `${e.symbol} ${e.label}`)).toEqual(["META Earnings Oct 28"]);
    expect(line.market).toEqual([]);
  });

  it("finds AAPL's print and the jobs report for the day-trader across October", () => {
    const line = heldEventsIn([dayTrader], october);
    expect(line.held.map((e) => `${e.symbol} ${e.label}`)).toEqual(["AAPL Earnings Oct 29"]);
    expect(line.market.map((e) => e.label)).toEqual(["Jobs report Oct 2"]);
  });

  it("counts held days per month below the panel's two — the market tier leads by default (F7)", () => {
    for (const [fixture, heldDays] of [
      [eric, 0],
      [sauron, 1],
      [dayTrader, 1],
    ] as const) {
      expect(heldEventsIn([fixture], october).held).toHaveLength(heldDays);
    }
  });
});

describe("heldEventsIn — the join's shape", () => {
  it("folds shares and a call on the same name into one held entry, by the underlying", () => {
    const line = heldEventsIn(
      [
        book("x", [
          ["META", metaPrint],
          ["META261120C00700000", { ...metaPrint, beforeExpiry: true }],
        ]),
      ],
      october,
    );
    expect(line.held).toHaveLength(1);
    expect(line.held[0]).toMatchObject({ symbol: "META", positions: 2, deskId: "x" });
    expect(underlyingOf("META261120C00700000")).toBe("META");
    expect(underlyingOf("EEM")).toBe("EEM");
  });

  it("names one market-wide print once however many positions carry it, and aggregates desks", () => {
    const line = heldEventsIn([sauron, dayTrader], october);
    expect(line.market).toHaveLength(1);
    expect(line.market[0]?.positions).toBe(2);
    expect(line.held.map((e) => e.symbol)).toEqual(["META", "AAPL"]);
    expect(line.positions).toBe(4);
  });

  it("sorts by date, then by name", () => {
    const line = heldEventsIn([dayTrader, sauron], rangeFor("2026-10-01", "quarter"));
    expect(line.held.map((e) => e.at)).toEqual(["2026-10-28", "2026-10-29"]);
  });

  it("reads an empty book as zero positions — its own honest state", () => {
    expect(heldEventsIn([book("empty", [])], october)).toEqual({
      held: [],
      market: [],
      positions: 0,
    });
    expect(heldEventsIn([book("undated", [["EEM", undefined]])], october).positions).toBe(1);
  });

  it("puts every dated event inside the all lens's range", () => {
    expect(heldEventsIn([sauron], rangeFor("2026-09-28", "all")).held).toHaveLength(1);
  });
});

describe("describeHeldEvent", () => {
  it("adds the weekday the Monday read wants to the server's words", () => {
    expect(describeHeldEvent(jobs)).toBe("Jobs report Fri Oct 2");
    expect(describeHeldEvent(metaPrint)).toBe("Earnings Wed Oct 28");
  });

  it("passes an unfamiliar label through with its date beside it", () => {
    expect(describeHeldEvent({ label: "Court date", at: "2026-10-05" })).toBe(
      "Court date · Mon 2026-10-05",
    );
  });
});
