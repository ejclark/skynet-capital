import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { advisoryScan } from "../support/advisory-scan.js";

// CSS-literal fitness gate — runs the real scanner (scripts/css-literal-scan.mjs) over the React
// shell's styles. The budget check is advisory (debt class, see tests/support/advisory-scan.ts); the
// fixture specs below test the tool itself and stay blocking.
describe("css-literal budget (advisory)", () => {
  it("reports off-ladder type/spacing/radius literals without blocking CI", () => {
    advisoryScan("scripts/css-literal-scan.mjs");
  });
});

const SCRIPT = join(process.cwd(), "scripts/css-literal-scan.mjs");

const THEME = ":root {\n  --space-2: 8px;\n  --text-md: 12.5px;\n}\n";
const STYLES = [
  "/* padding: 99px; a commented-out declaration is not a literal */",
  ".a {",
  "  padding: 8px 10px;",
  "  margin: 0;",
  "  gap: var(--space-2);",
  "  font-size: 12.5px;",
  "  border-radius: 6px;",
  "  letter-spacing: 0.04em;",
  "}",
  ".b {",
  "  border-radius: var(--radius-sm, 6px);",
  "  font-size: var(--text-md, 15px);",
  "  color: var(--set-inline, red);",
  "}",
].join("\n");
const SHELL = 'export const s = { "--set-inline": "1" };\n';

/** The fixture's counts, by construction of THEME/STYLES/SHELL above. */
const COUNTS = {
  rawFontSize: 1,
  fontSizeEqualsToken: 1,
  rawSpacing: 2,
  spacingEqualsToken: 1,
  rawRadius: 1,
  rawLetterSpacing: 1,
  danglingVar: 1,
  mismatchedFallback: 1,
};

type Seed = { theme?: string | null; budget?: Record<string, number> };

/** Seed a fixture repo, run the scanner with `args`; return exit status, output, and the budget. */
function scan(
  seed: Seed,
  args: string[] = [],
): { status: number; out: string; budget: string | null } {
  const root = mkdtempSync(join(tmpdir(), "css-literal-fixture-"));
  try {
    const styles = join(root, "app/src/styles");
    mkdirSync(styles, { recursive: true });
    if (seed.theme !== null) writeFileSync(join(styles, "theme.css"), seed.theme ?? THEME);
    writeFileSync(join(styles, "a.css"), STYLES);
    writeFileSync(join(root, "app/src/shell.tsx"), SHELL);
    const budgetFile = join(root, "css-literal-budget.json");
    if (seed.budget) writeFileSync(budgetFile, JSON.stringify(seed.budget));
    const read = () => {
      try {
        return readFileSync(budgetFile, "utf8");
      } catch {
        return null;
      }
    };
    try {
      const out = execFileSync("node", [SCRIPT, ...args], { cwd: root, encoding: "utf8" });
      return { status: 0, out, budget: read() };
    } catch (err) {
      const e = err as { status: number; stdout?: string; stderr?: string };
      return { status: e.status, out: `${e.stdout ?? ""}${e.stderr ?? ""}`, budget: read() };
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

describe("css-literal-scan — what it counts", () => {
  it("counts raw literals, token-equal literals, and lying fallbacks", () => {
    const { status, out } = scan({}, ["--json"]);
    expect(status).toBe(0);
    const report = JSON.parse(out);
    expect(report.counts).toEqual({
      ...COUNTS,
      radiusEqualsToken: null,
      letterSpacingEqualsToken: null,
    });
    expect(report.findings.danglingVar[0]).toMatchObject({
      where: "app/src/styles/a.css:11",
      var: "--radius-sm",
    });
    expect(report.findings.mismatchedFallback[0]).toMatchObject({
      var: "--text-md",
      fallback: "15px",
      token: "12.5px",
    });
  });

  it("gives a family its token-equal count once a token lands on its ladder", () => {
    const theme = THEME.replace("}", "  --radius-2: 6px;\n}");
    const report = JSON.parse(scan({ theme }, ["--json"]).out);
    expect(report.counts.radiusEqualsToken).toBe(1);
  });
});

describe("css-literal-scan — verdict and ratchet", () => {
  it("passes at budget and exits 1 naming the count that grew", () => {
    expect(scan({ budget: COUNTS }).status).toBe(0);
    const { status, out } = scan({ budget: { ...COUNTS, rawSpacing: 1 } });
    expect(status).toBe(1);
    expect(out).toContain("rawSpacing grew: 2 > budget 1");
  });

  it("--update lowers a budget but never raises one", () => {
    const { budget } = scan({ budget: { ...COUNTS, rawSpacing: 1, rawRadius: 9 } }, ["--update"]);
    expect(JSON.parse(budget ?? "{}")).toMatchObject({ rawSpacing: 1, rawRadius: 1 });
  });

  // Honest degradation (docs/grind/honest-degradation.instructions.md): a missing input is a
  // named state, never a quiet pass.
  it("exits 2 UNKNOWN with no budget, a missing key, or no theme.css", () => {
    expect(scan({}).status).toBe(2);
    const { rawRadius: _dropped, ...partial } = COUNTS;
    const missingKey = scan({ budget: partial });
    expect(missingKey.status).toBe(2);
    expect(missingKey.out).toContain("has no rawRadius");
    const noTheme = scan({ theme: null, budget: COUNTS });
    expect(noTheme.status).toBe(2);
    expect(noTheme.out).toContain("theme.css not found");
  });
});
