import { readFileSync } from "node:fs";

/**
 * The trading chapter's footnote (#5178). An iron condor is two defined-risk spreads run together —
 * its loss is capped — so the page must never file it under "undefined risk". Read from source,
 * the way `page-sections.spec.ts` pins copy it has no DOM for; whitespace is folded so the JSX
 * line wrap doesn't matter.
 */

const note = readFileSync("app/src/shell/ladder-chapter.tsx", "utf8").replace(/\s+/g, " ");

describe("trading chapter footnote", () => {
  it("says a condor is two spreads run together, kept off the ladder as a Playbook Store strategy", () => {
    expect(note).toContain(
      "Iron condors stay off the ladder: a condor is two spreads run together, a Playbook Store strategy, never a rung.",
    );
    expect(note).toContain("Trades with undefined risk stay off it entirely.");
  });

  it("never groups iron condors with undefined risk", () => {
    expect(note).not.toMatch(/condors? and anything with undefined risk/i);
  });
});
