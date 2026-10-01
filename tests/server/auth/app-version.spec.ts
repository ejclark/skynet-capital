import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { APP_VERSION } from "../../../src/server/auth/app-version.js";

const packageVersion = (
  JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as { version: string }
).version;

describe("APP_VERSION", () => {
  describe("under the production runtime (an esbuild bundle run by plain node)", () => {
    it("is the semver-ish version semantic-release maintains in package.json", () => {
      // Bundle the module the way `npm run build:server` bundles the server — to a file that
      // lives somewhere else entirely — so a source-relative lookup would miss package.json.
      const dir = mkdtempSync(join(process.cwd(), "dist-spec-"));
      try {
        const out = join(dir, "nested", "app-version.mjs");
        const build = spawnSync(
          join(process.cwd(), "node_modules/.bin/esbuild"),
          [
            "src/server/auth/app-version.ts",
            "--bundle",
            "--platform=node",
            "--format=esm",
            `--outfile=${out}`,
          ],
          { encoding: "utf8" },
        );
        expect(build.status).toBe(0);
        const probe = spawnSync(
          process.execPath,
          [
            "-e",
            `import(${JSON.stringify(pathToFileURL(out).href)}).then((m) => console.log(m.APP_VERSION))`,
          ],
          { encoding: "utf8" },
        );
        expect(probe.status).toBe(0);
        const version = probe.stdout.trim();
        expect(version).toMatch(/^\d+\.\d+\.\d+/);
        expect(version).toBe(packageVersion);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });
  });

  describe("in the test runtime (repo root as cwd)", () => {
    it("reads the same version — cwd resolution needs no bundler cooperation", () => {
      expect(APP_VERSION).toBe(packageVersion);
    });
  });
});
