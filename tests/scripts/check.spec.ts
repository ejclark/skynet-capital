import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  biomeErrors,
  CAP,
  formatReport,
  PAGES_SCRIPT,
  pagesRegenerated,
  rstestFailures,
  summaryLine,
  touchesPages,
  tscErrors,
} from "../../scripts/check.mjs";

/**
 * `npm run check` (#5191): one call that fixes, typechecks and tests what changed, printing a
 * summary line and then ONLY the failing diagnostics. The point is fewer calls between two edits,
 * so the output has to be small enough that nobody re-runs it just to filter it.
 */
describe("npm run check — the report", () => {
  it("prints one mark per gate on a single summary line", () => {
    const line = summaryLine([
      { name: "lint", ok: true },
      { name: "typecheck", ok: true },
      { name: "tests", ok: false, note: "2 failed" },
    ]);
    expect(line).toBe("✓ lint · ✓ typecheck · ✗ tests 2 failed");
  });

  it("prints a passing gate's lines never, a failing gate's lines after the summary", () => {
    const out = formatReport([
      { name: "lint", ok: true, lines: ["noise"] },
      { name: "tests", ok: false, note: "1 failed", lines: ["✗ a.spec.ts :: b — boom"] },
    ]).split("\n");
    expect(out).toEqual(["✓ lint · ✗ tests 1 failed", "✗ a.spec.ts :: b — boom"]);
  });

  it("caps diagnostics at 60 lines and names the full logs after the cap", () => {
    const lines = Array.from({ length: 75 }, (_, i) => `err ${i}`);
    const out = formatReport([
      { name: "typecheck", ok: false, lines, logs: ["/tmp/typecheck.log"] },
    ]).split("\n");
    expect(CAP).toBe(60);
    expect(out).toHaveLength(1 + CAP + 1);
    expect(out.at(-1)).toBe("… 15 more lines — full log: /tmp/typecheck.log");
  });

  it("prints no cap line when the failures fit", () => {
    const out = formatReport([
      { name: "lint", ok: false, lines: ["× x"], logs: ["/tmp/lint.log"] },
    ]);
    expect(out).not.toContain("more lines");
  });
});

describe("npm run check — reading each tool's output", () => {
  it("keeps biome errors and drops its warnings and chatter", () => {
    const text = [
      "! a.ts:4:10: lint/correctness/noUnusedVariables: This function unused is unused.",
      "× a.ts:4:19: lint/suspicious/noEmptyBlockStatements: Unexpected empty block.",
      "Checked 1 file in 1040ms. Fixed 1 file.",
    ].join("\n");
    expect(biomeErrors(text)).toEqual([
      "× a.ts:4:19: lint/suspicious/noEmptyBlockStatements: Unexpected empty block.",
    ]);
  });

  it("keeps each tsc error with its continuation lines, under the suite's path prefix", () => {
    const text = [
      "src/x.tsx(3,7): error TS2322: Type 'string' is not assignable to type 'number'.",
      "  The expected type comes from property 'n'.",
      "Found 1 error.",
    ].join("\n");
    expect(tscErrors(text, "app/")).toEqual([
      "app/src/x.tsx(3,7): error TS2322: Type 'string' is not assignable to type 'number'.",
      "  The expected type comes from property 'n'.",
    ]);
  });

  it("turns rstest's JSON report into one line per failing test or unloadable spec", () => {
    const report = {
      summary: { testFiles: 2, failedTests: 1 },
      files: [
        {
          testPath: "tests/a.spec.ts",
          errors: [],
          results: [
            { status: "pass", name: "fine", errors: [] },
            {
              status: "fail",
              parentNames: ["suite"],
              name: "boom",
              errors: [{ message: "expected 1 to be 2\n  at x" }],
            },
          ],
        },
        {
          testPath: "tests/b.spec.ts",
          errors: [{ message: "Cannot find module './nope'" }],
          results: [],
        },
      ],
    };
    const text = `No test files found for one suite.\n${JSON.stringify(report, null, 2)}`;
    expect(rstestFailures(text, "app/")).toEqual({
      failed: 1,
      files: 2,
      lines: [
        "✗ app/tests/a.spec.ts :: suite > boom — expected 1 to be 2",
        "✗ app/tests/b.spec.ts — Cannot find module './nope'",
      ],
    });
  });

  it("returns null when rstest printed no report, so the caller falls back to the raw tail", () => {
    expect(rstestFailures("Error: config failed to load")).toBeNull();
  });
});

describe("npm run check — the architecture pages gate (#6684)", () => {
  it("runs when a changed path sits under the storybook or is its generator, and only then", () => {
    expect(touchesPages(["docs/architecture/source/maps.json"])).toBe(true);
    expect(touchesPages(["docs/architecture/README.md"])).toBe(true);
    expect(touchesPages([PAGES_SCRIPT])).toBe(true);
    expect(touchesPages(["docs/ARCHITECTURE-NOTES.md", "scripts/check.mjs", "src/a.ts"])).toBe(
      false,
    );
  });

  it("names the pages the generator regenerated, and none when it changed nothing", () => {
    const dir = mkdtempSync(join(tmpdir(), "check-pages-"));
    try {
      cpSync(join("docs", "architecture", "source"), join(dir, "docs", "architecture", "source"), {
        recursive: true,
      });
      const generate = (...args: string[]) =>
        execFileSync(process.execPath, [resolve(PAGES_SCRIPT), ...args], {
          cwd: dir,
          encoding: "utf8",
        });
      expect(pagesRegenerated(generate())).toContain("README.md");
      expect(pagesRegenerated(generate())).toEqual([]);
      expect(generate("--check")).toContain("match source/");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
