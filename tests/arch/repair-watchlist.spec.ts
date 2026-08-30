import { advisoryScan } from "../support/advisory-scan.js";

// Repair-lane watchlist drift gate — runs the real scanner (scripts/repair-watchlist-scan.mjs).
// Flags a workflow file that moneypenny-repair.yml's hardcoded watch list doesn't know about (#933).
// Advisory, same as the other fitness gates since 2026-08-29 (Eric) — see tests/support/advisory-scan.ts.
describe("moneypenny-repair watch-list drift (advisory)", () => {
  it("reports an unwatched, non-exempt workflow without blocking CI", () => {
    advisoryScan("scripts/repair-watchlist-scan.mjs");
  });
});
