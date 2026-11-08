import { defineConfig } from "@playwright/test";
import { type JourneysMode, journeysMode } from "./e2e/playwright.journeys";
import { SHARED_CONFIG } from "./e2e/playwright.shared";
import { resolveChromium } from "./scripts/shoot/lib.mjs";

// The member playthroughs alone (e2e/journeys/*.journey.json → e2e/journeys.spec.ts), without the
// rest of the suite. The default config runs the same two projects in CI (playwright.config.ts);
// this one is for a session iterating on a journey:
//
//   npx playwright test -c playwright.journeys.config.ts                         # both modes
//   JOURNEYS_MODE=open npx playwright test -c playwright.journeys.config.ts      # anonymous only
//   JOURNEYS_MODE=session npx playwright test -c playwright.journeys.config.ts   # signed-in only
//
// Each mode boots its own server on its own ports (e2e/playwright.journeys.ts), so the two run at
// once. `reuseExistingServer` would happily reuse a stale server on one of those ports, so stop a
// server left over from an older checkout before trusting a local run.

// The cloud image's PLAYWRIGHT_BROWSERS_PATH has held a revision behind the pin more than once
// (scripts/shoot/lib.mjs says so); the shoot scripts' resolver finds a Chromium that exists, and
// returns undefined where none of its candidates do (CI), so Playwright resolves its own there.
const executablePath = resolveChromium();
const use = executablePath ? { launchOptions: { executablePath } } : {};

const wanted = process.env.JOURNEYS_MODE;
const modes: JourneysMode[] =
  wanted === "open" || wanted === "session" ? [wanted] : ["open", "session"];
// The first boot builds the React shell; Playwright launches web servers in array order.
const boots = modes.map((mode, i) => journeysMode(mode, { build: i === 0, use }));

export default defineConfig({
  ...SHARED_CONFIG,
  projects: boots.map((b) => b.project),
  webServer: boots.map((b) => b.webServer),
});
