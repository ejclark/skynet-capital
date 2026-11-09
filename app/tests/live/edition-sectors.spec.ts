import {
  calendarDays,
  type EditionDate,
  type EditionStory,
  waitingOn,
} from "../../src/live/edition";
import {
  DEFAULT_LOOK,
  DEFAULT_PERIOD,
  LOOKS,
  moveFigure,
  moveShape,
  PERIODS,
  ranked,
  rememberLook,
  type SectorsView,
  scaleOf,
  sinceLine,
  storedLook,
} from "../../src/live/edition-sectors";

// The landing page's whole market and calendar, client side (#7077 slice 1b; #7018 round 3's
// AT1–AT5): the shapes and figures, the ranking, the member's kept view, and how the calendar groups
// its days and marks what a story waits on.

const moves = (week: number) => ({ day: 0, week, month: 0, ytd: 0 });
const view: SectorsView = {
  source: "spec",
  from: { day: "2026-11-05", week: "2026-10-30", month: "2026-10-06", ytd: "2025-12-31" },
  rows: [
    { name: "S&P 500", fund: "SPY", market: true, moves: moves(-2.7) },
    { name: "Technology", fund: "XLK", moves: moves(-8.23) },
    { name: "Energy", fund: "XLE", moves: moves(-12) },
    { name: "Communication Services", fund: "XLC", moves: moves(4.89) },
  ],
};

describe("the sector overview's words", () => {
  it("offers Day · Week · Month · YTD, Week first, and Bars · Lines · Tiles, Bars first (AT2, AT3)", () => {
    expect(PERIODS.map(([, w]) => w)).toEqual(["Day", "Week", "Month", "YTD"]);
    expect(DEFAULT_PERIOD).toBe("week");
    expect(LOOKS.map(([, w]) => w)).toEqual(["Bars", "Lines", "Tiles"]);
    expect(DEFAULT_LOOK).toBe("bars");
  });

  it("draws every move as ▲ ▼ ▬ with its word, and a move that rounds to zero as level (AT1)", () => {
    expect(moveShape(4.89)).toEqual({ glyph: "▲", word: "up" });
    expect(moveShape(-12)).toEqual({ glyph: "▼", word: "down" });
    expect(moveShape(-0.04)).toEqual({ glyph: "▬", word: "level" });
    expect(moveFigure(-12)).toBe("−12.0%");
    expect(moveFigure(4.89)).toBe("+4.9%");
    expect(moveFigure(-0.04)).toBe("0.0%");
  });

  it("ranks the sectors by the period's move with the market apart, so the biggest fall is last", () => {
    const { market, sectors } = ranked(view, "week");
    expect(market?.fund).toBe("SPY");
    expect(sectors.map((r) => r.fund)).toEqual(["XLC", "XLK", "XLE"]);
    expect(scaleOf(view, "week")).toBe(12);
    expect(scaleOf(view, "day")).toBe(0.1);
  });

  it("says what each period counts from", () => {
    expect(sinceLine(view, "week")).toBe("since the Fri, Oct 30 close");
    expect(sinceLine(view, "ytd")).toBe("since the Wed, Dec 31 close");
  });

  it("keeps the member's last view, and falls back to Bars on anything else (AT3)", () => {
    window.localStorage.removeItem("skynet.landing.sector-look");
    expect(storedLook()).toBe("bars");
    rememberLook("tiles");
    expect(storedLook()).toBe("tiles");
    window.localStorage.setItem("skynet.landing.sector-look", "pie");
    expect(storedLook()).toBe("bars");
  });
});

describe("the calendar", () => {
  const cpi: EditionDate = { date: "2026-11-10", what: "CPI", status: "confirmed" };
  const crwv: EditionDate = { date: "2026-11-10", what: "CRWV Q3", status: "confirmed" };
  const lockup: EditionDate = { date: "2026-11-09", what: "Lockup", status: "estimate" };

  it("groups the coming events by day, in date order (AT5)", () => {
    expect(calendarDays([cpi, lockup, crwv])).toEqual([
      { date: "2026-11-09", events: [lockup] },
      { date: "2026-11-10", events: [cpi, crwv] },
    ]);
  });

  it("finds the stories that wait on an event: the ones listing it among their reports (◆)", () => {
    const story = {
      id: "chips",
      headline: "Chips fell.",
      line: "Chips fell",
      symbols: [],
      facts: [],
      reports: [crwv],
      more: [],
    } satisfies EditionStory;
    expect(waitingOn(crwv, [story])).toEqual([story]);
    expect(waitingOn(cpi, [story])).toEqual([]);
  });
});
