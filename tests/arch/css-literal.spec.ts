import { execFileSync, spawnSync } from "node:child_process";
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

// --apply swaps a literal for the token it equals, one file at a time. Each case seeds its own
// stylesheet and reads back what the run left on disk.
type ApplySeed = {
  css: string;
  theme?: string;
  shell?: string;
  extraCss?: string;
  args?: string[];
};

const fixtures: string[] = [];

function apply({ css, theme = THEME, shell = SHELL, extraCss, args }: ApplySeed) {
  const root = mkdtempSync(join(tmpdir(), "css-literal-apply-"));
  const styles = join(root, "app/src/styles");
  const run = (...flags: string[]) =>
    spawnSync("node", [SCRIPT, ...flags], { cwd: root, encoding: "utf8" });
  fixtures.push(root);
  mkdirSync(styles, { recursive: true });
  writeFileSync(join(styles, "theme.css"), theme);
  writeFileSync(join(styles, "a.css"), css);
  if (extraCss) writeFileSync(join(styles, "b.css"), extraCss);
  writeFileSync(join(root, "app/src/shell.tsx"), shell);
  const r = run(...(args ?? ["--apply", "app/src/styles/a.css"]));
  return {
    status: r.status,
    out: r.stdout + r.stderr,
    css: readFileSync(join(styles, "a.css"), "utf8"),
    theme: readFileSync(join(styles, "theme.css"), "utf8"),
    counts: () => JSON.parse(run("--json").stdout).counts,
    again: () => run("--apply", "app/src/styles/a.css"),
  };
}

afterEach(() => {
  for (const root of fixtures.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("css-literal-scan --apply", () => {
  it("swaps a literal for the token it equals, and leaves every other value alone", () => {
    const r = apply({ css: STYLES });
    expect(r.status).toBe(0);
    expect(JSON.parse(r.out)).toEqual({
      file: "app/src/styles/a.css",
      swapped: 2,
      skipped: [],
    });
    expect(r.css).toBe(
      STYLES.replace("padding: 8px 10px", "padding: var(--space-2) 10px").replace(
        "font-size: 12.5px",
        "font-size: var(--text-md)",
      ),
    );
  });

  it("drops the scan's count by exactly the swaps, and a second run swaps nothing", () => {
    const r = apply({ css: STYLES });
    expect(r.counts()).toMatchObject({
      spacingEqualsToken: 0,
      fontSizeEqualsToken: 0,
      rawSpacing: 1,
      rawFontSize: 0,
    });
    const second = r.again();
    expect(JSON.parse(second.stdout).swapped).toBe(0);
  });

  it("swaps each literal in a shorthand, a calc and a multi-line value", () => {
    const css = ".a {\n  margin: 8px 8px;\n  gap: calc(8px + 1px);\n  padding: 8px\n    10px;\n}\n";
    const r = apply({ css });
    expect(JSON.parse(r.out).swapped).toBe(4);
    expect(r.css).toBe(
      ".a {\n  margin: var(--space-2) var(--space-2);\n  gap: calc(var(--space-2) + 1px);\n" +
        "  padding: var(--space-2)\n    10px;\n}\n",
    );
  });

  it("finds a literal that follows a var() in the same value", () => {
    const css = ".a {\n  margin: var(--space-2, 2px) 8px var(--space-2) 12.5px;\n}\n";
    const r = apply({ css });
    expect(JSON.parse(r.out).swapped).toBe(1);
    expect(r.css).toBe(
      ".a {\n  margin: var(--space-2, 2px) var(--space-2) var(--space-2) 12.5px;\n}\n",
    );
  });

  it("never touches what only looks like the literal", () => {
    const css = [
      "/* padding: 8px; a comment */",
      ".a {",
      "  padding: 18px 8.5px;",
      "  margin-left: -8px;",
      "  gap: var(--space-2, 8px); /* gap: 8px */",
      "  width: 8px;",
      "  font-size: 8px;",
      "  padding-top: 8rem;",
      "}",
      "",
    ].join("\n");
    const r = apply({ css });
    expect(JSON.parse(r.out).swapped).toBe(0);
    expect(r.css).toBe(css);
  });

  // The swap renders the same only if the token holds that one value everywhere it can apply.
  it("skips a token with a second value in the theme, and names why", () => {
    const theme = `${THEME}:root[data-density="compact"] {\n  --space-2: 6px;\n}\n`;
    const css = ".a {\n  padding: 8px;\n  font-size: 12.5px;\n}\n";
    const r = apply({ css, theme });
    const report = JSON.parse(r.out);
    expect(report.swapped).toBe(1);
    expect(report.skipped).toEqual([
      expect.objectContaining({
        where: "app/src/styles/a.css:2",
        token: "--space-2",
        why: expect.stringContaining("more than one value"),
      }),
    ]);
    expect(r.css).toBe(".a {\n  padding: 8px;\n  font-size: var(--text-md);\n}\n");
  });

  it("skips a token another stylesheet or the app's code sets", () => {
    const css = ".a {\n  padding: 8px;\n}\n";
    const inCss = apply({ css, extraCss: ".b {\n  --space-2: 6px;\n}\n" });
    expect(JSON.parse(inCss.out).skipped[0].why).toContain("set outside theme.css");
    expect(inCss.css).toBe(css);
    const inCode = apply({ css, shell: 'export const s = { "--space-2": "6px" };\n' });
    expect(JSON.parse(inCode.out).skipped[0].why).toContain("set outside theme.css");
    expect(inCode.css).toBe(css);
  });

  it("refuses theme.css, a missing file and no file at all, without writing", () => {
    const refused = (args: string[]) => apply({ css: STYLES, args });
    const onTheme = refused(["--apply", "app/src/styles/theme.css"]);
    expect(onTheme.status).toBe(2);
    expect(onTheme.theme).toBe(THEME);
    expect(refused(["--apply", "app/src/styles/nope.css"]).status).toBe(2);
    expect(refused(["--apply", "../outside.css"]).status).toBe(2);
    const noFile = refused(["--apply"]);
    expect(noFile.status).toBe(2);
    expect(noFile.css).toBe(STYLES);
  });
});
