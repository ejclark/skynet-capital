import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

// Playwright-CT generates one bundle from every e2e/ct spec's imports, so a single spec importing a
// deleted component fails the build and every component test reads "did not run" — a dark suite,
// not a red one (#4462: play-card.spec.tsx outlived PlayCard). `test:e2e:ct` needs a browser and
// runs in no workflow, so this cheap static check is the net: every relative import in a ct spec
// must resolve to a file on disk.
const CT_DIR = join(process.cwd(), "e2e/ct");
const EXTENSIONS = ["", ".ts", ".tsx", ".js", "/index.ts", "/index.tsx"];
const IMPORT = /^\s*import\s[^;]*?from\s+["'](\.[^"']+)["']/gm;

function unresolvedImports(file: string): string[] {
  const source = readFileSync(file, "utf8");
  return [...source.matchAll(IMPORT)]
    .map((m) => m[1])
    .filter((spec) => !EXTENSIONS.some((ext) => existsSync(resolve(dirname(file), spec + ext))));
}

describe("component-test specs", () => {
  it("import only modules that exist", () => {
    const specs = readdirSync(CT_DIR).filter((f) => f.endsWith(".spec.tsx"));
    expect(specs.length).toBeGreaterThan(0);
    const dead = specs.flatMap((f) =>
      unresolvedImports(join(CT_DIR, f)).map((spec) => `${f} → ${spec}`),
    );
    expect(dead).toEqual([]);
  });
});
