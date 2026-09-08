import { Route } from "../../src/routes/trade";

/**
 * `/trade`'s `validateSearch` (#738 cockpit plan) — `?symbol=` joins `?desk=` and `?play=` as
 * typed, shareable route state. These cases pin the symbol half only; desk/play parsing is
 * unchanged and untested here.
 */
describe("/trade validateSearch — symbol", () => {
  // TanStack types `validateSearch` as a union of validator shapes; ours is the plain function
  // form the route actually passes.
  const validateSearch = Route.options.validateSearch as (search: Record<string, unknown>) => {
    desk?: string;
    play?: string;
    symbol?: string;
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
