import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { APP_VERSION } from "../../../src/server/auth/app-version.js";

const packageVersion = (
  JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as { version: string }
).version;

describe("APP_VERSION", () => {
  describe("under the production runtime (tsx, real filesystem)", () => {
    it("is the semver-ish version semantic-release maintains in package.json", () => {
      // The test bundler virtualizes import.meta.url, so probe the module the way the
      // serve scripts actually run it: a plain tsx subprocess reading the real repo.
      const moduleUrl = pathToFileURL(join(process.cwd(), "src/server/auth/app-version.ts")).href;
      const probe = spawnSync(
        join(process.cwd(), "node_modules/.bin/tsx"),
        ["-e", `import(${JSON.stringify(moduleUrl)}).then((m) => console.log(m.APP_VERSION))`],
        { encoding: "utf8" },
      );
      expect(probe.status).toBe(0);
      const version = probe.stdout.trim();
      expect(version).toMatch(/^\d+\.\d+\.\d+/);
      expect(version).toBe(packageVersion);
    });
  });

  describe("wherever package.json cannot be read (defensive fallback)", () => {
    it("importing never throws — the version is the real semver or the safe empty string", () => {
      // In this bundled test environment the module's package.json lookup fails, which is
      // exactly the fallback path: a string always, garbage never.
      expect(typeof APP_VERSION).toBe("string");
      expect([packageVersion, ""]).toContain(APP_VERSION);
    });
  });
});
