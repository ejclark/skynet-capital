import { readdirSync, readFileSync } from "node:fs";
import { builtinModules } from "node:module";
import { join } from "node:path";

/**
 * Packaging guard for the slim image (slice 9 of #4612, Dockerfile `dashboard` target).
 *
 * The runtime stages install `npm ci --omit=dev`, so a bare import under src/ that resolves to a
 * devDependency would boot fine on every laptop and in CI (full install) and then crash the
 * production image on its first request. The same shape as dockerignore-research.spec.ts: match
 * what the image will actually contain against what the code actually asks for.
 */
const ROOT = join(__dirname, "..", "..");
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
  dependencies: Record<string, string>;
};

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return sourceFiles(p);
    return /\.tsx?$/.test(e.name) && !/\.(spec|test)\.tsx?$/.test(e.name) ? [p] : [];
  });
}

// `from "x"`, `import "x"`, `import("x")`, `require("x")` — a bare specifier is neither relative nor absolute.
const SPECIFIER = /(?:\bfrom\s+|\bimport\s*\(?\s*|\brequire\s*\(\s*)["']([^"'./][^"']*)["']/g;

function packageOf(spec: string): string {
  const parts = spec.split("/");
  return spec.startsWith("@") ? parts.slice(0, 2).join("/") : (parts[0] ?? spec);
}

describe("runtime dependencies — everything src/ imports is in the production install", () => {
  it("imports only node built-ins and `dependencies` (never a devDependency)", () => {
    const builtins = new Set(builtinModules);
    const used = new Map<string, string>();
    for (const file of sourceFiles(join(ROOT, "src"))) {
      // Comments hold prose like `distinct from "quiet"` that the pattern would read as an import.
      const code = readFileSync(file, "utf8").replace(
        /\/\*[\s\S]*?\*\/|(^|[^:"'`])\/\/.*$/gm,
        "$1",
      );
      for (const m of code.matchAll(SPECIFIER)) {
        const spec = m[1] ?? "";
        // Prose in a string ("from the system, …") is not a package: names hold no space or comma.
        if (/[\s,]/.test(spec)) continue;
        if (spec.startsWith("node:") || builtins.has(packageOf(spec))) continue;
        used.set(packageOf(spec), file.slice(ROOT.length + 1));
      }
    }
    const missing = [...used].filter(([name]) => !(name in pkg.dependencies));
    expect(missing).toEqual([]);
  });

  it("keeps `bots` the last Dockerfile stage and the `dashboard` stage free of tsx", () => {
    const docker = readFileSync(join(ROOT, "Dockerfile"), "utf8");
    const stages = [...docker.matchAll(/^FROM\s+\S+\s+AS\s+(\S+)/gim)].map((m) => m[1]);
    expect(stages.at(-1)).toBe("bots");
    expect(stages).toEqual(expect.arrayContaining(["dashboard", "deps-prod", "build"]));
    const instructions = docker.replace(/^#.*$/gm, "");
    const dashboardStage = instructions.slice(
      instructions.search(/^FROM\s+\S+\s+AS\s+dashboard/im),
      instructions.search(/^FROM\s+dashboard\s+AS\s+bots/im),
    );
    expect(dashboardStage).not.toMatch(/tsx|deps-full/);
  });
});
