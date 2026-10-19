import {
  type OutlookCall,
  recapOf,
  type SymbolOutlook,
  WINDOW_STATES,
} from "../../src/research/symbol-outlook-shape.js";

/**
 * How a surface reads the symbol summary (#4807 slice 3, criterion 6): once its until-date passes
 * with no newer assessment the call reads stale and is demoted the way a stale research input is
 * in the guidance levers — confidence capped at low, a buy standing aside.
 */

const outlook = (over: Partial<SymbolOutlook> = {}): SymbolOutlook => ({
  symbol: "CRWV",
  asOf: "2026-10-18",
  call: "hold",
  confidence: "high",
  why: "Nothing changes before the print.",
  until: "2026-11-07",
  falsifier: "A close under $70 before the print.",
  windows: [],
  basis: { ledger: "docs/research/events/x.md", callFrom: "ledger" },
  ...over,
});

describe("recapOf — a call past its until-date reads stale", () => {
  it("leaves a current call exactly as the research stated it", () => {
    expect(recapOf(outlook(), "2026-10-18")).toEqual({
      call: "hold",
      confidence: "high",
      stale: false,
    });
  });

  it("goes stale on the until-date itself, not a day later", () => {
    expect(recapOf(outlook(), "2026-11-06").stale).toBe(false);
    expect(recapOf(outlook(), "2026-11-07").stale).toBe(true);
  });

  it("caps a stale call at low confidence but keeps hold, trim and sell — exits always run", () => {
    for (const call of ["hold", "trim", "sell"] as const satisfies OutlookCall[]) {
      expect(recapOf(outlook({ call }), "2026-11-09")).toEqual({
        call,
        confidence: "low",
        stale: true,
      });
    }
  });

  it("stands a stale buy aside and says what it was — a low grade is never a bet", () => {
    expect(recapOf(outlook({ call: "buy" }), "2026-11-09")).toEqual({
      call: "wait",
      confidence: "low",
      stale: true,
      demotedFrom: "buy",
    });
  });

  it("never lifts a confidence already below the cap", () => {
    expect(recapOf(outlook({ confidence: "none" }), "2026-11-09").confidence).toBe("none");
  });

  it("has no call to expire without a ledger — no view already says so in words", () => {
    const { basis: _none, ...bare } = outlook({
      call: "wait",
      confidence: "none",
      until: "2026-10-18",
    });
    expect(recapOf(bare, "2026-10-19").stale).toBe(false);
  });
});

describe("WINDOW_STATES is re-exported unchanged for the browser", () => {
  it("keeps all four states, each a glyph and a word", () => {
    expect(Object.keys(WINDOW_STATES)).toEqual(["open", "caution", "protected", "no-view"]);
  });
});
