import {
  assembleChain,
  type RecommendChainReader,
} from "../../src/adapters/alpaca-recommend-chain.js";
import type { OptionChainRow } from "../../src/alpaca/alpaca-options-client.js";

/**
 * `assembleChain` — the recommender's multi-expiration, both-sides chain, built from a client that
 * only answers one expiration × one type per call. Fail-soft in every direction: no spot, no
 * solvable IV anywhere, or a throwing client all come back `undefined`, never a fabricated number.
 */

const TODAY = "2026-09-08";
const NEAR = "2026-09-18"; // 10 calendar days out
const FAR = "2026-10-16"; // 38 calendar days out

type Rows = Record<string, Record<"call" | "put", OptionChainRow[]>>;

/** A reader serving canned rows per expiration/type, recording every chain it was asked for. */
function reader(spot: number | undefined, rows: Rows): RecommendChainReader & { asked: string[] } {
  const asked: string[] = [];
  return {
    asked,
    getUnderlyingPrice: () => Promise.resolve(spot),
    getExpirations: (_u, _onOrAfter, limit) => Promise.resolve(Object.keys(rows).slice(0, limit)),
    getChain: (_u, expiration, type) => {
      asked.push(`${expiration}:${type}`);
      return Promise.resolve(rows[expiration]?.[type] ?? []);
    },
  };
}

// An ATM contract quoted at $3 mid on a $100 spot — well inside the solver's no-arbitrage band on
// both expiries, so every one of these rows solves to a real IV.
const atm = (occ: string, side: "C" | "P"): OptionChainRow => ({
  occSymbol: `NVDA${occ}${side}00100000`,
  strike: 100,
  bid: 2.9,
  ask: 3.1,
});
/** A listed strike with no quote at all — nothing to solve an IV from. */
const unquoted: OptionChainRow = { occSymbol: "NVDA260918C00120000", strike: 120 };

describe("assembleChain", () => {
  it("spans every listed expiration and both sides, each contract solved to its own IV", async () => {
    const client = reader(100, {
      [NEAR]: { call: [atm("260918", "C")], put: [atm("260918", "P")] },
      [FAR]: { call: [atm("261016", "C")], put: [atm("261016", "P")] },
    });
    const assembled = await assembleChain(client, "NVDA", TODAY);

    expect(assembled).toBeDefined();
    expect(assembled?.spot).toBe(100);
    expect(new Set(assembled?.chain.map((c) => c.expiration))).toEqual(new Set([NEAR, FAR]));
    expect(new Set(assembled?.chain.map((c) => c.kind))).toEqual(new Set(["call", "put"]));
    expect(assembled?.chain.map((c) => c.daysToExpiry)).toEqual([10, 10, 38, 38]);
    for (const contract of assembled?.chain ?? []) {
      expect(contract.price).toBe(3);
      expect(contract.volatility).toBeGreaterThan(0);
    }
    // The underlying's σ is the mean of the solved per-contract IVs — inside their range, never
    // one leg's number copied across.
    const ivs = (assembled?.chain ?? []).map((c) => c.volatility as number);
    expect(assembled?.volatility).toBeGreaterThanOrEqual(Math.min(...ivs));
    expect(assembled?.volatility).toBeLessThanOrEqual(Math.max(...ivs));
    expect(client.asked.sort()).toEqual([
      `${NEAR}:call`,
      `${NEAR}:put`,
      `${FAR}:call`,
      `${FAR}:put`,
    ]);
  });

  it("carries an unquoted row as a contract with volatility ABSENT — never a throw, never a zero", async () => {
    const client = reader(100, {
      [NEAR]: { call: [atm("260918", "C"), unquoted], put: [] },
    });
    const assembled = await assembleChain(client, "NVDA", TODAY);

    const blank = assembled?.chain.find((c) => c.strike === 120);
    expect(blank).toEqual({ kind: "call", strike: 120, daysToExpiry: 10, expiration: NEAR });
    expect(blank?.price).toBeUndefined();
    expect(blank?.volatility).toBeUndefined();
    // The one solved contract still gives the underlying an honest σ.
    expect(assembled?.volatility).toBeGreaterThan(0);
  });

  it("asks for at most `maxExpirations` expirations", async () => {
    const client = reader(100, {
      [NEAR]: { call: [atm("260918", "C")], put: [] },
      [FAR]: { call: [atm("261016", "C")], put: [] },
    });
    const assembled = await assembleChain(client, "NVDA", TODAY, 1);
    expect(assembled?.chain.map((c) => c.expiration)).toEqual([NEAR]);
  });

  it("is undefined when spot cannot be read", async () => {
    const client = reader(undefined, {
      [NEAR]: { call: [atm("260918", "C")], put: [atm("260918", "P")] },
    });
    expect(await assembleChain(client, "NVDA", TODAY)).toBeUndefined();
    expect(client.asked).toEqual([]);
  });

  it("is undefined when NOT ONE contract could have its IV solved — no honest σ exists", async () => {
    const client = reader(100, {
      [NEAR]: { call: [unquoted], put: [{ occSymbol: "NVDA260918P00080000", strike: 80 }] },
      [FAR]: { call: [], put: [] },
    });
    expect(await assembleChain(client, "NVDA", TODAY)).toBeUndefined();
  });

  it("is undefined when the listing is empty", async () => {
    expect(await assembleChain(reader(100, {}), "NVDA", TODAY)).toBeUndefined();
  });

  it("is undefined — never a throw — when the broker refuses the listing", async () => {
    const client: RecommendChainReader = {
      getUnderlyingPrice: () => Promise.resolve(100),
      getExpirations: () => Promise.reject(new Error("HTTP 503")),
      getChain: () => Promise.resolve([]),
    };
    await expect(assembleChain(client, "NVDA", TODAY)).resolves.toBeUndefined();
  });
});
