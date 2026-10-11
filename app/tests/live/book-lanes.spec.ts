import { type BookDesk, bookEventsIn } from "../../src/live/book-events";
import {
  axisFor,
  bookLanes,
  bookLens,
  countsAround,
  glyphOf,
  inDays,
  placeWords,
  spreadTiles,
} from "../../src/live/book-lanes";
import type { NextPrint } from "../../src/live/desk";
import { ALL_RANGE, rangeFor } from "../../src/live/horizon-range";
import type { ResearchEvent } from "../../src/live/research";

/**
 * The calendar of what you hold, as lanes (#5074; #5037 round 2, the calendar's R2), over the
 * study's book on Thu Oct 8, 2026: NVDA 130 shares (print estimated Nov 18), CRWV 55 shares
 * (print estimated Nov 10) and one CRWV $80 put sold for Nov 6 with a decision due that day;
 * CPI Oct 14 and Nov 10, the Fed Oct 28, the jobs report Nov 6.
 */

const TODAY = "2026-10-08";
const estimate = (at: string): NextPrint => ({
  status: "estimate",
  at,
  label: `Earnings ${at} (estimated)`,
});
const PUT = "CRWV261106P00080000";
const SAURON: BookDesk = {
  desk: {
    id: "sauron",
    positions: [
      { symbol: "NVDA", quantity: "130", isOption: false, nextPrint: estimate("2026-11-18") },
      { symbol: "CRWV", quantity: "55", isOption: false, nextPrint: estimate("2026-11-10") },
      { symbol: PUT, quantity: "-1", isOption: true, nextPrint: estimate("2026-11-10") },
    ],
    decisions: [
      {
        id: "crwv-put-expiry",
        symbol: PUT,
        display: "CRWV Nov 6 $80 Put",
        title: "Expires in 29 days: keep, roll or buy back",
        due: { at: "2026-11-06", reason: "expiry", label: "Expires Nov 6" },
      },
    ],
  },
};
const macro = (id: string, title: string, date: string): ResearchEvent => ({
  id,
  title,
  date,
  symbols: [],
  researched: false,
});
const EVENTS: ResearchEvent[] = [
  macro("cpi-2026-10-14", "CPI release (Sep 2026 data)", "2026-10-14"),
  macro("fomc-2026-10-28", "FOMC decision (meeting Oct 27–28)", "2026-10-28"),
  macro("jobs-2026-11-06", "Employment Situation (Oct 2026 data)", "2026-11-06"),
  macro("cpi-2026-11-10", "CPI release (Oct 2026 data)", "2026-11-10"),
];

const everything = (desks: readonly BookDesk[] = [SAURON]) =>
  bookEventsIn({ desks, events: EVENTS, calls: [], range: ALL_RANGE, lens: "month" });
const lanesIn = (anchor: string, desks: readonly BookDesk[] = [SAURON]) =>
  bookLanes({
    desks,
    events: everything(desks),
    range: rangeFor(anchor, "month"),
    today: TODAY,
  });

describe("bookLanes — October, the month that holds nothing on this book", () => {
  const october = lanesIn(TODAY);

  it("draws one lane per position, named the way the positions list names it", () => {
    expect(october.holdings.map((l) => [l.name, l.detail])).toEqual([
      ["NVDA", "130 shares"],
      ["CRWV", "55 shares"],
      ["CRWV $80 short put", "29d"],
    ]);
  });

  it("pins each lane's next date at its edge: the print estimates, then the put's decide-by", () => {
    expect(october.holdings.map((l) => l.marks.length)).toEqual([0, 0, 0]);
    expect(october.holdings.map((l) => [l.nextAfter?.date, l.nextAfter?.glyph])).toEqual([
      ["2026-11-18", "estimated"],
      ["2026-11-10", "estimated"],
      ["2026-11-06", "decide"],
    ]);
  });

  it("puts CPI and the Fed on the market-wide lane, in short words", () => {
    expect(october.market.marks.map((m) => [m.date, m.glyph, m.words])).toEqual([
      ["2026-10-14", "market", "CPI"],
      ["2026-10-28", "market", "Fed"],
    ]);
  });
});

describe("bookLanes — November, after one tap on the put's edge", () => {
  const november = lanesIn("2026-11-06");

  it("marks each date on its own lane, the estimate said in words", () => {
    expect(november.holdings.map((l) => l.marks.map((m) => [m.date, m.glyph, m.words]))).toEqual([
      [["2026-11-18", "estimated", "Earnings · estimated"]],
      [["2026-11-10", "estimated", "Earnings · estimated"]],
      [["2026-11-06", "decide", "Expires"]],
    ]);
    expect(november.market.marks.map((m) => m.words)).toEqual(["Jobs", "CPI"]);
  });

  it("keeps CRWV's print off the put's lane — it lands after the put expires", () => {
    const put = november.holdings[2];
    expect(put?.marks.map((m) => m.date)).toEqual(["2026-11-06"]);
    expect(put?.nextAfter).toBeUndefined();
  });
});

describe("bookLanes — one mark per lane and day, the decision first", () => {
  it("draws ▲ when a decision is due on the day of the print it is about", () => {
    const desk: BookDesk = {
      desk: {
        id: "sauron",
        positions: [
          { symbol: "META", quantity: "50", isOption: false, nextPrint: estimate("2026-10-28") },
        ],
        decisions: [
          {
            id: "lock-meta",
            symbol: "META",
            display: "META",
            title: "Up 42%: consider locking some of it in",
            due: { at: "2026-10-28", reason: "event", label: "Earnings Oct 28", estimated: true },
          },
        ],
      },
    };
    const [meta] = lanesIn("2026-10-15", [desk]).holdings;
    expect(meta?.marks).toHaveLength(1);
    expect(meta?.marks[0]?.glyph).toBe("decide");
    expect(meta?.marks[0]?.events.map(glyphOf)).toEqual(["decide", "estimated"]);
  });

  it("dates an option's expiry when no decision is due on it — a confirmed date", () => {
    const desk: BookDesk = {
      desk: {
        id: "day-trader",
        positions: [{ symbol: "NVDA261016C00180000", quantity: "3", isOption: true }],
      },
    };
    const [call] = lanesIn("2026-10-15", [desk]).holdings;
    expect(call?.name).toBe("NVDA $180 long call");
    expect(call?.detail).toBe("3 contracts · 8d");
    expect(call?.marks.map((m) => [m.date, m.glyph, m.words])).toEqual([
      ["2026-10-16", "confirmed", "Expires"],
    ]);
  });
});

describe("bookLanes — a long book stays short", () => {
  it("folds holdings with nothing in or after the range into one line of names", () => {
    const desk: BookDesk = {
      desk: {
        id: "sauron",
        positions: [
          ...SAURON.desk.positions,
          { symbol: "TSLA", quantity: "10", isOption: false },
          { symbol: "SPY", quantity: "5", isOption: false },
        ],
        decisions: SAURON.desk.decisions ?? [],
      },
    };
    const lanes = lanesIn(TODAY, [desk]);
    expect(lanes.holdings).toHaveLength(3);
    expect(lanes.folded).toEqual(["TSLA", "SPY"]);
  });

  it("names the account on every lane when more than one book is in view", () => {
    const eric: BookDesk = {
      desk: { id: "human-eric", positions: [{ symbol: "EEM", quantity: "100", isOption: false }] },
    };
    const desks = [SAURON, eric];
    const lanes = bookLanes({
      desks,
      events: everything(desks),
      range: rangeFor(TODAY, "month"),
      today: TODAY,
      accounts: new Map([["sauron", "Sauron"]]),
    });
    expect(lanes.holdings[0]?.detail).toBe("130 shares · Sauron");
    expect(lanes.folded).toEqual(["EEM"]);
  });
});

describe("countsAround — what each range option shows", () => {
  it("counts dates on what you hold, never market-wide ones, around the same day", () => {
    expect(countsAround(everything(), TODAY)).toEqual({ week: 0, month: 0, quarter: 3 });
    expect(countsAround(everything(), "2026-11-06")).toEqual({ week: 1, month: 3, quarter: 3 });
  });
});

describe("the page's lens and the axis", () => {
  it("reads a shared day as its week, and the unbounded all lens as its month", () => {
    expect(["day", "week", "month", "quarter", "all"].map(bookLens)).toEqual([
      "week",
      "week",
      "month",
      "quarter",
      "month",
    ]);
  });

  it("ticks each Monday on a month, each day on a week, each month on a quarter", () => {
    const month = axisFor(rangeFor(TODAY, "month"), "month");
    expect(month.days).toHaveLength(31);
    expect(month.ticks).toEqual([
      { index: 4, label: "Oct 5" },
      { index: 11, label: "12" },
      { index: 18, label: "19" },
      { index: 25, label: "26" },
    ]);
    expect(axisFor(rangeFor(TODAY, "week"), "week").ticks.map((t) => t.label)).toEqual([
      "Mon 5",
      "Tue 6",
      "Wed 7",
      "Thu 8",
      "Fri 9",
      "Sat 10",
      "Sun 11",
    ]);
    expect(axisFor(rangeFor(TODAY, "quarter"), "quarter").ticks.map((t) => t.label)).toEqual([
      "Oct",
      "Nov",
      "Dec",
    ]);
  });
});

describe("placeWords — words only where they fit", () => {
  it("puts words after a glyph with room, before one near the end, none when crowded", () => {
    // 30 days across 330px: 11px a day.
    expect(placeWords([{ index: 5, words: "Jobs" }], 30, 330)).toEqual(["after"]);
    expect(placeWords([{ index: 28, words: "Earnings" }], 30, 330)).toEqual(["before"]);
    // Two days apart near the start: the first has no room either side; the second takes after.
    expect(
      placeWords(
        [
          { index: 5, words: "Earnings · estimated" },
          { index: 7, words: "Earnings · estimated" },
        ],
        30,
        330,
      ),
    ).toEqual([null, "after"]);
  });
});

describe("spreadTiles — a tile never covers the one beside it", () => {
  // A 24px step (the 22px tile and a gap) on a 330px track.
  const spread = (centres: number[]) => spreadTiles(centres, 24, 330);

  it("leaves a tile on its day when it has room, even at the track's ends", () => {
    expect(spread([5.5, 93.5, 120, 324.5])).toEqual([5.5, 93.5, 120, 324.5]);
  });

  it("spreads a decision and the print the next day a tile apart, around their middle", () => {
    // A month: 11px a day, so Nov 9 and Nov 10 sit 11px apart.
    expect(spread([93.5, 104.5])).toEqual([87, 111]);
    // A quarter: a run of three days ~4px apart spreads around the middle one.
    expect(spread([100, 104, 108])).toEqual([80, 104, 128]);
  });

  it("folds a run that spreads into its neighbour into one run", () => {
    // The first two spread to 93 and 117, which now crowds 135: all three share one middle.
    expect(spread([100, 110, 135])).toEqual([91, 115, 139]);
  });

  it("keeps a run inside the track, its outermost tile on its own day", () => {
    expect(spread([2, 6])).toEqual([2, 26]);
    expect(spread([322, 326])).toEqual([302, 326]);
  });
});

describe("inDays", () => {
  it("says how far off a date is", () => {
    expect([TODAY, "2026-10-09", "2026-11-06"].map((d) => inDays(TODAY, d))).toEqual([
      "today",
      "tomorrow",
      "in 29 days",
    ]);
  });
});
