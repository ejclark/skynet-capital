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
//
// The ORDER GUARD (e2e/order-journey.spec.ts, #8188) is a second faculty boot on 8810 + bridge
// 8811 (8797/8798 are the phone crawl's, 8800 the faculty drive's), pinned to FIXED_CLOCK: a
// market order fills only inside a session, CI runs at any hour, and the `changes` boot keeps the
// wall clock on purpose (scenarios never name a date). Its own account also keeps the guard's cash
// and position deltas clear of changes.spec.ts's cancels and replaces.

export const FACULTY_PORTS = { port: 8794, bridgePort: 8795 } as const;
export const ORDERS_PORTS = { port: 8810, bridgePort: 8811 } as const;
/** The same guard with the exit-at-entry setting on (#8249): `orders-exit`, 8812 + bridge 8813. */
export const ORDERS_EXIT_PORTS = { port: 8812, bridgePort: 8813 } as const;

type Project = NonNullable<PlaywrightTestConfig["projects"]>[number];
type WebServer = Extract<NonNullable<PlaywrightTestConfig["webServer"]>, { command: string }>;

/** One fixtures dir PER BOOT, made once per run. A shared dir meant a shared `data/` dir, and two
 *  servers writing `progression.json` through the same `.tmp` path raced: one rename found the
 *  other's file already moved, and a review answered 500 (#8249, seen once a third boot joined). */
function fixtures(name: string): string {
  const key = `SKYNET_FACULTY_FIXTURES_${name.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;
  const dir = process.env[key] ?? facultyFixturesDir();
  process.env[key] = dir;
  return dir;
}

/** One faculty boot as a project: its name, its spec, its ports, and an optional pinned clock. */
export interface FacultyBoot {
  readonly name: string;
  readonly spec: string;
  readonly port: number;
  readonly bridgePort: number;
  /** Pins the market and the broker (`SKYNET_FIXED_NOW`); absent, the boot runs on the wall clock. */
  readonly fixedNow?: Date;
  /** More boot env, e.g. `SKYNET_EXIT_AT_ENTRY` (read only on this offline writes boot, #8249). */
  readonly env?: Readonly<Record<string, string>>;
}

const CHANGES: FacultyBoot = { name: "changes", spec: "changes.spec.ts", ...FACULTY_PORTS };

export function facultyProject(boot: FacultyBoot = CHANGES): {
  project: Project;
  webServer: WebServer;
} {
  const { port, bridgePort } = boot;
  const origin = `http://localhost:${port}`;
  return {
    project: {
      name: boot.name,
      testMatch: [`**/${boot.spec}`],
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
        // Each boot its own fixtures (and data) dir; the paper account is in memory, per server.
        ...facultyBootEnv({ port, bridgePort, fixtures: fixtures(boot.name) }),
        SKYNET_RESEARCH_DIR: "e2e/fixtures/research",
        ...(boot.fixedNow ? { SKYNET_FIXED_NOW: boot.fixedNow.toISOString() } : {}),
        ...boot.env,
      },
    },
  };
}
