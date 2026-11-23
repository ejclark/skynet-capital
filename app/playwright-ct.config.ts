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
      // No executablePath, ever: the baselines in e2e/ct/__snapshots__ are shot with the
      // headless_shell Playwright pins, and any other Chromium build moves font metrics by a pixel,
      // which fails every shot at CT_DIFF_RATIO 0.001. The cloud sandbox ships its own Chromium
      // (rev 1243 against 1.62.1's 1234 on 2026-11-23), and handing it over through the shared
      // resolveChromium() ran 16 of 17 specs red there and would have re-shot every baseline on
      // the wrong build under :update (#7726). Where the pinned build is missing, Playwright stops
      // with its own install instructions, which is the honest answer. The resolver's other
      // callers (the shoot scripts, the e2e and journeys configs) are untouched by this fix. A
      // hard-coded /opt path before that left the suite runnable only inside the sandbox (#5638).
      use: devices["Desktop Chrome"],
    },
  ],
});
