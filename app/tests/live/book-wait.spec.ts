import { type BookDesk, bookEventsIn, nextOnBook } from "../../src/live/book-events";
import { bookLanes, countsAround, glyphOf } from "../../src/live/book-lanes";
import { printChoices, reopenBounds } from "../../src/live/book-wait";
import type { NextPrint } from "../../src/live/desk";
import { ALL_RANGE, rangeFor } from "../../src/live/horizon-range";

/**
 * The wait on the whole book, on the book's calendar (#4608 slice 2). The study's day is Wed Nov 11,
 * 2026; Eric's book holds EEM shares (print Nov 19), an EEM call and NVDA (print estimated Nov 18),
 * and he has parked the whole book until Fri Nov 20 "until the Fed minutes land".
 */

const TODAY = "2026-11-11";
const print = (at: string, status: "confirmed" | "estimate" = "confirmed"): NextPrint => ({
  status,
  at,
  label: `Earnings ${at}`,
});
const ERIC: BookDesk = {
  desk: {
    id: "human-eric",
    positions: [
      { symbol: "EEM", quantity: "100", isOption: false, nextPrint: print("2026-11-19") },
      {
        symbol: "EEM261218C00050000",
        quantity: "2",
        isOption: true,
        nextPrint: print("2026-11-19"),
      },
      {
        symbol: "NVDA",
        quantity: "10",
        isOption: false,
        nextPrint: print("2026-11-18", "estimate"),
      },
      {
        symbol: "TSLA",
        quantity: "5",
        isOption: false,
        nextPrint: { status: "unknown", label: "Earnings date unknown" },
      },
    ],
  },
};
const WAIT = {
  deskId: "human-eric",
  reopensOn: "2026-11-20",
  reason: "until the Fed minutes land",
};

const everything = (waits = [WAIT]) =>
  bookEventsIn({ desks: [ERIC], events: [], calls: [], range: ALL_RANGE, lens: "month", waits });

describe("bookEventsIn — a wait's reopen day", () => {
  it("is a decide row on the whole book, on no position, saying the question is open again", () => {
    const wait = everything().decide.find((e) => e.book);
    expect(wait).toMatchObject({
      date: "2026-11-20",
      tier: "decide",
      mark: "Wait ends",
      book: { deskId: "human-eric" },
      touches: [],
    });
    expect(wait?.title).toContain("the question is open again");
    expect(wait?.title).toContain("until the Fed minutes land");
    expect(wait && glyphOf(wait)).toBe("decide");
  });

  it("stays off a range that does not hold the day", () => {
    const october = bookEventsIn({
      desks: [ERIC],
      events: [],
      calls: [],
      range: rangeFor("2026-10-15", "month"),
      lens: "month",
      waits: [WAIT],
    });
    expect(october.decide).toEqual([]);
  });

  it("adds nothing when no wait is recorded", () => {
    expect(everything([]).decide).toEqual([]);
  });

  it("counts as a date on the book, so an empty range can name it as next", () => {
    expect(countsAround(everything(), "2026-11-20").week).toBeGreaterThan(0);
    const onlyWait = bookEventsIn({
      desks: [{ desk: { id: "human-eric", positions: [] } }],
      events: [],
      calls: [],
      range: ALL_RANGE,
      lens: "month",
      waits: [WAIT],
    });
    expect(nextOnBook(onlyWait, TODAY)?.date).toBe("2026-11-20");
  });
});

describe("bookLanes — the book's own lane", () => {
  const november = bookLanes({
    desks: [ERIC],
    events: everything(),
    range: rangeFor("2026-11-20", "month"),
    today: TODAY,
  });

  it("draws the wait on one 'Your book' lane, a ⧗ with its words", () => {
    expect(
      november.book.map((l) => [l.name, l.marks.map((m) => [m.date, m.glyph, m.words])]),
    ).toEqual([["Your book", [["2026-11-20", "decide", "Wait ends"]]]]);
  });

  it("never lands the wait on a position's lane — a wait hides and moves nothing there", () => {
    for (const lane of november.holdings)
      expect(lane.marks.flatMap((m) => m.events).some((e) => e.book)).toBe(false);
  });

  it("pins the reopen day at the lane's edge when the range is before it", () => {
    const october = bookLanes({
      desks: [ERIC],
      events: everything(),
      range: rangeFor("2026-10-15", "month"),
      today: TODAY,
    });
    expect(october.book.map((l) => [l.marks.length, l.nextAfter?.date])).toEqual([
      [0, "2026-11-20"],
    ]);
  });

  it("draws no book lane without a wait", () => {
    expect(
      bookLanes({
        desks: [ERIC],
        events: everything([]),
        range: rangeFor("2026-11-20", "month"),
        today: TODAY,
      }).book,
    ).toEqual([]);
  });

  it("names the account beside 'Your book' when several are in view", () => {
    const other: BookDesk = { desk: { id: "bot-sauron", positions: [] } };
    const lanes = bookLanes({
      desks: [ERIC, other],
      events: bookEventsIn({
        desks: [ERIC, other],
        events: [],
        calls: [],
        range: ALL_RANGE,
        lens: "month",
        waits: [WAIT],
      }),
      range: rangeFor("2026-11-20", "month"),
      today: TODAY,
      accounts: new Map([
        ["human-eric", "Eric"],
        ["bot-sauron", "Sauron"],
      ]),
    });
    expect(lanes.book.map((l) => [l.name, l.detail])).toEqual([["Your book", "Eric"]]);
  });
});

describe("printChoices — the held names' next prints as reopen days", () => {
  it("offers each name once, soonest first, an estimate flagged, an unknown print never", () => {
    expect(printChoices(ERIC.desk, TODAY)).toEqual([
      { symbol: "NVDA", at: "2026-11-18", estimated: true },
      { symbol: "EEM", at: "2026-11-19", estimated: false },
    ]);
  });

  it("offers no print on or before today, or past a year out", () => {
    const desk: BookDesk["desk"] = {
      id: "x",
      positions: [
        { symbol: "A", quantity: "1", isOption: false, nextPrint: print(TODAY) },
        { symbol: "B", quantity: "1", isOption: false, nextPrint: print("2027-12-01") },
      ],
    };
    expect(printChoices(desk, TODAY)).toEqual([]);
  });

  it("offers nothing before the desk is read", () => {
    expect(printChoices(undefined, TODAY)).toEqual([]);
  });
});

describe("reopenBounds", () => {
  it("runs from tomorrow to a year out — the server's own bounds", () => {
    expect(reopenBounds(TODAY)).toEqual({ min: "2026-11-12", max: "2027-11-12" });
  });
});
