import {
  asOfLine,
  dateLine,
  datesIn,
  type Edition,
  MARK_WORD,
  MOVE_SHAPE,
  planningDay,
  STALE_AFTER_DAYS,
  staleLine,
} from "../../src/live/edition";
import { rangeFor } from "../../src/live/horizon-range";

// The landing page's words for the edition (#7077): whose close it is, how old it is, and how a
// dated item reads. The honesty checks on the copy itself run in the server's loader.

const edition = (ageDays: number): Edition => ({
  date: "2026-11-06",
  writtenBy: "by hand",
  ageDays,
  stories: [],
  next: [],
});

describe("the edition's words", () => {
  it("names the close the news describes", () => {
    expect(asOfLine(edition(2))).toBe("As of the Fri, Nov 6 close");
  });

  it("says nothing about age over a weekend, and says it plainly after", () => {
    expect(staleLine(edition(STALE_AFTER_DAYS))).toBeUndefined();
    expect(staleLine(edition(25))).toBe(
      "No newer edition has been written yet, so this news is 25 days old.",
    );
  });

  it("reads a dated item with its time, and marks an estimate and a passed report in words", () => {
    expect(
      dateLine({ date: "2026-11-10", when: "after the close", what: "x", status: "confirmed" }),
    ).toBe("Tue, Nov 10 · after the close");
    expect(dateLine({ date: "2026-11-13", what: "x", status: "estimate" })).toBe(
      "Fri, Nov 13 · estimate",
    );
    expect(dateLine({ date: "2026-11-10", what: "x", status: "confirmed", passed: true })).toBe(
      "Tue, Nov 10 · passed",
    );
  });

  it("marks a reported line as unconfirmed and a modeled one as modeled (criterion 7)", () => {
    expect(MARK_WORD.reported).toMatch(/unconfirmed/);
    expect(MARK_WORD.modeled).toBe("Modeled");
  });

  it("draws each move as a distinct shape with its word, never a colour (docs/IA.md §5.9)", () => {
    const glyphs = Object.values(MOVE_SHAPE).map((m) => m.glyph);
    expect(new Set(glyphs).size).toBe(3);
    expect(MOVE_SHAPE.mixed).toEqual({ glyph: "∿", word: "mixed" });
  });
});

// Slice 1d (AT10): the landing calendar is R&D's, so a range picks which coming dates show.
describe("the landing calendar's range", () => {
  it("builds the range around today on a weekday, and around the coming Monday on a weekend", () => {
    expect(planningDay("2026-11-10")).toBe("2026-11-10");
    expect(planningDay("2026-11-07")).toBe("2026-11-09");
    expect(planningDay("2026-11-08")).toBe("2026-11-09");
  });

  const next = [
    { date: "2026-11-17", what: "NVIDIA (NVDA) Q3 results", status: "confirmed" as const },
    { date: "2026-11-10", what: "October consumer prices (CPI)", status: "confirmed" as const },
    { date: "2026-11-13", what: "October producer prices (PPI)", status: "estimate" as const },
  ];

  it("keeps the dates inside the range in order, and names the first one after it", () => {
    const { inside, after } = datesIn(next, rangeFor("2026-11-09", "week"));
    expect(inside.map((d) => d.date)).toEqual(["2026-11-10", "2026-11-13"]);
    expect(after?.what).toBe("NVIDIA (NVDA) Q3 results");
  });

  it("finds nothing in an empty range and still points at the next date, or at none past the last", () => {
    const empty = datesIn(next, rangeFor("2026-11-02", "week"));
    expect(empty.inside).toEqual([]);
    expect(empty.after?.date).toBe("2026-11-10");
    expect(datesIn(next, rangeFor("2026-11-23", "week")).after).toBeUndefined();
  });
});
