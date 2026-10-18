import { execFileSync } from "node:child_process";
import { advisoryScan } from "../support/advisory-scan.js";

// Dependency-graph fitness gate — runs the real scanner (scripts/dep-graph-scan.mjs, powered by
// dependency-cruiser). Advisory since 2026-08-29 (Eric) — see tests/support/advisory-scan.ts.
describe("dependency-graph budget (advisory)", () => {
  it("reports cycles/orphans/layering breaches without blocking CI", () => {
    advisoryScan("scripts/dep-graph-scan.mjs");
  });

  // The budget is advisory; the scanner running is not. An advisory wrapper swallows a crash the
  // same way it swallows a finding, which hid a maxBuffer overflow for weeks (#4771).
  it("produces a parseable report", () => {
    const out = execFileSync("node", ["scripts/dep-graph-scan.mjs", "--candidate"], {
      encoding: "utf8",
      maxBuffer: 64 << 20,
    });
    expect(typeof JSON.parse(out).debt).toBe("number");
  });
});
