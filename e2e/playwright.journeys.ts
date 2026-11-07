import type { PlaywrightTestConfig } from "@playwright/test";
import { devices } from "@playwright/test";
import { frozenFixturesDir } from "../scripts/crawl/frozen-fixtures.mjs";
import { offlineBootEnv } from "../scripts/crawl/server.mjs";

// The member playthroughs (e2e/journeys/*.journey.json → e2e/journeys.spec.ts) as Playwright
// projects, one per auth mode, each with its OWN server — so the default `npx playwright test`,
// the command CI's integration-tests job already runs, plays every step before a PR merges
// (#7031 slice 1). Workflow files are the protected class; this config is not, so wiring the
// playthroughs into CI is a change here, not a platter item.
//
// Why two servers: the dashboard picks ONE auth mode per boot (playwright.auth.config.ts says why).
// `open` boots with no auth env, so every viewer is anonymous; `session` boots OAuth with the
// crawl's fake credentials and owner-links fixture, and the spec mints the `skynet_session` cookie
// itself (scripts/crawl/mint-session.ts). Each boot gets its own dashboard port AND its own
// insights-bridge port (the bridge defaults to 8788, which the main suite's 8787 boot already
// holds — src/server/insights-listener.ts), so both modes and the main suite run at once.
//
// Each project collects only its own members: the spec tags each journey `@journeys-<mode>` from
// the member's fixture kind, and the project greps for its tag — a member the boot cannot serve is
// never collected, so there are no skipped tests standing in for the other mode's run.
//
// Both boots serve a FROZEN copy of the offline fixtures (scripts/crawl/frozen-fixtures.mjs): the
// roster as committed, no fill replay, so a position a step expects is there on every step. Each
// boot's env is `offlineBootEnv` (scripts/crawl/server.mjs), the same the crawl boots with: its own
// ports, its own empty data dir (never the repo's `data/`, which the main suite's boot writes to),
// and no feedback token.

export type JourneysMode = "open" | "session";

/** Dashboard + insights-bridge ports per mode; clear of the main suite's 8787 + 8788. */
export const JOURNEY_PORTS: Record<JourneysMode, { port: number; bridgePort: number }> = {
  open: { port: 8790, bridgePort: 8791 },
  session: { port: 8792, bridgePort: 8793 },
};

/** The tag a member's journeys carry, from their fixture kind; the project greps for it. */
export function journeysTag(mode: JourneysMode): string {
  return `@journeys-${mode}`;
}

type Project = NonNullable<PlaywrightTestConfig["projects"]>[number];
type WebServer = Extract<NonNullable<PlaywrightTestConfig["webServer"]>, { command: string }>;

/**
 * One frozen dir per boot: the roster copy (plus the invited friend), the guest list `envFor` points
 * the session boot at (the friend signs in as a member, never as an owner) and the boot's own empty
 * data dir. Made once per run: Playwright re-imports the config in every worker, and a worker
 * inherits the runner's env, so it reads the runner's path instead of copying the roster again.
 */
function fixturesFor(mode: JourneysMode): string {
  const key = `SKYNET_JOURNEYS_FIXTURES_${mode.toUpperCase()}`;
  const dir = process.env[key] ?? frozenFixturesDir();
  process.env[key] = dir;
  return dir;
}

/**
 * One project + one web server per mode. `build` says whether this mode's boot builds the React
 * shell first: Playwright launches web servers one after another, in array order, so only the
 * first boot in a config needs to build (a second `npm run build` would rewrite app/dist under a
 * server that is already serving it).
 */
export function journeysMode(
  mode: JourneysMode,
  { build, use = {} }: { build: boolean; use?: Project["use"] },
): { project: Project; webServer: WebServer } {
  const { port, bridgePort } = JOURNEY_PORTS[mode];
  const origin = `http://localhost:${port}`;
  const fixtures = fixturesFor(mode);
  const serve = "npm run serve:dashboard:offline";
  return {
    project: {
      name: `journeys-${mode}`,
      testMatch: ["**/journeys.spec.ts"],
      grep: new RegExp(journeysTag(mode)),
      use: { ...devices["Desktop Chrome"], ...use, baseURL: origin },
    },
    webServer: {
      command: build ? `npm run build --prefix app && ${serve}` : serve,
      url: origin,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: offlineBootEnv({ mode, port, bridgePort, fixtures }),
    },
  };
}
