import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { advisoryScan } from "../support/advisory-scan.js";

// God-file gate: reports source files over the flat 300 code-line cap (500 for tests) and
// junk-drawer names (utils.ts/helpers.ts/common.ts/misc.ts), via scripts/arch-scan.mjs. Advisory
// since 2026-08-29 (Eric) — see tests/support/advisory-scan.ts. Code lines, not physical, since
// #1713: comments that carry context for the next session are not what the cap is pricing.
describe("architecture — god-file gate (advisory)", () => {
  it("reports file-size debt without blocking CI", () => {
    advisoryScan("scripts/arch-scan.mjs");
  });
});

const SCRIPT = join(process.cwd(), "scripts/arch-scan.mjs");

/** Run the real scanner in a seeded fixture (src/ + scripts/ only); return {status, out}. */
function scanFixture(seed?: (root: string) => void): { status: number; out: string } {
  const root = mkdtempSync(join(tmpdir(), "arch-scan-fixture-"));
  try {
    mkdirSync(join(root, "src"), { recursive: true });
    mkdirSync(join(root, "scripts"), { recursive: true });
    writeFileSync(join(root, "src", "small.ts"), "export const one = 1;\n");
    writeFileSync(join(root, "scripts", "tool.mjs"), "console.log(1);\n");
    seed?.(root);
    try {
      const out = execFileSync("node", [SCRIPT], { cwd: root, encoding: "utf8", stdio: "pipe" });
      return { status: 0, out };
    } catch (err) {
      const e = err as { status: number; stdout?: string; stderr?: string };
      return { status: e.status, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

// Honest degradation (docs/grind/honest-degradation.instructions.md): a missing input is a named
// state, never a quiet pass.
describe("arch-scan — missing inputs are named, never a quiet pass", () => {
  it("exits 2 with UNKNOWN when scripts-grouping-budget.json is missing (was: infinite)", () => {
    const { status, out } = scanFixture();
    expect(status).toBe(2);
    expect(out).toContain("scripts-grouping-budget.json missing — grouping verdict UNKNOWN");
  });

  it("names each absent source tree as skipped, and still passes the trees it did scan", () => {
    const { status, out } = scanFixture((root) => {
      writeFileSync(join(root, "scripts-grouping-budget.json"), JSON.stringify({ groups: 0 }));
    });
    expect(status).toBe(0);
    expect(out).toContain("· app/src/ absent — not scanned");
    expect(out).toContain("· tests/ absent — not scanned");
    expect(out).toContain("✓ all 2 source files within the cap");
  });
});
