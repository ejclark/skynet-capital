import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Journey contract gate — lenient by design (headings + filename only, never content quality):
// the 2026-08-20 hat-team research found journeys were the least-instrumented feedback surface
// in the repo, and that the binding constraint is that they FIRE at all. This spec keeps the
// skeleton honest without taxing the capture habit.
const run = (cwd: string, args: string[] = ["--validate"]) => {
  try {
    execFileSync("node", [join(process.cwd(), "scripts/journey-scan.mjs"), ...args], {
      cwd,
      stdio: "pipe",
    });
    return { code: 0, stderr: "" };
  } catch (error) {
    const e = error as { status?: number; stderr?: Buffer };
    return { code: e.status ?? -1, stderr: e.stderr?.toString() ?? "" };
  }
};

describe("journey scan — the reasoning-record contract", () => {
  it("every committed journey satisfies the template contract", () => {
    const { code, stderr } = run(process.cwd());
    expect(stderr).toBe("");
    expect(code).toBe(0);
  });

  it("flags a journey missing its spine — the section that decays first", () => {
    const dir = mkdtempSync(join(tmpdir(), "journey-spec-"));
    mkdirSync(join(dir, "docs", "JOURNEYS"), { recursive: true });
    writeFileSync(
      join(dir, "docs", "JOURNEYS", "half-a-journey.md"),
      "# Journey — half\n\n## The question, verbatim\n\n> q\n\n## Where it stands\n\nfine\n",
    );
    const { code, stderr } = run(dir);
    rmSync(dir, { recursive: true, force: true });
    expect(code).toBe(1);
    expect(stderr).toContain("What moved, and what moved it");
  });

  it("flags a non-kebab-case filename — journeys are named for the question", () => {
    const dir = mkdtempSync(join(tmpdir(), "journey-spec-"));
    mkdirSync(join(dir, "docs", "JOURNEYS"), { recursive: true });
    const full = [
      "# Journey — x",
      "## The question, verbatim",
      "## Where it stands",
      "## What moved, and what moved it",
      "## Rejected branches",
      "## Open forks",
    ].join("\n\n");
    writeFileSync(join(dir, "docs", "JOURNEYS", "Voice_Profiles.md"), full);
    const { code, stderr } = run(dir);
    rmSync(dir, { recursive: true, force: true });
    expect(code).toBe(1);
    expect(stderr).toContain("kebab-case");
  });
});
