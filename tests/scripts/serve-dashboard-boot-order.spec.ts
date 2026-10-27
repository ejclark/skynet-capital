import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { RUN_MARKER_FILE } from "../../src/server/run-marker.js";

// Boot order (#6292): every check that refuses a boot runs before `bootTelemetry` claims the run
// marker. A marker left by a refused boot reads as an unclean exit on the next one, which files a
// phantom "Dashboard restarted without a clean shutdown" incident. So this boots the real script
// and asserts the refusal leaves the volume as it found it.
describe("a refused dashboard boot", () => {
  const made: string[] = [];
  afterAll(() => {
    for (const dir of made) rmSync(dir, { recursive: true, force: true });
  });

  const boot = (env: Record<string, string>) => {
    const root = mkdtempSync(join(tmpdir(), "boot-order-"));
    made.push(root);
    // A clean env, not the runner's: an inherited secret or FLY_APP_NAME would change the verdict.
    const out = spawnSync("npx", ["tsx", "src/scripts/serve-dashboard.ts"], {
      encoding: "utf8",
      timeout: 60_000,
      env: {
        PATH: process.env.PATH ?? "",
        HOME: process.env.HOME ?? "",
        SKYNET_DATA_SOURCE: "offline",
        SKYNET_HISTORY_DIR: join(root, "history"),
        ...env,
      },
    });
    return { ...out, marker: existsSync(join(root, RUN_MARKER_FILE)) };
  };

  it("on a SKYNET_PUBLIC_URL that is not a URL exits 1 and claims no run marker", () => {
    const out = boot({ SKYNET_PUBLIC_URL: "skynet.example.com" });
    expect(out.stderr).toMatch(/SKYNET_PUBLIC_URL "skynet.example.com" is not a URL/);
    expect(out.status).toBe(1);
    expect(out.marker).toBe(false);
  }, 60_000);

  it("on a production boot with no sign-in exits 1 and claims no run marker", () => {
    const out = boot({ NODE_ENV: "production" });
    expect(out.stderr).toMatch(/Refusing to boot/);
    expect(out.status).toBe(1);
    expect(out.marker).toBe(false);
  }, 60_000);
});
