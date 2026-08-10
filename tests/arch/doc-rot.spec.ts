import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Doc-rot fitness gate — runs the real scanner (scripts/doc-rot-scan.mjs) so docs that no longer
// describe reality can't accumulate silently. Contract: docs/plans/doc-rot-gate.md. To adjust the
// budget, fix the doc (or its target) and run `node scripts/doc-rot-scan.mjs --update`.
const SCRIPT = join(process.cwd(), "scripts/doc-rot-scan.mjs");

/** Run the scanner in a seeded fixture repo; return {status, stdout+stderr}. */
function scanFixture(seed: (root: string) => void): { status: number; out: string } {
  const root = mkdtempSync(join(tmpdir(), "doc-rot-fixture-"));
  try {
    mkdirSync(join(root, "docs"), { recursive: true });
    writeFileSync(join(root, "package.json"), JSON.stringify({ scripts: { verify: "true" } }));
    seed(root);
    try {
      const out = execFileSync("node", [SCRIPT], { cwd: root, encoding: "utf8" });
      return { status: 0, out };
    } catch (err) {
      const e = err as { status: number; stdout?: string; stderr?: string };
      return { status: e.status, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

describe("doc-rot budget", () => {
  it("the repo's docs stay within the committed doc-rot budget", () => {
    expect(() =>
      execFileSync("node", [SCRIPT], { cwd: process.cwd(), stdio: "pipe" }),
    ).not.toThrow();
  });
});

describe("doc-rot scanner behavior (seeded fixtures)", () => {
  it("flags a doc referencing a repo file that does not exist", () => {
    const { status, out } = scanFixture((root) => {
      writeFileSync(join(root, "docs", "GUIDE.md"), "See `src/missing/thing.ts` for details.");
      writeFileSync(join(root, "doc-rot-budget.json"), JSON.stringify({ findings: 0 }));
    });
    expect(status).toBe(1);
    expect(out).toContain("src/missing/thing.ts");
  });

  it("accepts references that resolve from the repo root or the doc's own directory", () => {
    const { status } = scanFixture((root) => {
      writeFileSync(join(root, "docs", "REAL.md"), "# real");
      writeFileSync(join(root, "docs", "GUIDE.md"), "See [the doc](REAL.md) and `docs/REAL.md`.");
      writeFileSync(join(root, "doc-rot-budget.json"), JSON.stringify({ findings: 0 }));
    });
    expect(status).toBe(0);
  });

  it("accepts bare-basename prose shorthand for a file living in docs/", () => {
    const { status } = scanFixture((root) => {
      writeFileSync(join(root, "docs", "IDEAS.md"), "# ideas");
      writeFileSync(join(root, "CLAUDE.md"), "Log the worthy ones to `IDEAS.md`.");
      writeFileSync(join(root, "doc-rot-budget.json"), JSON.stringify({ findings: 0 }));
    });
    expect(status).toBe(0);
  });

  it("flags docs naming npm scripts that package.json does not define", () => {
    const { status, out } = scanFixture((root) => {
      writeFileSync(join(root, "docs", "GUIDE.md"), "Run `npm run does-not-exist` to verify.");
      writeFileSync(join(root, "doc-rot-budget.json"), JSON.stringify({ findings: 0 }));
    });
    expect(status).toBe(1);
    expect(out).toContain("npm run does-not-exist");
  });

  it("ignores URLs, globs, and placeholder tokens", () => {
    const { status } = scanFixture((root) => {
      writeFileSync(
        join(root, "docs", "GUIDE.md"),
        "See https://example.com/x.md and `src/**/*.ts` and `<your-file>.md` and `$HOME/x.md`.",
      );
      writeFileSync(join(root, "doc-rot-budget.json"), JSON.stringify({ findings: 0 }));
    });
    expect(status).toBe(0);
  });

  it("fails only when rot exceeds the committed budget (grandfathering holds)", () => {
    const { status } = scanFixture((root) => {
      writeFileSync(join(root, "docs", "GUIDE.md"), "See `src/gone.ts`.");
      writeFileSync(join(root, "doc-rot-budget.json"), JSON.stringify({ findings: 1 }));
    });
    expect(status).toBe(0);
  });
});
