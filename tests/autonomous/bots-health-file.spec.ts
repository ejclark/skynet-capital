import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  type BotsHealth,
  openBotsHealthFile,
  resolveBotsHealthFile,
} from "../../src/autonomous/bots-health-file.js";

// Confirmed live 2026-09-04: the smoke's `flyctl logs -n` grep for "bridge armed" lagged a healthy
// boot into a rollback. The stamp is the process's own word, readable the instant it's written.
describe("bots health file", () => {
  let dir: string;
  let path: string;
  const clock = (iso: string) => () => new Date(iso);
  const read = (): BotsHealth => JSON.parse(readFileSync(path, "utf8"));

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "bots-health-"));
    path = join(dir, "nested", "health.json");
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("is dark when SKYNET_BOTS_HEALTH_PATH is unset", () => {
    const health = resolveBotsHealthFile({} as NodeJS.ProcessEnv);
    health.controlsFetched();
    health.boot(true);
    expect(existsSync(path)).toBe(false);
    expect(health.path).toBeUndefined();
  });

  it("stamps the deployed commit and 'armed' when the boot fetch landed before boot()", () => {
    const health = openBotsHealthFile(path, "abc123", clock("2026-09-04T19:37:00Z"));
    health.controlsFetched(); // bootMissionControl's fetchOnce fires onFetched first
    expect(existsSync(path)).toBe(false); // nothing written until the boot verdict is in
    health.boot(true);
    expect(read()).toEqual({
      gitSha: "abc123",
      pid: process.pid,
      bootedAt: "2026-09-04T19:37:00.000Z",
      bridge: "armed",
      lastControlsPollAt: "2026-09-04T19:37:00.000Z",
      updatedAt: "2026-09-04T19:37:00.000Z",
    });
  });

  it("stamps 'unreachable' when the bridge is configured but the boot fetch failed", () => {
    openBotsHealthFile(path, "abc123").boot(true);
    expect(read().bridge).toBe("unreachable");
    expect(read().lastControlsPollAt).toBeNull();
  });

  it("stamps 'unset' when no bridge is configured, and a null sha on a rollback", () => {
    openBotsHealthFile(path, null).boot(false);
    expect(read()).toMatchObject({ bridge: "unset", gitSha: null });
  });

  it("re-stamps on every later poll so the file doubles as a liveness signal", () => {
    let nowIso = "2026-09-04T19:37:00Z";
    const health = openBotsHealthFile(path, "abc123", () => new Date(nowIso));
    health.boot(true);
    expect(read().bridge).toBe("unreachable");
    nowIso = "2026-09-04T19:37:30Z";
    health.controlsFetched();
    expect(read()).toMatchObject({
      bridge: "armed",
      lastControlsPollAt: "2026-09-04T19:37:30.000Z",
      bootedAt: "2026-09-04T19:37:00.000Z",
    });
  });

  it("resolves GIT_SHA from the env the deploy stamped", () => {
    resolveBotsHealthFile({
      SKYNET_BOTS_HEALTH_PATH: path,
      GIT_SHA: "deadbeef",
    } as NodeJS.ProcessEnv).boot(false);
    expect(read().gitSha).toBe("deadbeef");
  });
});
