import { defineConfig } from "@playwright/test";
import { SHARED_CONFIG } from "./e2e/playwright.shared";
import { frozenFixturesDir } from "./scripts/crawl/frozen-fixtures.mjs";
import { envFor } from "./scripts/crawl/server.mjs";
import { resolveChromium } from "./scripts/shoot/lib.mjs";

// The cloud image's PLAYWRIGHT_BROWSERS_PATH has held a revision behind the pin more than once
// (scripts/shoot/lib.mjs says so); the shoot scripts' resolver finds a Chromium that exists, and
// returns undefined where none of its candidates do (CI), so Playwright resolves its own there.
const executablePath = resolveChromium();

// The member journeys (e2e/journeys/*.journey.json → e2e/journeys.spec.ts), one boot per auth
// mode — the server picks ONE mode per boot (playwright.auth.config.ts says why), so this config
// runs in whichever mode `JOURNEYS_MODE` names and the spec leaves out the fixtures the boot cannot serve:
//
//   npx playwright test -c playwright.journeys.config.ts                       # session (default)
//   JOURNEYS_MODE=open npx playwright test -c playwright.journeys.config.ts    # anonymous
//
// `session` boots OAuth with the crawl's fake credentials and its owner-links fixture
// (crawl@example.test → human-eric); the spec mints the `skynet_session` cookie itself
// (scripts/crawl/mint-session.ts) — no login round trip. Both modes serve a FROZEN copy of the
// offline fixtures (scripts/crawl/frozen-fixtures.mjs): the roster as committed, no fill replay,
// so a position a journey expects is there on every step, not only until the replay closes it.
// Run the two modes one after the other, never at once — and never with a stale server on 8787
// in the other mode (`reuseExistingServer` would happily use it).
process.env.JOURNEYS_MODE = process.env.JOURNEYS_MODE === "open" ? "open" : "session";

export default defineConfig({
  ...SHARED_CONFIG,
  testMatch: ["**/journeys.spec.ts"],
  use: {
    ...SHARED_CONFIG.use,
    baseURL: "http://localhost:8787",
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  webServer: {
    command: "npm run build --prefix app && npm run serve:dashboard:offline",
    url: "http://localhost:8787",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      SKYNET_OFFLINE_FIXTURES: frozenFixturesDir(),
      ...envFor(process.env.JOURNEYS_MODE),
    },
  },
});
