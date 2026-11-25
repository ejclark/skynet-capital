import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  DRAWDOWN_RATES,
  DRAWDOWN_STUDY,
  EPISODES_NEEDED,
  STUDIED_INDEXES,
} from "../../src/options/drawdown-base-rates.js";

/**
 * The base rates a conditions quest carries (#7028 slice 3). The numbers are copied from a dated
 * study, so these specs do not pin them: they pin the shape that keeps the quest honest. Every row
 * is a measured rate with a sample behind it, the worst case is said in words, and no row has the
 * episodes the study's declared power needs, so none of them can be read as a claimed edge.
 */

const MOVES = ["shares", "put"] as const;
const rows = STUDIED_INDEXES.flatMap((index) =>
  MOVES.map((move) => ({ index, move, row: DRAWDOWN_RATES[index][move] })),
);

describe("when reading which indexes the study measured", () => {
  it("keys on SPY and QQQ only", () => {
    expect([...STUDIED_INDEXES]).toEqual(["SPY", "QQQ"]);
  });

  it("carries rates for exactly the studied indexes", () => {
    expect(Object.keys(DRAWDOWN_RATES).sort()).toEqual([...STUDIED_INDEXES].sort());
  });

  it("offers only the two moves the call sheet offered, the shares and the cash-secured put", () => {
    for (const index of STUDIED_INDEXES) {
      expect(Object.keys(DRAWDOWN_RATES[index]).sort()).toEqual(["put", "shares"]);
    }
  });
});

describe("when pointing at the source of record", () => {
  it("names a study page that exists in the repo", () => {
    expect(existsSync(resolve(__dirname, "../..", DRAWDOWN_STUDY))).toBe(true);
  });
});

describe("when reading the power the study declared", () => {
  it("needs a whole, positive number of episodes before it would claim an edge", () => {
    expect(Number.isInteger(EPISODES_NEEDED)).toBe(true);
    expect(EPISODES_NEEDED).toBeGreaterThan(0);
  });

  it.each(rows)("leaves $index $move underpowered, so it claims no edge", ({ row }) => {
    expect(row.numbers.episodes).toBeGreaterThan(0);
    expect(row.numbers.episodes).toBeLessThan(EPISODES_NEEDED);
  });
});

describe("when reading each measured row", () => {
  it.each(rows)("gives $index $move a rate that is a share between 0 and 1", ({ row }) => {
    expect(row.numbers.rate).toBeGreaterThanOrEqual(0);
    expect(row.numbers.rate).toBeLessThanOrEqual(1);
  });

  it.each(rows)(
    "backs $index $move with whole-number samples, episodes within sample",
    ({ row }) => {
      expect(Number.isInteger(row.numbers.sample)).toBe(true);
      expect(Number.isInteger(row.numbers.episodes)).toBe(true);
      expect(row.numbers.sample).toBeGreaterThanOrEqual(row.numbers.episodes);
    },
  );

  it.each(rows)(
    "keeps the worst single result at or under the worst decile for $index $move",
    ({ row }) => {
      expect(row.numbers.worstSingle).toBeLessThanOrEqual(row.numbers.worstDecile);
    },
  );

  it.each(rows)(
    "admits a real loss for $index $move: the worst single result is negative",
    ({ row }) => {
      expect(row.numbers.worstSingle).toBeLessThan(0);
    },
  );

  it.each(rows)("says the worst case for $index $move in a full sentence", ({ row }) => {
    expect(row.worstCase.length).toBeGreaterThan(20);
    expect(row.worstCase.trim().endsWith(".")).toBe(true);
  });
});

describe("when comparing the two indexes on the same move", () => {
  it.each(MOVES)("measures %s on more than one index from separate samples", (move) => {
    expect(DRAWDOWN_RATES.SPY[move].numbers).not.toEqual(DRAWDOWN_RATES.QQQ[move].numbers);
  });

  it("describes the put's assignment risk on both indexes", () => {
    for (const index of STUDIED_INDEXES) {
      expect(DRAWDOWN_RATES[index].put.worstCase).toMatch(/assigned/i);
    }
  });
});
