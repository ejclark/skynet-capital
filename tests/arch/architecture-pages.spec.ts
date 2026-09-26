import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";

// The storybook is generated from docs/architecture/source/ and must stay that way: a hand-edited
// page drifts the way ADR-0008's July spec surface did (never built, then re-derived by grep for
// two months). Two contracts: the pages on disk equal the render, and every code root a container
// cites exists — a diagram is a claim, and a claim about a path that is not there is the drift
// this page exists to end (docs/PICTURES.md → honesty rules).

const SOURCE = join("docs", "architecture", "source");

/** A code root may be a directory, a file, or a simple `*` glob inside one directory. */
const rootExists = (root: string): boolean => {
  if (!root.includes("*")) return existsSync(root);
  const dir = dirname(root);
  const pattern = new RegExp(
    `^${basename(root)
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, ".*")}$`,
  );
  return existsSync(dir) && readdirSync(dir).some((f) => pattern.test(f));
};

describe("architecture storybook — generated, grounded", () => {
  it("the pages on disk match the generator's render of source/", () => {
    const out = execFileSync("node", ["scripts/architecture-pages.mjs", "--check"], {
      encoding: "utf8",
    });
    expect(out).toContain("match source/");
  });

  it("every code root a container cites exists in the repo", () => {
    const maps = JSON.parse(readFileSync(join(SOURCE, "maps.json"), "utf8")) as Record<
      string,
      { containers: { id: string; code_roots?: string[] }[] }
    >;
    const missing: string[] = [];
    for (const [mapKey, m] of Object.entries(maps).filter(([k]) => !k.startsWith("_"))) {
      for (const c of m.containers) {
        for (const root of c.code_roots ?? []) {
          if (!rootExists(root)) missing.push(`${mapKey}/${c.id}: ${root}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it("carries one refuter verdict per container and relationship", () => {
    const maps = JSON.parse(readFileSync(join(SOURCE, "maps.json"), "utf8")) as Record<
      string,
      { containers: unknown[]; relationships: unknown[] }
    >;
    const verdicts = JSON.parse(readFileSync(join(SOURCE, "verdicts.json"), "utf8")) as unknown[];
    const claims = Object.entries(maps)
      .filter(([k]) => !k.startsWith("_"))
      .reduce((n, [, m]) => n + m.containers.length + m.relationships.length, 0);
    expect(verdicts.length).toBe(claims);
  });
});
