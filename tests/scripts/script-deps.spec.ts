import { bareImportsOf, needsInstalledDeps } from "../../scripts/script-deps.mjs";

// The import-graph walker behind workflow-lint's rule 6 (#894, following #889/#890). Driven
// entirely against a stub filesystem — a Map of path → source text — so these specs never touch
// real disk and can pin the EXACT shape that broke #889/#890: a script with no direct bare import
// that still needs `node_modules` because a file it imports relatively does.
function fixtureFs(files: Record<string, string>) {
  const read = (path: string): string => {
    const text = Object.hasOwn(files, path) ? files[path] : undefined;
    if (text === undefined) throw new Error(`ENOENT: ${path}`);
    return text;
  };
  const resolvePath = (from: string, spec: string): string => {
    // Fixture paths are flat keys like "/scripts/foo.mjs" — resolve "./bar.mjs" relative to the
    // entry's own directory the same way the real resolver (node:path's dirname+resolve) would.
    const dir = from.slice(0, from.lastIndexOf("/"));
    const parts = `${dir}/${spec}`.split("/").filter(Boolean);
    const out: string[] = [];
    for (const p of parts) {
      if (p === "..") out.pop();
      else if (p !== ".") out.push(p);
    }
    return `/${out.join("/")}`;
  };
  return { read, resolvePath };
}

describe("bareImportsOf / needsInstalledDeps", () => {
  it("finds nothing for a script that only imports node: builtins", () => {
    const { read, resolvePath } = fixtureFs({
      "/scripts/moneypenny/repair.mjs": `import { readFileSync } from "node:fs";\nimport { execFileSync } from "node:child_process";\n`,
    });
    expect(bareImportsOf("/scripts/moneypenny/repair.mjs", read, resolvePath)).toEqual(new Set());
    expect(needsInstalledDeps("/scripts/moneypenny/repair.mjs", read, resolvePath)).toBe(false);
  });

  it("finds a bare import declared directly on the entry script", () => {
    const { read, resolvePath } = fixtureFs({
      "/scripts/foo.mjs": `import { z } from "zod";\n`,
    });
    expect(bareImportsOf("/scripts/foo.mjs", read, resolvePath)).toEqual(new Set(["zod"]));
    expect(needsInstalledDeps("/scripts/foo.mjs", read, resolvePath)).toBe(true);
  });

  it("follows a relative import to find a TRANSITIVE bare dep — the exact #890 shape", () => {
    // envelope-scan.mjs itself imports nothing bare; envelope-widening.mjs (imported relatively)
    // imports `typescript`. The direct-imports-only version of this check would have missed it.
    const { read, resolvePath } = fixtureFs({
      "/scripts/envelope-scan.mjs": `import { classifyStructuralWidening } from "./envelope-widening.mjs";\n`,
      "/scripts/envelope-widening.mjs": `import { createScanner } from "typescript/unstable/ast";\n`,
    });
    expect(bareImportsOf("/scripts/envelope-scan.mjs", read, resolvePath)).toEqual(
      new Set(["typescript/unstable/ast"]),
    );
    expect(needsInstalledDeps("/scripts/envelope-scan.mjs", read, resolvePath)).toBe(true);
  });

  it("does not loop forever on an import cycle", () => {
    const { read, resolvePath } = fixtureFs({
      "/scripts/a.mjs": `import "./b.mjs";\n`,
      "/scripts/b.mjs": `import "./a.mjs";\n`,
    });
    expect(() => bareImportsOf("/scripts/a.mjs", read, resolvePath)).not.toThrow();
    expect(bareImportsOf("/scripts/a.mjs", read, resolvePath)).toEqual(new Set());
  });

  it("stays silent (never a false alarm) on a script it cannot read", () => {
    const { read, resolvePath } = fixtureFs({});
    expect(bareImportsOf("/scripts/missing.mjs", read, resolvePath)).toEqual(new Set());
    expect(needsInstalledDeps("/scripts/missing.mjs", read, resolvePath)).toBe(false);
  });
});
