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
});
