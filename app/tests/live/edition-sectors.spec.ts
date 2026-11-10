import {
  calendarDays,
  calendarWeeks,
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
  rangeMark,
  ranked,
  rememberLook,
  type SectorsView,
  sinceLine,
  storedLook,
  trailChart,
} from "../../src/live/edition-sectors";

// The landing page's whole market and calendar, client side (#7077 slice 1b; #7018 round 3's
// AT1–AT5): the shapes and figures, the ranking, the member's kept view, and how the calendar groups
// its days and marks what a story waits on.

const moves = (week: number) => ({ day: 0, week, month: 0, ytd: 0 });
const range = { low: 90, mid: 100, high: 110, close: 100 };
const trail = [100, 100];
const view: SectorsView = {
  source: "spec",
  from: { day: "2026-11-05", week: "2026-10-30", month: "2026-10-06", ytd: "2025-12-31" },
  rangeSpan: { from: "2026-10-12", to: "2026-11-06" },
  rows: [
    { name: "S&P 500", fund: "SPY", market: true, moves: moves(-2.7), range, trail },
    { name: "Technology", fund: "XLK", moves: moves(-8.23), range, trail },
    { name: "Energy", fund: "XLE", moves: moves(-12), range, trail },
    { name: "Communication Services", fund: "XLC", moves: moves(4.89), range, trail },
  ],
};

describe("the sector overview's words", () => {
  it("offers Day · Week · Month · YTD, Week first, and Lines · Tiles, Lines first (AT2, AT3 revised)", () => {
    expect(PERIODS.map(([, w]) => w)).toEqual(["Day", "Week", "Month", "YTD"]);
    expect(DEFAULT_PERIOD).toBe("week");
    expect(LOOKS.map(([, w]) => w)).toEqual(["Lines", "Tiles"]);
    expect(DEFAULT_LOOK).toBe("lines");
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
  });

  it("says what each period counts from", () => {
    expect(sinceLine(view, "week")).toBe("since the Fri, Oct 30 close");
    expect(sinceLine(view, "ytd")).toBe("since the Wed, Dec 31 close");
  });

  it("keeps the member's last view, and opens a kept Bars, or anything else, on Lines (AT3)", () => {
    window.localStorage.removeItem("skynet.landing.sector-look");
    expect(storedLook()).toBe("lines");
    rememberLook("tiles");
    expect(storedLook()).toBe("tiles");
    window.localStorage.setItem("skynet.landing.sector-look", "bars");
    expect(storedLook()).toBe("lines");
    window.localStorage.setItem("skynet.landing.sector-look", "pie");
    expect(storedLook()).toBe("lines");
  });
});

describe("the 20-day range mark (AT8)", () => {
  it("puts the tick inside the band for a close within it, and says nothing in words", () => {
    const mid = rangeMark(range);
    expect(mid).toMatchObject({ zone: "within", at: 0.5 });
    expect(mid.word).toBeUndefined();
    expect(mid.label).toBe(
      "in its usual range, middle: closed at $100.00, 20-day range $90.00 to $110.00",
    );
    expect(rangeMark({ ...range, close: 110 }).at).toBeCloseTo(0.8);
    expect(rangeMark({ ...range, close: 90 }).at).toBeCloseTo(0.2);
    expect(rangeMark({ ...range, close: 108 }).label).toMatch(/^in its usual range, upper third/);
  });

  it("names only the extremes, and pins a far close short of the track's edge", () => {
    const below = rangeMark({ ...range, close: 85 });
    expect(below).toMatchObject({ zone: "below", word: "below its usual range" });
    expect(below.at).toBeLessThan(0.2);
    expect(rangeMark({ ...range, close: 400 })).toMatchObject({
      zone: "above",
      word: "above its usual range",
      at: 0.96,
    });
    expect(rangeMark({ ...range, close: 1 }).at).toBe(0.04);
  });

  it("never words a range as a buy or a sell", () => {
    for (const close of [1, 85, 95, 100, 105, 115, 400]) {
      const { word, label } = rangeMark({ ...range, close });
      expect(`${word ?? ""} ${label}`).not.toMatch(
        /\b(buy|sell|overbought|oversold|cheap|expensive|stretched|bargain|opportunity)\b/i,
      );
    }
  });

  it("draws a band with no width as the middle, never dividing by zero", () => {
    const flat = { low: 50, mid: 50, high: 50, close: 50 };
    expect(rangeMark(flat)).toMatchObject({ zone: "within", at: 0.5 });
  });
});

describe("the wide chart: the 20 closes inside their band (AT12, round 8 Q4 B)", () => {
  const row = (closes: readonly number[], band: typeof range) => ({
    name: "Energy",
    fund: "XLE",
    moves: moves(0),
    range: band,
    trail: closes,
  });

  it("runs the closes oldest to newest across the whole width, the dot on the last", () => {
    const chart = trailChart(row([95, 100, 105], range));
    expect(chart.points.map((p) => p.x)).toEqual([0, 50, 100]);
    expect(chart.last).toEqual(chart.points[2]);
  });

  it("draws a higher price higher up, and the band from its ceiling down to its floor", () => {
    const chart = trailChart(row([95, 100, 105], range));
    const [a, b, c] = chart.points.map((p) => p.y) as [number, number, number];
    expect(a).toBeGreaterThan(b);
    expect(b).toBeGreaterThan(c);
    expect(chart.bandTop).toBeLessThan(chart.bandBottom);
    // Inside the band, every close sits between its edges.
    for (const p of chart.points) {
      expect(p.y).toBeGreaterThan(chart.bandTop);
      expect(p.y).toBeLessThan(chart.bandBottom);
    }
  });

  it("draws a close below the band below it, and never past the chart's own edge", () => {
    const chart = trailChart(row([100, 102, 80], range));
    expect(chart.last.y).toBeGreaterThan(chart.bandBottom);
    for (const y of [...chart.points.map((p) => p.y), chart.bandTop, chart.bandBottom]) {
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(100);
    }
  });

  it("draws a band with no width and level closes across the middle, never dividing by zero", () => {
    const flat = { low: 50, mid: 50, high: 50, close: 50 };
    const chart = trailChart(row([50, 50], flat));
    expect(chart.points.every((p) => p.y === 50)).toBe(true);
    expect(chart.bandTop).toBe(50);
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

  it("groups the days under week headers counted from today, naming the week's closures (AT5b)", () => {
    const days = calendarDays([
      cpi,
      lockup,
      { date: "2026-11-17", what: "NVDA Q3", status: "confirmed" },
      { date: "2026-11-24", what: "Durable goods", status: "estimate" },
    ]);
    const weeks = calendarWeeks("2026-11-06", days, "2026-11-09");
    expect(weeks.map((w) => w.title)).toEqual([
      "Last week · Mon 2 – Fri 6",
      "This week · Mon 9 – Fri 13",
      "Next week · Mon 16 – Fri 20",
      "In 2 weeks · Mon 23 – Fri 27",
    ]);
    expect(weeks.map((w) => w.stories)).toEqual([true, false, false, false]);
    expect(weeks[0]?.days).toEqual([]);
    expect(weeks[1]?.days.map((d) => d.date)).toEqual(["2026-11-09", "2026-11-10"]);
    expect(weeks[3]?.closures).toEqual([
      "Closed Thu 26, Thanksgiving Day",
      "Closes at 1:00 p.m. Fri 27, Day after Thanksgiving",
    ]);
    expect(weeks[1]?.closures).toEqual([]);
  });

  it('reads a weekend as the eve of the coming week, so Sunday\'s "this week" is the one ahead', () => {
    const days = calendarDays([cpi]);
    for (const weekend of ["2026-11-07", "2026-11-08"])
      expect(calendarWeeks("2026-11-06", days, weekend).map((w) => w.title)).toEqual([
        "Last week · Mon 2 – Fri 6",
        "This week · Mon 9 – Fri 13",
      ]);
    expect(calendarWeeks("2026-11-06", days, "2026-11-06")[0]?.title).toBe(
      "This week · Mon 2 – Fri 6",
    );
  });

  it("names the month when a week crosses one, and keeps the edition's own week when it is today's", () => {
    const days = calendarDays([{ date: "2026-12-01", what: "ISM", status: "confirmed" }]);
    const weeks = calendarWeeks("2026-11-25", days, "2026-11-25");
    expect(weeks.map((w) => w.title)).toEqual([
      "This week · Mon 23 – Fri 27",
      "Next week · Mon 30 Nov – Fri 4 Dec",
    ]);
    expect(weeks[0]?.stories).toBe(true);
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
