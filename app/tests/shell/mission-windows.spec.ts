import type { BoardRow } from "../../src/live/board";
import type { EditionDate } from "../../src/live/edition";
import { moveFigure, type SectorRow, type SectorsView } from "../../src/live/edition-sectors";
import { calendarGlance, marketGlance, partyRows } from "../../src/shell/mission-windows";

/**
 * The Overview and Party glances of campaign mission control (#7487 slice 1). Every figure is read
 * from the edition or the booked board, and the Party is co-op: members list by name, never by
 * score; only The Tower stands apart, under "against".
 */

const sector = (name: string, week: number, market?: true): SectorRow => ({
  name,
  fund: name.slice(0, 3).toUpperCase(),
  ...(market ? { market } : {}),
  moves: { day: 0, week, month: 0, ytd: 0 },
  range: { low: 1, mid: 2, high: 3, close: 2 },
  trail: [],
});

const view = (rows: readonly SectorRow[]): SectorsView => ({
  source: "test",
  from: { day: "2026-11-10", week: "2026-11-04", month: "2026-10-11", ytd: "2026-01-02" },
  rangeSpan: { from: "2026-10-14", to: "2026-11-10" },
  rows,
});

describe("marketGlance", () => {
  it("says so in words when the edition carries no market view", () => {
    expect(marketGlance(undefined)).toEqual({ line: "The edition carries no market closes today" });
  });

  it("names the sectors that led and trailed the week, and the S&P's week as the figure", () => {
    const g = marketGlance(
      view([
        sector("S&P 500", 1.2, true),
        sector("Energy", -2.5),
        sector("Technology", 3.4),
        sector("Utilities", 0.4),
      ]),
    );
    expect(g.figure).toBe(`${moveFigure(1.2)} wk`);
    expect(g.line).toBe(
      `Leads: Technology ${moveFigure(3.4)} · trails: Energy ${moveFigure(-2.5)}`,
    );
    // The market row itself is never a leader or trailer.
    expect(g.line).not.toContain("S&P 500");
  });

  it("ranks by the week, not the day", () => {
    const rows = [
      { ...sector("Energy", 5), moves: { day: -9, week: 5, month: 0, ytd: 0 } },
      { ...sector("Materials", -1), moves: { day: 9, week: -1, month: 0, ytd: 0 } },
    ];
    expect(marketGlance(view(rows)).line).toMatch(/^Leads: Energy .* · trails: Materials /);
  });

  it("has no figure without a market row, and a plain line without sectors", () => {
    expect(marketGlance(view([sector("Energy", 1)])).figure).toBeUndefined();
    expect(marketGlance(view([sector("S&P 500", 1, true)]))).toEqual({
      figure: `${moveFigure(1)} wk`,
      line: "The week's moves by sector",
    });
  });
});

const dated = (what: string): EditionDate => ({ date: "2026-11-20", what, status: "confirmed" });

describe("calendarGlance", () => {
  it("says nothing is dated when the range is empty", () => {
    expect(calendarGlance([])).toBe("Nothing dated in this range");
  });

  it("lists up to two events with no count when that is all of them", () => {
    expect(calendarGlance([dated("CPI")])).toBe("CPI");
    expect(calendarGlance([dated("CPI"), dated("FOMC")])).toBe("CPI · FOMC");
  });

  it("counts the rest as N more", () => {
    expect(calendarGlance([dated("CPI"), dated("FOMC"), dated("NFP"), dated("GDP")])).toBe(
      "CPI · FOMC · 2 more",
    );
  });
});

const row = (name: string, kind: "human" | "bot", sortValue: number): BoardRow => ({
  key: `${kind}-${name}`,
  name,
  kind,
  value: String(sortValue),
  tone: "flat",
  bar: 0,
  sortValue,
});

describe("partyRows", () => {
  it("lists members by name, never by score", () => {
    const { members } = partyRows([
      row("Zed", "human", 900),
      row("amy", "human", -50),
      row("Mo", "human", 10),
    ]);
    expect(members.map((r) => r.name)).toEqual(["amy", "Mo", "Zed"]);
  });

  it("adds ranked members' booked P&L into the party total and leaves unranked out", () => {
    const { total } = partyRows([
      row("A", "human", 100),
      row("B", "human", -40),
      row("C", "human", -1e9),
      row("Tower", "bot", 5000),
    ]);
    expect(total).toBe(60);
  });

  it("puts only The Tower under against, by its key, named for members — never the franchise name", () => {
    const { members, against } = partyRows([
      row("Ann", "human", 10),
      { ...row("Sauron", "bot", 50), key: "sauron" },
      row("Probe", "bot", 2),
    ]);
    expect(members.map((r) => r.name)).toEqual(["Ann"]);
    expect(against.map((r) => r.name)).toEqual(["The Tower"]);
    expect(JSON.stringify(against)).not.toMatch(/"name":"Sauron"/);
  });

  it("an empty board is an empty party with a zero total", () => {
    expect(partyRows([])).toEqual({ members: [], against: [], total: 0 });
  });
});
