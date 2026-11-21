import type { PlaywrightTestConfig } from "@playwright/test";
import { devices } from "@playwright/test";
import { facultyBootEnv, facultyFixturesDir } from "../scripts/faculty/world.mjs";

// The CHANGE playthroughs (e2e/changes.spec.ts) as a Playwright project with its own server: the
// faculty world (scripts/faculty/world.mjs) — the session boot with SKYNET_OFFLINE_WRITES=apply,
// so an order the spec submits through the form is an order the account reads back. Until this
// project, no test at any level pressed Submit and checked the order landed (the change-scenarios
// coverage census, 2026-11-16): the main suite boots OPEN, where the server refuses every trade,
// and offline writes were no-ops.
//
// Its own ports (8794 + bridge 8795), clear of the main suite (8787/8788) and the two journey boots
// (8790–8793), so every project runs at once. Made once per run, like the journeys' frozen dir:
// Playwright re-imports the config in every worker, and a worker reads the runner's path.

export const FACULTY_PORTS = { port: 8794, bridgePort: 8795 } as const;

type Project = NonNullable<PlaywrightTestConfig["projects"]>[number];
type WebServer = Extract<NonNullable<PlaywrightTestConfig["webServer"]>, { command: string }>;

function fixtures(): string {
  const key = "SKYNET_FACULTY_FIXTURES";
  const dir = process.env[key] ?? facultyFixturesDir();
  process.env[key] = dir;
  return dir;
}

export function facultyProject(): { project: Project; webServer: WebServer } {
  const { port, bridgePort } = FACULTY_PORTS;
  const origin = `http://localhost:${port}`;
  return {
    project: {
      name: "changes",
      testMatch: ["**/changes.spec.ts"],
      // One server, one account: the specs change it in order, so they never run side by side.
      fullyParallel: false,
      use: { ...devices["Desktop Chrome"], baseURL: origin },
    },
    webServer: {
      command: "npm run serve:dashboard:offline",
      url: origin,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        ...facultyBootEnv({ port, bridgePort, fixtures: fixtures() }),
        SKYNET_RESEARCH_DIR: "e2e/fixtures/research",
      },
    },
  };
}
