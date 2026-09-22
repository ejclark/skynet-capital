import { defineConfig } from "@playwright/test";
import { SHARED_CONFIG } from "./e2e/playwright.shared";

// Visual/behavioral regression suite — a real Chromium clicking through the app, distinct from
// rstest's DOM-level specs under tests/**. Boots the offline dashboard server (fixture data, no
// network/keys) so CI never depends on live Alpaca credentials. See docs/ENGINEERING.md.
//
// Covers every route EXCEPT /login (playwright.auth.config.ts owns that one): booting with no
// OAuth env vars configured leaves the dashboard fully OPEN (dashboard-auth-gate never wires up
// a login requirement), which is what makes exhaustive route coverage tractable without a login
// flow standing in front of every spec.
export default defineConfig({
  ...SHARED_CONFIG,
  testIgnore: ["**/login.spec.ts", "**/ct/**"],
  use: {
    ...SHARED_CONFIG.use,
    baseURL: "http://localhost:8787",
  },
  webServer: {
    // Builds the React shell (app/dist) so /app/ resolves, then boots the offline dashboard fully
    // open (no OAuth env vars) so every real route is reachable with no auth flow.
    command: "npm run build --prefix app && npm run serve:dashboard:offline",
    url: "http://localhost:8787",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
