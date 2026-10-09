import {
  MAX_REASON_LENGTH,
  parseAllocationBody,
  parseConfigureBody,
  parseConvictionBody,
  parseSubscribeBody,
} from "../../src/server/subscriptions-api-bodies.js";

/**
 * The Store API's shape gates. Subscribe keeps its lenient symbols rule (a malformed filter drops
 * to unrestricted, as it always has); configure (#4649) is strict, because an edit that guessed
 * would loosen a live subscription.
 */
const body = (over: Record<string, unknown>) =>
  JSON.stringify({ id: "sauron", playbookId: "HC-SAURON", mode: "standard", ...over });

describe("parseSubscribeBody — unchanged by #4649", () => {
  it("drops a malformed symbol filter to unrestricted rather than refusing", () => {
    expect(parseSubscribeBody(body({ capitalAllocated: 100, symbols: "NVDA" }))).toEqual({
      id: "sauron",
      playbookId: "HC-SAURON",
      mode: "standard",
      capitalAllocated: 100,
    });
  });

  it("still requires a numeric budget — no uncapped subscribe", () => {
    expect(parseSubscribeBody(body({ capitalAllocated: null }))).toBeUndefined();
  });
});

describe("parseConfigureBody (#4649)", () => {
  it("uppercases tickers and keeps the four tunables", () => {
    expect(
      parseConfigureBody(
        body({ capitalAllocated: 0, symbols: ["nvda", "crwv"], compoundAllocation: true }),
      ),
    ).toEqual({
      id: "sauron",
      playbookId: "HC-SAURON",
      tuning: {
        mode: "standard",
        capitalAllocated: 0,
        symbols: ["NVDA", "CRWV"],
        compoundAllocation: true,
      },
    });
  });

  it("reads null capital as uncapped and absent symbols as the whole basket", () => {
    expect(parseConfigureBody(body({ capitalAllocated: null }))?.tuning).toEqual({
      mode: "standard",
    });
  });

  it("refuses more than twenty symbols rather than dropping the filter", () => {
    const many = Array.from({ length: 21 }, (_, i) => `T${i}`);
    expect(parseConfigureBody(body({ capitalAllocated: 1, symbols: many }))).toBeUndefined();
  });

  it("refuses a body that is not JSON, or names no account", () => {
    expect(parseConfigureBody("not json")).toBeUndefined();
    expect(
      parseConfigureBody(JSON.stringify({ playbookId: "S1-NVDA", capitalAllocated: 1 })),
    ).toBeUndefined();
  });
});

describe("a conviction on subscribe (#4469 slice 3c part 3)", () => {
  it("carries a well-formed one, the reason trimmed", () => {
    expect(
      parseSubscribeBody(
        body({ capitalAllocated: 100, conviction: { reason: " mine ", checkOn: "2027-01-29" } }),
      )?.conviction,
    ).toEqual({ reason: "mine", checkOn: "2027-01-29" });
  });

  it("refuses a malformed one rather than dropping it — dropped, it would trade untested", () => {
    for (const conviction of [{ reason: "", checkOn: "2027-01-29" }, { reason: "x" }, "x"]) {
      expect(parseSubscribeBody(body({ capitalAllocated: 100, conviction }))).toBeUndefined();
    }
  });

  it("refuses a reason over the cap", () => {
    const reason = "x".repeat(MAX_REASON_LENGTH + 1);
    expect(
      parseSubscribeBody(
        body({ capitalAllocated: 100, conviction: { reason, checkOn: "2027-01-29" } }),
      ),
    ).toBeUndefined();
  });
});

describe("parseConvictionBody and parseAllocationBody (#4469 slice 3c part 3)", () => {
  it("reads a conviction on a pair the account names", () => {
    expect(
      parseConvictionBody(body({ conviction: { reason: "mine", checkOn: "2027-01-29" } })),
    ).toEqual({
      id: "sauron",
      playbookId: "HC-SAURON",
      conviction: { reason: "mine", checkOn: "2027-01-29" },
    });
    expect(parseConvictionBody(body({}))).toBeUndefined();
  });

  it("reads an allocation, null as clear", () => {
    const allocation = (over: Record<string, unknown>) =>
      parseAllocationBody(JSON.stringify({ id: "sauron", strategy: "wheel", ...over }));
    expect(allocation({ capitalAllocated: 100_000 })).toEqual({
      id: "sauron",
      strategy: "wheel",
      capitalAllocated: 100_000,
    });
    expect(allocation({ capitalAllocated: null })).toEqual({
      id: "sauron",
      strategy: "wheel",
      capitalAllocated: undefined,
    });
    for (const over of [{}, { capitalAllocated: -1 }, { capitalAllocated: "100" }]) {
      expect(allocation(over)).toBeUndefined();
    }
    expect(
      parseAllocationBody(
        JSON.stringify({ id: "sauron", strategy: "toString", capitalAllocated: 1 }),
      ),
    ).toBeUndefined();
  });
});
