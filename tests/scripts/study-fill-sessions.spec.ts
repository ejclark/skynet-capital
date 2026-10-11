import { describe, expect, it } from "@rstest/core";
import { buildBook } from "../../scripts/study/worlds/book.mjs";
import { describeFill, offSessionFills } from "../../scripts/study/worlds/fill-sessions.mjs";

// A study world never shows a fill production could not hold (#5208): profile-today's first
// inputs put two of Eric's buys on Saturdays, and the Activity frame showed a member trading on a
// closed market. Compose refuses a world with any fill outside a regular New York session.

const fill = (at: string) => ({
  orderId: "o",
  participantId: "p",
  symbol: "AAPL",
  side: "buy",
  at,
});
const book = (...at: string[]) => ({ activity: { p: at.map(fill) } });

describe("offSessionFills", () => {
  it("passes a fill inside a regular session", () => {
    // Thursday 2026-10-08, 11:00 New York.
    expect(offSessionFills(book("2026-10-08T15:00:00Z"))).toEqual([]);
  });

  it("refuses a Saturday fill and says when and whose", () => {
    const off = offSessionFills(book("2026-10-03T17:15:00Z"));
    expect(off.map(describeFill)).toEqual([
      "p buy AAPL (o) at 2026-10-03T17:15:00Z — no New York session is open",
    ]);
  });

  it("refuses a weekday fill before the open or at the close", () => {
    // 09:29 and 16:00 New York on a Thursday.
    expect(offSessionFills(book("2026-10-08T13:29:00Z", "2026-10-08T20:00:00Z"))).toHaveLength(2);
  });

  it("refuses a fill on an exchange holiday", () => {
    // Thanksgiving, 2026-11-26, noon New York.
    expect(offSessionFills(book("2026-11-26T17:00:00Z"))).toHaveLength(1);
  });
});

describe("every study world", () => {
  for (const world of ["profile-today", "profile-bad-day", "no-account"]) {
    it(`${world}: every fill, human or bot, lands in a New York session`, () => {
      expect(offSessionFills(buildBook(world)).map(describeFill)).toEqual([]);
    });
  }
});
