import { cleanStake } from "../../src/options/guidance-stake-parse.js";

/**
 * The stake parser shared by the browser (localStorage) and the server (a saved position's POST
 * body, #3968) — one set of rules for "a valid stake", whichever side is reading untrusted input.
 */

describe("cleanStake", () => {
  it("keeps only the whitelisted, positive fields — untrusted input never passes through raw", () => {
    expect(cleanStake({ shares: -5, costBasis: "70", cash: 1e3, goal: "yolo", extra: 1 })).toEqual({
      cash: 1000,
    });
  });

  it("floors a fractional share or contract count", () => {
    expect(cleanStake({ shares: 100.7, callsSold: 2.9 })).toEqual({
      shares: 100,
      callsSold: 2,
    });
  });

  it("accepts a valid goal, drops an invalid one", () => {
    expect(cleanStake({ goal: "income" })).toEqual({ goal: "income" });
    expect(cleanStake({ goal: "yolo" })).toEqual({});
  });

  it("keeps a fully-specified long option, dropping bid/ask when absent", () => {
    expect(
      cleanStake({
        longOption: {
          type: "call",
          strike: 600,
          expiration: "2026-12-19",
          contracts: 1.5,
          costPerContract: 5.2,
        },
      }),
    ).toEqual({
      longOption: {
        type: "call",
        strike: 600,
        expiration: "2026-12-19",
        contracts: 1,
        costPerContract: 5.2,
      },
    });
  });

  it("drops the whole long option when any required field is missing or malformed", () => {
    expect(
      cleanStake({ longOption: { type: "call", strike: 600, expiration: "2026-12-19" } }),
    ).toEqual({});
    expect(
      cleanStake({
        longOption: {
          type: "spread",
          strike: 600,
          expiration: "2026-12-19",
          contracts: 1,
          costPerContract: 5,
        },
      }),
    ).toEqual({});
    expect(
      cleanStake({
        longOption: {
          type: "put",
          strike: 600,
          expiration: "12-19-2026",
          contracts: 1,
          costPerContract: 5,
        },
      }),
    ).toEqual({});
  });

  it("keeps a live quote on a long option when both sides are given", () => {
    expect(
      cleanStake({
        longOption: {
          type: "put",
          strike: 450,
          expiration: "2026-11-20",
          contracts: 2,
          costPerContract: 3.1,
          bid: 2.5,
          ask: 2.7,
        },
      }).longOption,
    ).toMatchObject({ bid: 2.5, ask: 2.7 });
  });

  it("never invents openCalls from raw input — that always comes from a linked account", () => {
    expect(
      cleanStake({
        openCalls: [{ occ: "X", strike: 1, expiration: "2026-01-01", contracts: 1, premium: 1 }],
      }),
    ).toEqual({});
  });

  it("degrades to an empty stake on null, undefined, or a non-object", () => {
    expect(cleanStake(null)).toEqual({});
    expect(cleanStake(undefined)).toEqual({});
    expect(cleanStake("nonsense")).toEqual({});
  });
});
