import type { PlaybookSubscription } from "../../src/domain/types.js";
import { findPair, type Pair } from "../../src/playbooks/pair-table.js";
import {
  allocationChangeRefusal,
  allocationRefusal,
  budgetedOn,
  checkOnRefusal,
} from "../../src/subscriptions/strategy-budgets.js";

/**
 * Each ticker's budget inside its strategy's allocation (#4469 slice 3c part 3, criterion 5), and
 * the day a conviction may be checked on (criteria 2 and 12).
 */

const pair = (id: string): Pair => {
  const found = findPair(id);
  if (!found) throw new Error(`no pair ${id}`);
  return found;
};

/** The wheel on AMZN — a second ticker on one strategy, which the table does not have yet. */
const WHEEL_AMZN: Pair = { ...pair("CRWV-WHEEL"), id: "AMZN-WHEEL", symbols: ["AMZN"] };
const lookup = (id: string) => (id === WHEEL_AMZN.id ? WHEEL_AMZN : findPair(id));

const sub = (playbookId: string, capitalAllocated?: number): PlaybookSubscription => ({
  accountId: "sauron",
  playbookId,
  mode: "standard",
  ...(capitalAllocated === undefined ? {} : { capitalAllocated }),
  enabled: true,
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
});

const WHEEL_100K = { wheel: { capitalAllocated: 100_000, updatedAt: "2026-10-09T00:00:00.000Z" } };

describe("budgetedOn — what a strategy's tickers are given together", () => {
  it("adds the budgets on one strategy, paused ones too, and nothing from another strategy", () => {
    const subs = [
      sub("CRWV-WHEEL", 75_000),
      { ...sub("AMZN-WHEEL", 20_000), enabled: false },
      sub("S1-NVDA", 50_000),
    ];
    expect(budgetedOn(subs, "wheel", lookup)).toEqual({ total: 95_000, uncapped: [] });
  });

  it("names an uncapped ticker rather than counting it as $0", () => {
    const { total, uncapped } = budgetedOn([sub("CRWV-WHEEL")], "wheel", lookup);
    expect(total).toBe(0);
    expect(uncapped.map((p) => p.id)).toEqual(["CRWV-WHEEL"]);
  });
});

describe("allocationRefusal — a budget that would not fit is refused in words", () => {
  const base = { subscriptions: [sub("CRWV-WHEEL", 75_000)], lookup };

  it("takes anything while the strategy has no allocation (unrestricted, as before part 3)", () => {
    expect(
      allocationRefusal({
        ...base,
        playbookId: "AMZN-WHEEL",
        capitalAllocated: 1e9,
        allocations: undefined,
      }),
    ).toBeUndefined();
  });

  it("takes a second ticker that fits beside the first", () => {
    expect(
      allocationRefusal({
        ...base,
        playbookId: "AMZN-WHEEL",
        capitalAllocated: 25_000,
        allocations: WHEEL_100K,
      }),
    ).toBeUndefined();
  });

  it("refuses one that would put the strategy over, and says what is left", () => {
    expect(
      allocationRefusal({
        ...base,
        playbookId: "AMZN-WHEEL",
        capitalAllocated: 30_000,
        allocations: WHEEL_100K,
      }),
    ).toBe(
      "That would put $105,000 on the wheel, over the $100,000 you gave it; $25,000 is left for AMZN.",
    );
  });

  it("never refuses an Edit that keeps or lowers a budget, even over the allocation", () => {
    const over = { wheel: { capitalAllocated: 50_000, updatedAt: "2026-10-09T00:00:00.000Z" } };
    for (const capitalAllocated of [75_000, 60_000]) {
      expect(
        allocationRefusal({
          ...base,
          playbookId: "CRWV-WHEEL",
          capitalAllocated,
          allocations: over,
        }),
      ).toBeUndefined();
    }
  });

  it("refuses an Edit that raises a budget past the allocation", () => {
    expect(
      allocationRefusal({
        ...base,
        playbookId: "CRWV-WHEEL",
        capitalAllocated: 110_000,
        allocations: WHEEL_100K,
      }),
    ).toContain("over the $100,000 you gave it");
  });

  it("refuses uncapping a ticker under an allocation", () => {
    expect(
      allocationRefusal({
        ...base,
        playbookId: "CRWV-WHEEL",
        capitalAllocated: undefined,
        allocations: WHEEL_100K,
      }),
    ).toBe(
      "The wheel on CRWV needs a budget: you gave the wheel $100,000, and an uncapped ticker would not fit inside it.",
    );
  });

  it("never reads another strategy's allocation", () => {
    expect(
      allocationRefusal({
        subscriptions: [],
        lookup,
        playbookId: "S1-NVDA",
        capitalAllocated: 1e9,
        allocations: WHEEL_100K,
      }),
    ).toBeUndefined();
  });
});

describe("allocationChangeRefusal — an allocation the budgets already set must fit under", () => {
  const subs = [sub("CRWV-WHEEL", 75_000), sub("AMZN-WHEEL", 20_000)];

  it("takes one at or above what the tickers are given", () => {
    expect(allocationChangeRefusal(subs, "wheel", 95_000, lookup)).toBeUndefined();
  });

  it("refuses one below it, in words", () => {
    expect(allocationChangeRefusal(subs, "wheel", 90_000, lookup)).toBe(
      "Its tickers' budgets already add up to $95,000; allocate at least that to the wheel, or lower a budget first.",
    );
  });

  it("refuses one while a ticker on it is uncapped", () => {
    expect(allocationChangeRefusal([sub("CRWV-WHEEL")], "wheel", 1e9, lookup)).toBe(
      "The wheel on CRWV is uncapped; give it a budget before setting an allocation for the wheel.",
    );
  });

  it("never refuses clearing one", () => {
    expect(allocationChangeRefusal(subs, "wheel", undefined, lookup)).toBeUndefined();
  });
});

describe("checkOnRefusal — a conviction is checked on a market day still to come, within a year", () => {
  const NOW = "2026-10-09T15:00:00.000Z";

  it("takes tomorrow and the CRWV wheel's 2027-01-29", () => {
    expect(checkOnRefusal("2026-10-10", NOW)).toBeUndefined();
    expect(checkOnRefusal("2027-01-29", NOW)).toBeUndefined();
  });

  it("refuses today and any day before it", () => {
    expect(checkOnRefusal("2026-10-09", NOW)).toBe(
      "A conviction is checked on a day still to come; 2026-10-09 isn't.",
    );
    expect(checkOnRefusal("2026-01-01", NOW)).toBeDefined();
  });

  it("reads today on the market's clock, not UTC", () => {
    // 01:00 UTC on the 10th is still the 9th in New York.
    expect(checkOnRefusal("2026-10-10", "2026-10-10T01:00:00.000Z")).toBeUndefined();
  });

  it("refuses a day more than a year out, naming the last one it takes", () => {
    expect(checkOnRefusal("2027-10-10", NOW)).toBeUndefined();
    expect(checkOnRefusal("2027-10-11", NOW)).toBe(
      "Check a conviction within a year, by 2027-10-10, so the tape gets to judge it.",
    );
  });
});
