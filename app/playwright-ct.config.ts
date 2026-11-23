import { defineConfig, devices } from "@playwright/experimental-ct-react";
import { resolveChromium } from "../scripts/shoot/lib.mjs";

// Component-level visual coverage — mounts a single app/src/shell/*.tsx component in isolation
// with fixed mock props, no server, no data source, no live tick. This is the ONLY sound way to
// get pixel coverage on anything whose route-level render depends on offlineDataSource's ticking
// simulation (docs/ENGINEERING.md → "Visual regression"; #3325/#3330 found /leaderboard's dollar
// figures drift between runs even under a frozen browser clock, because the tick is server-side).
// A pure props-in/JSX-out component sidesteps that class of problem entirely.
const executablePath = resolveChromium();

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
    // Motion off, the same pin the route suite takes in `e2e/determinism.ts` (`freezePage`). The
    // house tokens zero under reduced motion (`styles/theme.css`), so a mounted component renders
    // straight at its settled frame. Without it every mount starts an entrance animation (the
    // unlock banner's `fold-open`: translateY(-4px) → none), and Chromium runs transform/opacity
    // on the compositor: Playwright's `animations: "disabled"` finishes it on the main thread, but
    // a loaded runner could still capture a layer a subpixel off. That moved the whole top-rung
    // banner in about one run in four (#8066). A ct shot covers settled layout, never motion.
    contextOptions: { reducedMotion: "reduce" },
  },
  projects: [
    {
      name: "chromium",
      // The cloud sandbox pre-installs one Chromium that can trail the headless_shell Playwright
      // pins; the shared resolver finds it there and returns undefined on a runner that has none
      // (GitHub Actions after `npx playwright install chromium`), so Playwright resolves its own.
      // A hard-coded /opt path left the suite runnable only inside the sandbox (#5638).
      use: {
        ...devices["Desktop Chrome"],
        ...(executablePath ? { launchOptions: { executablePath } } : {}),
      },
    },
  ],
});
