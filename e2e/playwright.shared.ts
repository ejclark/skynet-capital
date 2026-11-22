import type { PlaywrightTestConfig } from "@playwright/test";
import { devices } from "@playwright/test";
import { resolveChromium } from "../scripts/shoot/lib.mjs";

// Settings shared by playwright.config.ts (the open, no-auth app suite) and
// playwright.auth.config.ts (the OAuth-configured /login suite) — the two can't run as one config
// because the dashboard server only picks one auth mode per boot (docs/ENGINEERING.md → "Visual
// regression"; see each config file's own header comment for why the split exists at all).
// The cloud image's PLAYWRIGHT_BROWSERS_PATH has held a revision behind the pin more than once, so
// a bare launch fails with "Executable doesn't exist at …chromium_headless_shell-<pin>" — every
// cloud session that ran this suite locally needed a scratch config (the change study, 2026-11-17).
// The shoot scripts' resolver (scripts/shoot/lib.mjs, the one copy of the fallback list) finds a
// Chromium that exists and returns undefined where none of its candidates do — CI and a laptop —
// so Playwright resolves its own browser there, exactly as playwright.journeys.config.ts does.
const executablePath = resolveChromium();

export const SHARED_CONFIG: PlaywrightTestConfig = {
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["html", { open: "never" }], ["github"]] : "list",
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
};
