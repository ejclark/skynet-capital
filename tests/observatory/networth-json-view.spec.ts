import {
  type AccountNetWorthInput,
  accountsNetWorthView,
  type NetWorthWindowKey,
} from "../../src/observatory/networth-json-view.js";

/**
 * The net-worth view's contract (`/api/accounts/networth`): per-account value/day/ROI formatting,
 * "—" for any figure the broker didn't supply, errored accounts excluded from the aggregate, and
 * the all-accounts total as `Σend / Σbase − 1` per window with a `partial` flag when an account is
 * silently excluded — never a shrunken denominator that misstates the book.
 */

/** Narrow an array/index lookup to a defined value — the biome-safe stand-in for `!` in specs. */
function must<T>(value: T | null | undefined, label: string): T {
  if (value === null || value === undefined) throw new Error(`expected ${label} to be defined`);
  return value;
}

const WINDOWS: Record<NetWorthWindowKey, { returnFraction: number; base: number; end: number }> = {
  "7D": { returnFraction: 0.01, base: 100_000, end: 101_000 },
  "1M": { returnFraction: 0.02, base: 100_000, end: 102_000 },
  "3M": { returnFraction: -0.03, base: 100_000, end: 97_000 },
  "1Y": { returnFraction: 0.12, base: 100_000, end: 112_000 },
};

function account(over: Partial<AccountNetWorthInput> & { id: string }): AccountNetWorthInput {
  return {
    name: over.id,
    kind: "human",
    equity: 101_000,
    cash: 50_000,
    positionCount: 3,
    lastEquity: 100_000,
    windows: WINDOWS,
    ...over,
  } as AccountNetWorthInput;
}

describe("accountsNetWorthView", () => {
  it("formats one account's value, day move, cash, and four ROI windows", () => {
    const view = accountsNetWorthView("t", [account({ id: "human-eric" })]);
    const a = must(view.accounts[0], "accounts[0]");
    expect(a.value).toBe("$101,000");
    expect(a.dayChange).toBe("+$1,000 · +1.00%");
    expect(a.dayTone).toBe("pos");
    expect(a.cash).toBe("$50,000");
    expect(a.windows.map((w) => w.value)).toEqual(["+1.00%", "+2.00%", "-3.00%", "+12.00%"]);
    expect(a.windows.every((w) => w.known)).toBe(true);
  });

  it("renders '—' for a window the broker did not report, without flipping the tone", () => {
    const view = accountsNetWorthView("t", [
      account({ id: "a", windows: { ...WINDOWS, "1Y": {} } }),
    ]);
    const y = must(
      must(view.accounts[0], "accounts[0]").windows.find((w) => w.label === "1Y"),
      "1Y window",
    );
    expect(y.value).toBe("—");
    expect(y.known).toBe(false);
    expect(y.tone).toBe("flat");
  });

  it("renders the whole row as '—' and excludes the account from the total when it errored", () => {
    const view = accountsNetWorthView("t", [
      account({ id: "good", equity: 100_000, cash: 40_000, positionCount: 1, lastEquity: 99_000 }),
      account({ id: "bad", error: "broker unreachable" }),
    ]);
    const bad = must(
      view.accounts.find((a) => a.id === "bad"),
      "bad account",
    );
    expect(bad.value).toBe("—");
    expect(bad.dayChange).toBe("—");
    expect(bad.windows.every((w) => !w.known)).toBe(true);
    // The total reflects ONLY the good account.
    expect(view.total?.value).toBe("$100,000");
    expect(view.total?.cash).toBe("$40,000");
  });

  it("aggregates value, cash, and positions across accounts", () => {
    const view = accountsNetWorthView("t", [
      account({ id: "a", equity: 100_000, cash: 40_000, positionCount: 2 }),
      account({ id: "b", equity: 200_000, cash: 60_000, positionCount: 5 }),
    ]);
    expect(view.total?.value).toBe("$300,000");
    expect(view.total?.cash).toBe("$100,000");
    expect(view.total?.positionCount).toBe(7);
  });

  it("knows the day move only when EVERY live account knows its previous close", () => {
    const bothKnown = accountsNetWorthView("t", [
      account({ id: "a", equity: 100_000, lastEquity: 99_000 }),
      account({ id: "b", equity: 200_000, lastEquity: 198_000 }),
    ]);
    expect(bothKnown.total?.dayKnown).toBe(true);
    expect(bothKnown.total?.dayChange).toBe("+$3,000 · +1.01%");

    const oneMissing = accountsNetWorthView("t", [
      account({ id: "a", equity: 100_000, lastEquity: 99_000 }),
      account({ id: "b", equity: 200_000, lastEquity: undefined }),
    ]);
    expect(oneMissing.total?.dayKnown).toBe(false);
    expect(oneMissing.total?.dayChange).toBe("—");
  });

  it("lifts a window's flow-adjusted return to the book level as Σend / Σbase − 1", () => {
    const view = accountsNetWorthView("t", [
      account({
        id: "a",
        equity: 101_000,
        windows: { ...WINDOWS, "7D": { returnFraction: 0.01, base: 100_000, end: 101_000 } },
      }),
      account({
        id: "b",
        equity: 205_000,
        windows: { ...WINDOWS, "7D": { returnFraction: 0.025, base: 200_000, end: 205_000 } },
      }),
    ]);
    const w7 = must(
      must(view.total, "total").windows.find((w) => w.label === "7D"),
      "7D window",
    );
    // (101000 + 205000) / (100000 + 200000) − 1 = 306000/300000 − 1 = 0.02 → +2.00%
    expect(w7.value).toBe("+2.00%");
    expect(w7.partial).toBeUndefined();
  });

  it("marks a window partial and aggregates over the reporting subset when an account lacks it", () => {
    const view = accountsNetWorthView("t", [
      account({
        id: "a",
        windows: { ...WINDOWS, "1Y": { returnFraction: 0.1, base: 100_000, end: 110_000 } },
      }),
      account({ id: "b", windows: { ...WINDOWS, "1Y": {} } }),
    ]);
    const y = must(
      must(view.total, "total").windows.find((w) => w.label === "1Y"),
      "1Y window",
    );
    expect(y.value).toBe("+10.00%");
    expect(y.partial).toBe(true);
  });

  it("returns a null total when every owned account errored", () => {
    const view = accountsNetWorthView("t", [account({ id: "a", error: "down" })]);
    expect(view.total).toBeNull();
  });
});
