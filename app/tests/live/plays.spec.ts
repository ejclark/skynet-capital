import { isPlayCode, navForPlay, PLAY_CODES, playForNav } from "../../src/live/plays";

// The ticket's nav ↔ play seam (#1461 slice 2): one table, read both ways, round-trips.
describe("navForPlay / playForNav", () => {
  it("round-trips every rung", () => {
    for (const code of PLAY_CODES) expect(playForNav(navForPlay(code))).toBe(code);
  });
  it("reads the ladder's order: puts before calls, selling before buying", () => {
    expect(playForNav({ instrument: "option", side: "sell", optionType: "put" })).toBe("201");
    expect(playForNav({ instrument: "option", side: "sell", optionType: "call" })).toBe("202");
    expect(playForNav({ instrument: "option", side: "buy", optionType: "put" })).toBe("301");
    expect(playForNav({ instrument: "option", side: "buy", optionType: "call" })).toBe("302");
  });
  it("ignores put/call for stock — a stock ticket is only ever 101 or 102", () => {
    expect(playForNav({ instrument: "stock", side: "buy", optionType: "call" })).toBe("101");
    expect(playForNav({ instrument: "stock", side: "sell", optionType: "call" })).toBe("102");
  });
  it("ignores side/type for a spread — 401 has no single side of its own (#1671)", () => {
    expect(playForNav({ instrument: "spread", side: "buy", optionType: "call" })).toBe("401");
    expect(playForNav({ instrument: "spread", side: "sell", optionType: "put" })).toBe("401");
    expect(navForPlay("401").instrument).toBe("spread");
  });
  it("lands an unknown code on the first rung, never on nothing", () => {
    expect(navForPlay("999")).toEqual(navForPlay("101"));
    expect(isPlayCode("999")).toBe(false);
    expect(isPlayCode("302")).toBe(true);
  });
});
