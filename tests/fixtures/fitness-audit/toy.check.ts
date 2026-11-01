// The toy's spec. Named .check.ts so the repo's own test run (tests/**/*.spec.ts) skips it: only
// scripts/fitness-audit.mjs runs it, inside a temporary copy. It deliberately never tests the
// 300 ms boundary, so a bug that moves the boundary survives.
import { describe, expect, it } from "@rstest/core";
// @ts-expect-error plain .mjs script, no declarations
import { CONTRACTS, judgeAge, judgeCount } from "./toy.mjs";

describe("toy check", () => {
  it("passes a fresh stamp and fails a stale one", () => {
    expect(judgeAge(0)).toBe("pass");
    expect(judgeAge(1000)).toBe("fail");
  });

  it("passes one machine and fails none", () => {
    expect(judgeCount([{}])).toBe("pass");
    expect(judgeCount([])).toBe("fail");
  });

  it("names both contracts", () => {
    expect(CONTRACTS.map((c: { id: string }) => c.id)).toEqual(["fresh-stamp", "has-machines"]);
  });
});
