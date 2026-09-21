import { parseSearch, stringifySearch } from "../../src/live/search-params";

/** Search params round-trip as plain strings — no JSON quotes around a numeric-looking value. */
describe("search params (#3407 P0)", () => {
  it("writes a numeric-looking string raw", () => {
    expect(stringifySearch({ play: "201", symbol: "NVDA", strike: "175" })).toBe(
      "?play=201&symbol=NVDA&strike=175",
    );
  });

  it("reads it back as the same string", () => {
    expect(parseSearch("?play=201&symbol=NVDA&strike=175")).toEqual({
      play: "201",
      symbol: "NVDA",
      strike: "175",
    });
  });

  it("still reads a legacy quoted link as its literal text (validateSearch normalises the rest)", () => {
    expect(parseSearch("?play=%22201%22")).toEqual({ play: '"201"' });
  });

  it("drops undefined values and writes nothing for an empty search", () => {
    expect(stringifySearch({ play: "201", section: undefined })).toBe("?play=201");
    expect(stringifySearch({})).toBe("");
  });
});
