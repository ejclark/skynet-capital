import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { describe, expect, it } from "@rstest/core";
import { SCENE_CACHE, sceneBuildArgs } from "../../../scripts/study/scene-bundle.mjs";

/**
 * A shoot's 3D scene stays out of the app's public tree (#5227): built into `public/three/`, the
 * local e2e server served it too and a layout spec timed out where CI, which never builds it, was
 * green. The cache must stay outside `public/`, and its build must be `npm run build:scene`'s own.
 */
describe("the shoot's scene bundle", () => {
  it("builds outside the tree the dashboard serves", () => {
    const where = relative(process.cwd(), SCENE_CACHE);
    expect(where.startsWith("public")).toBe(false);
    expect(where.startsWith("node_modules")).toBe(true);
  });

  it("builds exactly as npm run build:scene does, but to its own file", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
    };
    const script = pkg.scripts["build:scene"] ?? "";
    const theirs = script.replace(/^esbuild /, "").replace(/ --outfile=\S+$/, "");
    const ours = sceneBuildArgs("X")
      .filter((a) => !a.startsWith("--outfile="))
      .join(" ");
    expect(ours).toBe(theirs);
    expect(sceneBuildArgs("X")).toContain("--outfile=X");
  });
});
