import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { advisoryScan } from "../support/advisory-scan.js";

// Forward-test id collision gate (docs/COACHES.md: the race the event-research automation lane
// can hit — concurrent sessions each computing "the next FT number" off a shared file's live tip).
// Advisory, same as every other debt gate since Eric's 2026-08-29 call. The blocking half of this
// scan (placement — one fragment per event, issue #1449) lives in forward-tests-fragments.spec.ts.
describe("forward-test id collisions (advisory)", () => {
  it("reports duplicate FT-... ids across docs/research/forward-tests/*.md without blocking CI", () => {
    advisoryScan("scripts/forward-test-id-scan.mjs");
  });
});

// Honest degradation: a missing input is a named state, never a quiet pass. The real scan runs in
// a seeded temp dir (its ROOT is the cwd).
describe("forward-test-id-scan — missing inputs are named", () => {
  const SCRIPT = resolve("scripts/forward-test-id-scan.mjs");
  const FRAGMENT =
    "| # | Hypothesis | Prediction | Kill switch | Score by | Outcome |\n|---|---|---|---|---|---|\n" +
    "| FT-cpi-2026-09-11-1 | h | p | k | 2026-09-12 | _open_ |\n";
  const scan = (seed: { fragments?: boolean; index?: boolean; budget?: string }, mode?: string) => {
    const dir = mkdtempSync(join(tmpdir(), "ft-id-scan-"));
    try {
      if (seed.fragments) {
        mkdirSync(join(dir, "docs", "research", "forward-tests"), { recursive: true });
        writeFileSync(
          join(dir, "docs", "research", "forward-tests", "cpi-2026-09-11.md"),
          FRAGMENT,
        );
      }
      if (seed.index) {
        mkdirSync(join(dir, "docs", "research"), { recursive: true });
        writeFileSync(join(dir, "docs", "research", "forward-tests.md"), "# Forward tests\n");
      }
      if (seed.budget !== undefined)
        writeFileSync(join(dir, "forward-test-id-budget.json"), seed.budget);
      return spawnSync("node", mode ? [SCRIPT, mode] : [SCRIPT], { cwd: dir, encoding: "utf8" });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  };
  const BUDGET = '{ "duplicateIds": 0 }\n';

  it("passes a seeded register with every input present", () => {
    expect(scan({ fragments: true, index: true, budget: BUDGET }).status).toBe(0);
    const contract = scan({ fragments: true, index: true }, "--contract");
    expect(contract.status).toBe(0);
    expect(contract.stderr).toBe("");
  });

  it("exits 2 UNKNOWN with no fragment dir, in the budget and the contract modes alike", () => {
    for (const mode of [undefined, "--contract", "--candidate"]) {
      const res = scan({ index: true, budget: BUDGET }, mode);
      expect(res.status).toBe(2);
      expect(res.stderr).toMatch(/UNKNOWN — no fragment dir at .*forward-tests\./);
    }
  });

  it("exits 2 UNKNOWN with no budget, instead of comparing against undefined (always under)", () => {
    for (const budget of [undefined, "{}\n"]) {
      const res = scan({ fragments: true, index: true, budget });
      expect(res.status).toBe(2);
      expect(res.stderr).toContain("UNKNOWN — no usable duplicateIds");
    }
  });

  it("--contract still passes without an index, and prints a note naming it", () => {
    const res = scan({ fragments: true }, "--contract");
    expect(res.status).toBe(0);
    expect(res.stderr).toMatch(/^· no index at .*forward-tests\.md — no index rows to check$/m);
  });
});
