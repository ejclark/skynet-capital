import { Route } from "../../src/routes/trade";

/**
 * `/trade`'s `validateSearch` (#738 cockpit plan; `?strike=` added #2017 Phase 0 task 4e) —
 * `?symbol=`/`?strike=` join `?desk=` and `?play=` as typed, shareable route state. These cases
 * pin the symbol and strike halves only; desk/play parsing is unchanged and untested here.
 */
describe("/trade validateSearch — symbol", () => {
  // TanStack types `validateSearch` as a union of validator shapes; ours is the plain function
  // form the route actually passes.
  const validateSearch = Route.options.validateSearch as (search: Record<string, unknown>) => {
    desk?: string;
    play?: string;
    symbol?: string;
    strike?: string;
  };
  const parse = (search: Record<string, unknown>) => validateSearch(search);

  it("normalizes a lowercase symbol to uppercase", () => {
    expect(parse({ symbol: "nvda" })).toMatchObject({ symbol: "NVDA" });
  });

  it("keeps a valid crypto pair as-is (uppercased)", () => {
    expect(parse({ symbol: "btc/usd" })).toMatchObject({ symbol: "BTC/USD" });
  });

  it("drops a symbol with disallowed characters", () => {
    expect(parse({ symbol: "$$$" })).not.toHaveProperty("symbol");
  });

  it("drops a symbol over the accepted length", () => {
    expect(parse({ symbol: "ABCDEFGHIJKLMNOP" })).not.toHaveProperty("symbol");
  });

  it("drops a non-string symbol value", () => {
    expect(parse({ symbol: { nested: "NVDA" } })).not.toHaveProperty("symbol");
  });

  it("omits symbol entirely when absent", () => {
    expect(parse({})).not.toHaveProperty("symbol");
  });
});

describe("/trade validateSearch — strike", () => {
  const validateSearch = Route.options.validateSearch as (search: Record<string, unknown>) => {
    desk?: string;
    play?: string;
    symbol?: string;
    strike?: string;
  };
  const parse = (search: Record<string, unknown>) => validateSearch(search);

  it("keeps a valid strike", () => {
    expect(parse({ strike: "180" })).toMatchObject({ strike: "180" });
  });

  it("canonicalizes a padded strike", () => {
    expect(parse({ strike: "040.00" })).toMatchObject({ strike: "40" });
  });

  it("drops a zero strike", () => {
    expect(parse({ strike: "0" })).not.toHaveProperty("strike");
  });

  it("drops garbage", () => {
    expect(parse({ strike: "not-a-number" })).not.toHaveProperty("strike");
  });

  it("omits strike entirely when absent", () => {
    expect(parse({})).not.toHaveProperty("strike");
  });
});
