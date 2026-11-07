import { defineConfig, devices } from "@playwright/test";
import { FIXED_CLOCK } from "./e2e/determinism";
import { journeysMode } from "./e2e/playwright.journeys";
import { SHARED_CONFIG } from "./e2e/playwright.shared";

// Visual/behavioral regression suite — a real Chromium clicking through the app, distinct from
// rstest's DOM-level specs under tests/**. Boots the offline dashboard server (fixture data, no
// network/keys) so CI never depends on live Alpaca credentials. See docs/ENGINEERING.md.
//
// Covers every route EXCEPT /login (playwright.auth.config.ts owns that one): booting with no
// OAuth env vars configured leaves the dashboard fully OPEN (dashboard-auth-gate never wires up
// a login requirement), which is what makes exhaustive route coverage tractable without a login
// flow standing in front of every spec.
//
// Plus the member playthroughs (#7031 slice 1): `journeys-open` and `journeys-session` run
// e2e/journeys.spec.ts against two more boots on their own ports (e2e/playwright.journeys.ts says
// why two), so CI's plain `npx playwright test` plays every step of every member's journeys. A
// step without `known_gap` that fails, or a `known_gap` step that passes, fails the run.
const open = journeysMode("open", { build: false });
const session = journeysMode("session", { build: false });

export default defineConfig({
  ...SHARED_CONFIG,
  testIgnore: ["**/login.spec.ts", "**/ct/**"],
  use: {
    ...SHARED_CONFIG.use,
    baseURL: "http://localhost:8787",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: ["**/login.spec.ts", "**/ct/**", "**/journeys.spec.ts"],
    },
    open.project,
    session.project,
  ],
  // Launched one after another, in this order: the first boot builds the React shell (app/dist)
  // and the two playthrough boots, which skip the build, serve the same app/dist.
  webServer: [
    {
      // Builds the React shell (app/dist) so /app/ resolves, then boots the offline dashboard fully
      // open (no OAuth env vars) so every real route is reachable with no auth flow.
      command:
        "npm run build --prefix app && SKYNET_RESEARCH_DIR=e2e/fixtures/research npm run serve:dashboard:offline",
      url: "http://localhost:8787",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      // The browser clock is pinned per page (`freezePage`); this pins the server's for the reads
      // that compute a date themselves, such as the Council's week label (#4683).
      env: { SKYNET_FIXED_NOW: FIXED_CLOCK.toISOString() },
    },
    open.webServer,
    session.webServer,
  ],
});
