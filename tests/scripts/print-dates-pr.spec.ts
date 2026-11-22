import { describe, expect, it } from "@rstest/core";
import { refreshPr, refreshPrOpen } from "../../scripts/print-dates-pr.mjs";

// The weekday calendar refresh's PR (#4479 slice 1b, .github/workflows/print-dates.yml): one fixed
// branch, so a second run before the first merges updates that PR instead of racing it.
describe("print-dates-pr: one refresh PR at a time", () => {
  const branch = "chore/print-dates-refresh";

  it("finds the open PR on the refresh branch", () => {
    expect(refreshPrOpen([{ head: { ref: "other" } }, { head: { ref: branch } }], branch)).toBe(
      true,
    );
  });

  it("opens one when no open PR carries the branch", () => {
    expect(refreshPrOpen([{ head: { ref: "research/nvda" } }, {}], branch)).toBe(false);
  });
});

describe("print-dates-pr: the body says what the run decided", () => {
  const log = [
    "[confirm-print-dates] checked NVDA 2026-11-19, AAPL 2026-11-02.",
    "Nasdaq attempt 1 failed: fetch failed",
    "[confirm-print-dates] NVDA: CONFIRMED 2026-11-19.",
    "[confirm-print-dates] NEEDS IR — AAPL 2026-11-02: the company's date is 2026-10-29; moved there as an estimate.",
    "[confirm-print-dates] GOOG: no print in ~100 days — ESTIMATED 2027-02-03 from cadence.",
    "[confirm-print-dates] outcome: needs-ir",
  ].join("\n");

  it("keeps the decisions and drops the fetch retries", () => {
    const { body } = refreshPr(log, "needs-ir", "2026-11-17");
    expect(body).toContain("NVDA: CONFIRMED 2026-11-19.");
    expect(body).toContain("GOOG: no print in ~100 days — ESTIMATED 2027-02-03 from cadence.");
    expect(body).not.toContain("attempt 1 failed");
    expect(body).not.toContain("[confirm-print-dates]");
  });

  it("counts the rows that still need an IR read", () => {
    expect(refreshPr(log, "needs-ir", "2026-11-17").body).toContain("1 row(s) need an IR read");
    expect(refreshPr("outcome: found", "found", "2026-11-17").body).toContain(
      "No row needs an IR read.",
    );
  });

  it("titles the PR as a lowercase conventional commit with the run's date", () => {
    expect(refreshPr(log, "found", "2026-11-17").title).toBe(
      "chore(calendar): refresh earnings print dates (2026-11-17)",
    );
  });
});
