import { MAX_OUTLOOK_SYMBOLS, outlooksFor } from "../../src/server/outlook-route.js";

/**
 * `outlooksFor` — the light symbol-summary lookup behind GET /api/research/outlook (#4807 slice 4).
 * It reads the same `symbolOutlook()` the Guidance tab does (calendar, ledgers and facts off disk,
 * no broker), so these specs run it for real and assert on what a caller sees: which names are
 * answered, which are dropped, and that one ET day's answer is stable.
 */

const NOW = "2026-11-24T15:00:00.000Z";

describe("outlooksFor — when the query names symbols", () => {
  describe("when one valid symbol is asked for", () => {
    it("answers it under its own key, with that symbol's summary", () => {
      const { outlooks } = outlooksFor("NVDA", NOW);
      expect(Object.keys(outlooks)).toEqual(["NVDA"]);
      expect(outlooks.NVDA?.symbol).toBe("NVDA");
    });

    it("stamps the summary with the ET market day of `now`", () => {
      const { outlooks } = outlooksFor("NVDA", NOW);
      expect(outlooks.NVDA?.asOf).toBe("2026-11-24");
    });
  });

  describe("when the names are lowercase or padded", () => {
    it("trims and upper-cases them before answering", () => {
      const { outlooks } = outlooksFor("  nvda , aapl ", NOW);
      expect(Object.keys(outlooks).sort()).toEqual(["AAPL", "NVDA"]);
    });
  });

  describe("when a name repeats", () => {
    it("answers it once", () => {
      const { outlooks } = outlooksFor("NVDA,nvda, NVDA", NOW);
      expect(Object.keys(outlooks)).toEqual(["NVDA"]);
    });
  });

  describe("when a class-share underlying is asked for", () => {
    it("accepts the dotted form", () => {
      const { outlooks } = outlooksFor("BRK.B", NOW);
      expect(Object.keys(outlooks)).toEqual(["BRK.B"]);
    });
  });
});

describe("outlooksFor — when some names are not underlyings", () => {
  it("drops a bad name rather than failing the whole list", () => {
    const { outlooks } = outlooksFor("NVDA,not a ticker,TOOLONGNAME,12AB,AAPL", NOW);
    expect(Object.keys(outlooks).sort()).toEqual(["AAPL", "NVDA"]);
  });

  it("answers an empty record when nothing valid is left", () => {
    expect(outlooksFor("???,123,,", NOW)).toEqual({ outlooks: {} });
  });

  it("answers an empty record for an empty query", () => {
    expect(outlooksFor("", NOW)).toEqual({ outlooks: {} });
  });
});

describe("outlooksFor — when the query asks for too many", () => {
  const many = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((l) => `Q${l}`);

  it("caps the answer at MAX_OUTLOOK_SYMBOLS", () => {
    const { outlooks } = outlooksFor(many.join(","), NOW);
    expect(Object.keys(outlooks)).toHaveLength(MAX_OUTLOOK_SYMBOLS);
  });

  it("keeps the first names asked for, in order", () => {
    const { outlooks } = outlooksFor(many.join(","), NOW);
    expect(Object.keys(outlooks)).toEqual(many.slice(0, MAX_OUTLOOK_SYMBOLS));
  });

  it("does not spend the cap on invalid names", () => {
    const query = ["!!", "??", ...many].join(",");
    const { outlooks } = outlooksFor(query, NOW);
    expect(Object.keys(outlooks)).toEqual(many.slice(0, MAX_OUTLOOK_SYMBOLS));
  });
});

describe("outlooksFor — when the same symbol is asked for again", () => {
  it("answers the same summary within one ET day, even at a later hour", () => {
    const morning = outlooksFor("NVDA", "2026-11-24T14:00:00.000Z").outlooks.NVDA;
    const afternoon = outlooksFor("NVDA", "2026-11-24T20:30:00.000Z").outlooks.NVDA;
    expect(afternoon).toBe(morning);
  });

  it("computes afresh on the next ET day", () => {
    const today = outlooksFor("NVDA", "2026-11-24T15:00:00.000Z").outlooks.NVDA;
    const tomorrow = outlooksFor("NVDA", "2026-11-25T15:00:00.000Z").outlooks.NVDA;
    expect(tomorrow?.asOf).toBe("2026-11-25");
    expect(tomorrow).not.toBe(today);
  });

  it("keys the day by Eastern time, not UTC", () => {
    // 03:00Z on the 26th is still the evening of the 25th in New York.
    const lateEvening = outlooksFor("MSFT", "2026-11-26T03:00:00.000Z").outlooks.MSFT;
    expect(lateEvening?.asOf).toBe("2026-11-25");
  });
});
