import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { sitesIn } from "../../scripts/intl-scan.mjs";

// The Intl gate (#4612 criterion 6, formatter half): an `Intl.*` formatter built inside a function
// body fails the build. BLOCKING, unlike the advisory debt scans — a formatter per equity sample
// is the line that OOM-killed production (scripts/intl-scan.mjs's header).
const SCRIPT = join(process.cwd(), "scripts/intl-scan.mjs");

function run(cwd: string): { status: number; out: string } {
  try {
    const out = execFileSync("node", [SCRIPT], { cwd, encoding: "utf8", stdio: "pipe" });
    return { status: 0, out };
  } catch (err) {
    const e = err as { status: number; stdout?: string; stderr?: string };
    return { status: e.status, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

describe("intl gate — this repo", () => {
  it("finds no formatter built in a function the grandfather list doesn't name, and no stale entry", () => {
    const { status, out } = run(process.cwd());
    expect({ status, out }).toEqual({ status: 0, out: expect.stringContaining("✓") });
  });
});

describe("intl scan — what counts as a site", () => {
  it("counts the formatter-per-sample shape that crashed production (4ba54e84)", () => {
    const src = [
      "export function marketDay(ts: number): string {",
      '  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(ts);',
      "}",
    ].join("\n");
    expect(sitesIn(src)).toEqual([{ read: "Intl.DateTimeFormat()", line: 2 }]);
  });

  it("counts a brace-less arrow body, a method and a call without `new`", () => {
    const src = [
      'export const count = (n: number) => new Intl.NumberFormat("en-US").format(n);',
      "class A {",
      '  f = () => Intl.PluralRules("en");',
      "}",
    ].join("\n");
    expect(sitesIn(src).map((s) => s.line)).toEqual([1, 3]);
  });

  it("does not count a module-level constant, built once for the process's life", () => {
    const src = [
      'const MONEY = new Intl.NumberFormat("en-US", {',
      '  style: "currency",',
      '  currency: "USD",',
      "});",
      'export const day = new Intl.DateTimeFormat("en-CA");',
      "export function f(n: number) { return MONEY.format(n); }",
      'const AFTER = new Intl.ListFormat("en");',
    ].join("\n");
    expect(sitesIn(src)).toEqual([]);
  });

  it("does not count Intl helpers that allocate no formatter, or a type", () => {
    const src = [
      "export function zones(): string[] {",
      '  return Intl.supportedValuesOf("timeZone");',
      "}",
      "type O = Intl.DateTimeFormatOptions;",
      "function g(f: Intl.DateTimeFormat) { return f.format(0); }",
    ].join("\n");
    expect(sitesIn(src)).toEqual([]);
  });

  it("ignores a constructor named only in a comment or a string", () => {
    const src = [
      "function f() {",
      "  // new Intl.DateTimeFormat() used to run here",
      '  return "new Intl.NumberFormat(x)"; /* Intl.Collator( */',
      "}",
    ].join("\n");
    expect(sitesIn(src)).toEqual([]);
  });

  it("keeps its depth through braces inside strings and template literals", () => {
    const src = [
      "function f(x: string) {",
      '  const a = "{{{";',
      "  const b = `${x} }}`;",
      '  return new Intl.NumberFormat("en-US");',
      "}",
    ].join("\n");
    expect(sitesIn(src)).toEqual([{ read: "Intl.NumberFormat()", line: 4 }]);
  });
});

describe("intl scan — the grandfather list only shrinks", () => {
  function fixture(grandfather: unknown, file: string, code: string) {
    const root = mkdtempSync(join(tmpdir(), "intl-fixture-"));
    try {
      for (const dir of ["src/domain", "src/scripts", "app/src"]) {
        mkdirSync(join(root, dir), { recursive: true });
      }
      const body = "export const f = () => new Intl.NumberFormat('en-US');\n";
      writeFileSync(join(root, "src/domain/intl-format.ts"), body); // the shared home
      writeFileSync(join(root, "src/scripts/tool.ts"), body); // a CLI tool
      writeFileSync(join(root, "src/domain/x.spec.ts"), body); // a spec
      writeFileSync(join(root, file), code);
      if (grandfather !== undefined) {
        writeFileSync(join(root, "intl-grandfather.json"), JSON.stringify(grandfather));
      }
      return run(root);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }
  const code = "export function g() { return new Intl.NumberFormat('en-US'); }\n";
  const listed = (count: number) => ({
    "app/src/n.ts": { "Intl.NumberFormat()": { count, why: "fixture" } },
  });

  it("passes when every site in scope is listed (the shared home, CLI tools and specs are out)", () => {
    const { status, out } = fixture(listed(1), "app/src/n.ts", code);
    expect(status).toBe(0);
    expect(out).toContain("1 formatter(s)");
  });

  it("fails a site in src/ as new — nothing there is listed", () => {
    const { status, out } = fixture({}, "src/domain/n.ts", code);
    expect(status).toBe(1);
    expect(out).toContain("src/domain/n.ts:1  Intl.NumberFormat() (grandfathered: 0)");
  });

  it("fails a listed count the code no longer reaches, so the total stays honest", () => {
    const { status, out } = fixture(listed(2), "app/src/n.ts", code);
    expect(status).toBe(1);
    expect(out).toContain("app/src/n.ts  Intl.NumberFormat(): listed 2, found 1");
  });

  it("exits 2, never a quiet pass, when the grandfather list is missing", () => {
    const { status, out } = fixture(undefined, "app/src/n.ts", code);
    expect(status).toBe(2);
    expect(out).toContain("Intl verdict UNKNOWN");
  });
});
