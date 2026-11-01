import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "@rstest/core";

// #1355 — the --check boundary normalizes its argument. Before this, `./envelope.json` and an
// absolute path answered `protected: false` for the protected file itself; every lane prompt and
// grind's automatic step 0 trust this answer instead of prose, so a false negative here is a hole
// in the one class interrupt economics never defers. Enforcement (runLaneScan) was never affected:
// its paths come from `git diff --name-only`, already repo-root-relative. Split from
// envelope.spec.ts to stay under that file's line budget.
type Check = { path: string; protected: boolean; blocking: boolean; pattern?: string };
const check = (...paths: string[]): Check[] =>
  JSON.parse(
    execFileSync("node", ["scripts/envelope-scan.mjs", "--check", ...paths], {
      cwd: process.cwd(),
      encoding: "utf8",
    }),
  ) as Check[];
const only = (rows: Check[]): Check => {
  const [row] = rows;
  if (!row) throw new Error("--check returned no rows");
  return row;
};

describe("--check normalizes the path it is given (#1355)", () => {
  const baseline = only(check("envelope.json"));
  it("treats the literal protected file as protected — the baseline the equivalents are held to", () => {
    expect(baseline.protected).toBe(true);
    expect(baseline.blocking).toBe(true);
  });
  it("gives the same verdict for a ./-prefixed, an absolute, and a trailing-slash form", () => {
    const forms = ["./envelope.json", join(process.cwd(), "envelope.json"), "envelope.json/"];
    for (const [i, r] of check(...forms).entries()) {
      expect(r.path, forms[i]).toBe("envelope.json");
      expect(r.protected, forms[i]).toBe(true);
      expect(r.pattern, forms[i]).toBe(baseline.pattern);
    }
  });
  it("still answers false for an open path in any of those forms — normalization never widens", () => {
    for (const r of check("./CLAUDE.md", join(process.cwd(), "CLAUDE.md"), "CLAUDE.md")) {
      expect(r.path).toBe("CLAUDE.md");
      expect(r.protected).toBe(false);
    }
  });
  it("leaves a path outside the repo as typed, and unprotected", () => {
    const r = only(check("/definitely/not/in/this/repo/envelope.json"));
    expect(r.path).toBe("/definitely/not/in/this/repo/envelope.json");
    expect(r.protected).toBe(false);
  });
  // Flags count only before the first path, and `--` ends them. Parsing them anywhere was the hole:
  // the arm job's paths are file NAMES a PR chooses, so a file named `--base` ate the protected
  // path after it. A flag's value is still never a path when a caller gives it up front.
  it("takes a flag's value only before the first path", () => {
    const rows = check("--base", "0123456789abcdef0123456789abcdef01234567", "envelope.json");
    expect(rows.map((r) => r.path)).toEqual(["envelope.json"]);
    expect(check("--lane", "feedback/1", "CLAUDE.md").map((r) => r.path)).toEqual(["CLAUDE.md"]);
  });
  it("keeps a caller's up-front flag and still reads every path after -- as a path", () => {
    const rows = check("--base", "origin/main", "--", "--base", "envelope.json");
    expect(rows.map((r) => r.path)).toEqual(["--base", "envelope.json"]);
  });
  it("judges a protected path behind a root file named --base, after --", () => {
    const rows = check("--", "--base", "envelope.json");
    expect(rows.map((r) => r.path)).toEqual(["--base", "envelope.json"]);
    expect(rows.find((r) => r.path === "envelope.json")?.blocking).toBe(true);
  });
  it("judges a protected path behind a decoy that word-splits into a flag", () => {
    // `git diff --name-only` prints "CLAUDE.m --lane" unquoted; word-split it is two arguments.
    const rows = check("CLAUDE.m", "--lane", "envelope.json");
    expect(rows.map((r) => r.path)).toEqual(["CLAUDE.m", "--lane", "envelope.json"]);
    expect(rows.find((r) => r.path === "envelope.json")?.blocking).toBe(true);
  });
  it("treats an unknown --word as the first path, so it cannot shield a flag behind it", () => {
    const rows = check("--aaa", "--base", "envelope.json");
    expect(rows.map((r) => r.path)).toEqual(["--aaa", "--base", "envelope.json"]);
  });
});

// #6018 — process.exit() dropped stdout still queued on a pipe, cutting --check JSON at 64 KiB.
// A slow reader is load-bearing: execFileSync drains as it goes and never sees the truncation.
describe("--check survives a pipe past 64 KiB (#6018)", () => {
  it("emits parseable JSON with one row per path when the reader is slow", () => {
    const paths = Array.from({ length: 1500 }, (_, i) => `src/does-not-exist-${i}.ts`);
    const out = execFileSync(
      "sh",
      ["-c", 'node scripts/envelope-scan.mjs --check "$@" | { sleep 0.5; cat; }', "sh", ...paths],
      { cwd: process.cwd(), encoding: "utf8" },
    );
    expect((JSON.parse(out) as Check[]).length).toBe(paths.length);
  });
});
