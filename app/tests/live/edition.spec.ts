import {
  asOfLine,
  dateLine,
  type Edition,
  MARK_WORD,
  STALE_AFTER_DAYS,
  staleLine,
} from "../../src/live/edition";

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
});
