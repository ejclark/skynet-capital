import {
  parseConfigureBody,
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
