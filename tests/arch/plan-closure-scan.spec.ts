import { candidateIssueNumbers, hasClosingKeyword } from "../../scripts/plan-closure-scan.mjs";

// Plan-closure scan — pure extraction logic only (docs/LESSONS.md, 2026-08-30: #928 and #885
// shipped their final slice without a `Closes #N`, so GitHub never auto-closed them). The GH-API
// half of the script needs a token/network and is exercised manually via ship.sh open; this spec
// pins the deterministic half so a regression here can't silently stop flagging real drift.
describe("plan-closure-scan: candidateIssueNumbers", () => {
  it("extracts a slice number embedded mid-branch", () => {
    expect(candidateIssueNumbers("envelope-928-slice3-desk-gate-invariant")).toContain("928");
  });

  it("extracts a leading slice number", () => {
    expect(candidateIssueNumbers("feat/469-ladder-activity-detector")).toContain("469");
  });

  it("extracts a bare plan/<n> branch", () => {
    expect(candidateIssueNumbers("plan/894")).toEqual(["894"]);
  });

  it("ignores single-digit counters", () => {
    expect(candidateIssueNumbers("refactor/governed-cycle-1")).toEqual([]);
  });

  it("dedupes a number that appears twice", () => {
    expect(candidateIssueNumbers("feat/912-slice7-912-prose-sweep")).toEqual(["912"]);
  });
});

describe("plan-closure-scan: hasClosingKeyword", () => {
  it("matches Closes/Fixes/Resolves case-insensitively", () => {
    expect(hasClosingKeyword("Summary\n- Closes #928", "928")).toBe(true);
    expect(hasClosingKeyword("fixes #469 in this slice", "469")).toBe(true);
    expect(hasClosingKeyword("RESOLVES #894.", "894")).toBe(true);
  });

  it("does not match a bare issue mention with no keyword", () => {
    expect(hasClosingKeyword("part of #928 slice 3", "928")).toBe(false);
  });

  it("does not match a different issue number's keyword", () => {
    expect(hasClosingKeyword("Closes #100", "928")).toBe(false);
  });
});
