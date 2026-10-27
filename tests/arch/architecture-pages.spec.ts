import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { HAND_KEPT_PAGES } from "../../scripts/architecture-pages.mjs";

// The storybook is generated from docs/architecture/source/ and must stay that way: a hand-edited
// page drifts the way ADR-0008's July spec surface did (never built, then re-derived by grep for
// two months). Two contracts: the pages on disk equal the render, and every code root a container
// cites exists — a diagram is a claim, and a claim about a path that is not there is the drift
// this page exists to end (docs/PICTURES.md → honesty rules). A hand-kept page (HAND_KEPT_PAGES:
// one component's anatomy, cited by `path:line`) is held to the same rule by its citations.

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

/** Every `src/a/b.ts:12` or `src/a/b.ts:12-40` a page cites whose file is gone or no longer reaches
 *  the last line cited. A line that moved inside the file is not caught; a file that shrank is. */
const brokenCites = (page: string): string[] =>
  [...page.matchAll(/`(src\/[\w./-]+\.ts)(?::(\d+)(?:-(\d+))?)?`/g)].flatMap(
    ([, file = "", from, to]) => {
      if (!existsSync(file)) return [file];
      const last = Number(to ?? from ?? 0);
      const lines = readFileSync(file, "utf8").split("\n").length;
      return last > lines ? [`${file}:${last} (file has ${lines} lines)`] : [];
    },
  );

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

  it("every hand-kept page exists, and every src/ line it cites is still there", () => {
    const broken = HAND_KEPT_PAGES.flatMap((page) => {
      const path = join("docs", "architecture", page.file);
      if (!existsSync(path)) return [`${page.file}: missing`];
      const roots = page.roots.filter((root) => !existsSync(root));
      return [...roots, ...brokenCites(readFileSync(path, "utf8"))].map(
        (problem) => `${page.file}: ${problem}`,
      );
    });
    expect(broken).toEqual([]);
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
