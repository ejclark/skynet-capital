import { defineConfig, devices } from "@playwright/experimental-ct-react";

// Component-level visual coverage — mounts a single app/src/shell/*.tsx component in isolation
// with fixed mock props, no server, no data source, no live tick. This is the ONLY sound way to
// get pixel coverage on anything whose route-level render depends on offlineDataSource's ticking
// simulation (docs/ENGINEERING.md → "Visual regression"; #3325/#3330 found /leaderboard's dollar
// figures drift between runs even under a frozen browser clock, because the tick is server-side).
// A pure props-in/JSX-out component sidesteps that class of problem entirely.
export default defineConfig({
  testDir: "../e2e/ct",
  snapshotDir: "../e2e/ct/__snapshots__",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["html", { open: "never" }], ["github"]] : "list",
  use: {
    trace: "on-first-retry",
    ctPort: 3100,
  },
  projects: [
    {
      name: "chromium",
      // Pinned browser path (see repo environment notes): the sandbox pre-installs one chromium
      // build, which can trail the version-specific headless_shell Playwright resolves by default.
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: { executablePath: "/opt/pw-browsers/chromium" },
      },
    },
  ],
});
