// Boot the offline dashboard for one crawl mode and hand back its origin. Two modes, because the
// server picks ONE auth mode per boot (playwright.auth.config.ts): `open` (no auth env — every
// viewer is anonymous and owns nothing) and `session` (OAuth with fake credentials, the crawl's
// owner-links fixture mapping crawl@example.test → human-eric, and a minted `skynet_session`
// cookie standing in for a real sign-in). The crawl boots them sequentially, never at once — the
// two would collide on the port and on the insights bridge.
//
// The child is its own process group so `close()` takes tsx AND the node it forks; `SIGTERM` on
// the group is what an interrupted crawl leaves behind: nothing.

import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { frozenFixturesDir } from "./frozen-fixtures.mjs";

export const CRAWL_EMAIL = "crawl@example.test";
export const CRAWL_SECRET = "e2e-dev-secret";

/** The env each mode adds on top of the offline base. Never a feedback token: a filing would open a real issue. */
export function envFor(mode) {
  if (mode !== "session") return {};
  return {
    SKYNET_SESSION_SECRET: CRAWL_SECRET,
    SKYNET_GOOGLE_CLIENT_ID: "e2e-fake-client",
    SKYNET_GOOGLE_CLIENT_SECRET: "e2e-fake-secret",
    SKYNET_GITHUB_CLIENT_ID: "e2e-fake-client",
    SKYNET_GITHUB_CLIENT_SECRET: "e2e-fake-secret",
    SKYNET_ALLOWED_EMAILS: CRAWL_EMAIL,
    SKYNET_OWNER_LINKS_FILE: "scripts/crawl/fixtures/owner-links.json",
  };
}

/**
 * @param {{mode: "open"|"session", port: number, bridgePort: number, timeoutMs?: number}} opts
 * @returns {Promise<{origin: string, close: () => Promise<void>}>}
 */
export function bootServer({ mode, port, bridgePort, timeoutMs = 90_000 }) {
  const env = {
    ...process.env,
    SKYNET_DATA_SOURCE: "offline",
    SKYNET_OFFLINE_FIXTURES: frozenFixturesDir(),
    SKYNET_DASHBOARD_PORT: String(port),
    SKYNET_INSIGHTS_BRIDGE_PORT: String(bridgePort),
    ...envFor(mode),
  };
  delete env.SKYNET_FEEDBACK_GITHUB_TOKEN;
  delete env.PORT;
  const child = spawn(
    process.execPath,
    [resolve("node_modules/tsx/dist/cli.mjs"), "src/scripts/serve-dashboard.ts"],
    { env, detached: true, stdio: ["ignore", "pipe", "pipe"] },
  );
  const close = () =>
    new Promise((done) => {
      if (child.exitCode !== null) return done();
      child.once("exit", () => done());
      try {
        process.kill(-child.pid, "SIGTERM");
      } catch {
        child.kill("SIGTERM");
      }
      setTimeout(() => {
        try {
          process.kill(-child.pid, "SIGKILL");
        } catch {
          /* already gone */
        }
      }, 5000).unref();
    });
  return new Promise((ok, fail) => {
    let log = "";
    const timer = setTimeout(() => {
      void close().then(() => fail(new Error(`crawl: server (${mode}) did not come up:\n${log}`)));
    }, timeoutMs);
    const watch = (chunk) => {
      log += chunk;
      if (log.includes("Observatory live on port")) {
        clearTimeout(timer);
        ok({ origin: `http://127.0.0.1:${port}`, close });
      }
    };
    child.stdout.on("data", watch);
    child.stderr.on("data", watch);
    child.once("exit", (code) => {
      clearTimeout(timer);
      fail(new Error(`crawl: server (${mode}) exited ${code} before ready:\n${log}`));
    });
  });
}
