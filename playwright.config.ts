import { defineConfig, devices } from "@playwright/test";

// Visual/behavioral regression suite — a real Chromium clicking through the app, distinct from
// rstest's DOM-level specs under tests/**. Boots the offline dashboard server (fixture data, no
// network/keys) so CI never depends on live Alpaca credentials. See docs/ENGINEERING.md.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["html", { open: "never" }], ["github"]] : "list",
  use: {
    baseURL: "http://localhost:8787",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Builds the React shell (app/dist) so /app/ resolves, then boots the offline dashboard with
    // fake OAuth creds — same non-secret pattern scripts/shoot/login.mjs already uses — so the
    // real /login route (only wired up when a provider is configured) is reachable.
    command: "npm run build --prefix app && npm run serve:dashboard:offline",
    url: "http://localhost:8787",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      SKYNET_SESSION_SECRET: "e2e-dev-secret",
      SKYNET_GOOGLE_CLIENT_ID: "e2e-fake-client",
      SKYNET_GOOGLE_CLIENT_SECRET: "e2e-fake-secret",
      SKYNET_GITHUB_CLIENT_ID: "e2e-fake-client",
      SKYNET_GITHUB_CLIENT_SECRET: "e2e-fake-secret",
    },
  },
});
