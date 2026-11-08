// Boot the offline dashboard for one crawl mode and hand back its origin. Two modes, because the
// server picks ONE auth mode per boot (playwright.auth.config.ts): `open` (no auth env — every
// viewer is anonymous and owns nothing) and `session` (OAuth with fake credentials, the crawl's
// owner-links fixture mapping crawl@example.test → human-eric, and a minted `skynet_session`
// cookie standing in for a real sign-in). Two boots can run at once only on different dashboard
// AND insights-bridge ports — the Playwright playthrough projects do (e2e/playwright.journeys.ts);
// the crawl boots them one after the other on the same pair.
//
// Two tiers sign in to a session boot, as in production: `crawl@example.test` is the OWNER
// (`SKYNET_ALLOWED_EMAILS`) and `friend@example.test` is an invited MEMBER, listed only in the
// frozen dir's guest-list store (`SKYNET_ALLOWLIST_STORE`, frozen-fixtures.mjs) — so the friend's
// journeys see a member's view, never the owner's, and the owner tier stays one email wide.
//
// `offlineBootEnv` is the one statement of what a safe journey boot is; the crawl's `bootServer`
// and the Playwright web servers both spread it, so a guard added here reaches both.
//
// The child is its own process group so `close()` takes tsx AND the node it forks; `SIGTERM` on
// the group is what an interrupted crawl leaves behind: nothing.

import { spawn } from "node:child_process";
import { join, resolve } from "node:path";
import { allowlistPath, frozenFixturesDir } from "./frozen-fixtures.mjs";

export const CRAWL_EMAIL = "crawl@example.test";
export const CRAWL_SECRET = "e2e-dev-secret";

/**
 * The env each mode adds on top of the offline base. Never a feedback token: a filing would open a
 * real issue. `fixturesDir` is the frozen dir the boot serves; its guest list is the member tier.
 */
export function envFor(mode, fixturesDir) {
  if (mode !== "session") return {};
  return {
    SKYNET_SESSION_SECRET: CRAWL_SECRET,
    SKYNET_GOOGLE_CLIENT_ID: "e2e-fake-client",
    SKYNET_GOOGLE_CLIENT_SECRET: "e2e-fake-secret",
    SKYNET_GITHUB_CLIENT_ID: "e2e-fake-client",
    SKYNET_GITHUB_CLIENT_SECRET: "e2e-fake-secret",
    SKYNET_ALLOWED_EMAILS: CRAWL_EMAIL,
    SKYNET_ALLOWLIST_STORE: allowlistPath(fixturesDir),
    SKYNET_OWNER_LINKS_FILE: "scripts/crawl/fixtures/owner-links.json",
  };
}

/**
 * Every store the server falls back to `data/` for when its env var is unset (`env.X ?? "data/…"`
 * across src/; tests/scripts/crawl-boot-env.spec.ts fails when a new one is missing here). A
 * journey boot points each one into its own frozen dir, so it starts from the empty state a fresh
 * CI checkout has, and two boots running at once never read or write each other's files.
 */
export const DATA_STORE_ENV = {
  SKYNET_ACTIVITY_DIR: "activity",
  SKYNET_ALERT_DELIVERY_DIR: "alert-delivery",
  SKYNET_ALERT_DISMISSALS_DIR: "alert-dismissals",
  SKYNET_ALLOWLIST_STORE: "allowlist.json",
  SKYNET_COMMUNITY_PROGRESSION_FILE: "community-progression.json",
  SKYNET_COMPANION_MESSAGE_LOG_DIR: "companion-message-log",
  SKYNET_CONTROLS_FILE: "bot-controls.json",
  SKYNET_FEEDBACK_LOG_DIR: "feedback-log",
  SKYNET_GITHUB_TOKEN_STORE: "github-token.json",
  SKYNET_HISTORY_DIR: "history",
  SKYNET_INSIGHTS_DIR: "insights",
  SKYNET_LADDER_PROGRESS_DIR: "ladder-progress",
  SKYNET_ORDER_AUDIT_DIR: "order-audit",
  SKYNET_OWNER_LINKS_FILE: "owner-links.json",
  SKYNET_PARTICIPANT_STORE: "participants.json",
  SKYNET_PROGRESSION_FILE: "progression.json",
  SKYNET_SAVED_POSITIONS_FILE: "saved-positions.json",
  SKYNET_SUBSCRIPTIONS_FILE: "playbook-subscriptions.json",
  SKYNET_WATCHLIST_DIR: "watchlist",
};

/**
 * The env one journey boot adds on top of the caller's: offline data from the frozen dir `fixtures`,
 * its own dashboard and insights-bridge ports, its own empty data dir, and the auth `mode`.
 * Never a feedback token: a filing would open a real issue, and a token saved from Settings would
 * re-arm filing at boot, so the token store points at a file that does not exist.
 *
 * @param {{mode: "open"|"session", port: number, bridgePort: number, fixtures: string}} opts
 * @returns {Record<string, string>}
 */
export function offlineBootEnv({ mode, port, bridgePort, fixtures }) {
  const data = join(fixtures, "data");
  const stores = Object.fromEntries(
    Object.entries(DATA_STORE_ENV).map(([key, name]) => [key, join(data, name)]),
  );
  return {
    SKYNET_DATA_SOURCE: "offline",
    SKYNET_OFFLINE_FIXTURES: fixtures,
    // resolve-port.ts reads PORT before SKYNET_DASHBOARD_PORT; pin both so an inherited PORT can
    // never move a boot off its port.
    PORT: String(port),
    SKYNET_DASHBOARD_PORT: String(port),
    SKYNET_INSIGHTS_BRIDGE_PORT: String(bridgePort),
    ...stores,
    SKYNET_FEEDBACK_GITHUB_TOKEN: "",
    SKYNET_GITHUB_TOKEN_STORE: join(fixtures, "no-github-token.json"),
    ...envFor(mode, fixtures),
  };
}

/**
 * @param {{mode: "open"|"session", port: number, bridgePort: number, timeoutMs?: number}} opts
 * @returns {Promise<{origin: string, close: () => Promise<void>}>}
 */
export function bootServer({ mode, port, bridgePort, timeoutMs = 90_000 }) {
  const env = {
    ...process.env,
    ...offlineBootEnv({ mode, port, bridgePort, fixtures: frozenFixturesDir() }),
  };
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
