import type { PlaywrightTestConfig } from "@playwright/test";
import { devices } from "@playwright/test";

// Settings shared by playwright.config.ts (the open, no-auth app suite) and
// playwright.auth.config.ts (the OAuth-configured /login suite) — the two can't run as one config
// because the dashboard server only picks one auth mode per boot (docs/ENGINEERING.md → "Visual
// regression"; see each config file's own header comment for why the split exists at all).
export const SHARED_CONFIG: PlaywrightTestConfig = {
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["html", { open: "never" }], ["github"]] : "list",
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
};
