import { defineConfig } from "@playwright/test";
import { SHARED_CONFIG } from "./e2e/playwright.shared";

// The one suite that needs OAuth "on": the real /login route is only wired up by
// dashboard-auth-gate when a provider is configured (src/server/auth/resolve-auth.ts), so this
// config boots the dashboard with fake, non-secret OAuth credentials — the same pattern
// scripts/shoot/login.mjs already uses. Every other route is easier to test the OPPOSITE way (see
// playwright.config.ts) — the two configs can't merge into one because the server only picks one
// auth mode per boot, and running both boots at once collides on the internal 8788 insights-bridge
// port (src/scripts/dashboard-insights-bridge.ts hardcodes it). Run sequentially, not concurrently.
export default defineConfig({
  ...SHARED_CONFIG,
  testMatch: ["**/login.spec.ts"],
  use: {
    ...SHARED_CONFIG.use,
    baseURL: "http://localhost:8787",
  },
  webServer: {
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
