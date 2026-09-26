import { execFileSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { advisoryScan } from "../support/advisory-scan.js";

// Clone fitness gate — runs the real scanner (scripts/clone-scan.mjs). To consolidate a clone run
// /dedupe. Advisory since 2026-08-29 (Eric) — see tests/support/advisory-scan.ts.
describe("clone budget (advisory)", () => {
  it("reports copy-paste clone pairs without blocking CI", () => {
    advisoryScan("scripts/clone-scan.mjs");
  });
});

const SCRIPT = join(process.cwd(), "scripts/clone-scan.mjs");

// A stand-in jscpd on the fixture's local bin path (npx resolves it before the registry): either
// writes an empty report where --output points, or fails without writing one.
const FAKE_JSCPD = (writesReport: boolean) =>
  [
    "#!/usr/bin/env node",
    writesReport
      ? [
          'const fs = require("node:fs"), path = require("node:path");',
          'const out = process.argv[process.argv.indexOf("--output") + 1];',
          "const total = { clones: 0, duplicatedLines: 0, percentage: 0 };",
          'fs.writeFileSync(path.join(out, "jscpd-report.json"),',
          "  JSON.stringify({ statistics: { total }, duplicates: [] }));",
        ].join("\n")
      : 'process.stderr.write("jscpd: cannot parse .jscpd.json\\n"); process.exit(1);',
  ].join("\n");

/** Run the real scanner in a seeded fixture with a fake jscpd; return {status, out}. */
function scanFixture(writesReport: boolean, budget?: number): { status: number; out: string } {
  const root = mkdtempSync(join(tmpdir(), "clone-scan-fixture-"));
  try {
    writeFileSync(
      join(root, "package.json"),
      JSON.stringify({ name: "fixture", version: "1.0.0" }),
    );
    mkdirSync(join(root, "node_modules", ".bin"), { recursive: true });
    const bin = join(root, "node_modules", ".bin", "jscpd");
    writeFileSync(bin, FAKE_JSCPD(writesReport));
    chmodSync(bin, 0o755);
    if (budget !== undefined)
      writeFileSync(join(root, "clone-budget.json"), JSON.stringify({ clones: budget }));
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
describe("clone-scan — missing inputs are named, never a quiet pass", () => {
  it("passes when jscpd reports and the budget holds (the fixture's control case)", () => {
    const { status, out } = scanFixture(true, 0);
    expect(status).toBe(0);
    expect(out).toContain("✓ clones within budget (0 ≤ 0)");
  });

  it("exits 2 with UNKNOWN when clone-budget.json is missing (was: infinite budget)", () => {
    const { status, out } = scanFixture(true);
    expect(status).toBe(2);
    expect(out).toContain("clone-budget.json missing — clone verdict UNKNOWN");
  });

  it("exits 2 naming jscpd's own error when it wrote no report", () => {
    const { status, out } = scanFixture(false, 0);
    expect(status).toBe(2);
    expect(out).toContain("jscpd wrote no report — clone count UNKNOWN");
    expect(out).toContain("cannot parse .jscpd.json");
  });
});
