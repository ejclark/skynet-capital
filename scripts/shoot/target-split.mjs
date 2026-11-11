// Visual harness for Settings → Target split (#4607 slice 1) — from the REAL built shell (app/dist)
// over a stub API. A saved target (60 / 15 / 25, 5 points), then one slice edited so the three add
// to 90 and the form says how far short it is; the phone frame first (docs/PICTURES.md → Screenshots).
// Usage: npm run build --prefix app && node scripts/shoot/target-split.mjs [outdir]
import { openShell } from "./shell.mjs";

const { page, origin, shoot, close } = await openShell({
  name: "target-split",
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  stubs: {
    "/api/settings": {
      authConfigured: true,
      adminWired: true,
      fleetSuspended: false,
      timezones: [],
      accounts: [],
    },
    "/api/controls": { owner: false },
    "/api/guests": { guests: [] },
    "/api/target-split": {
      wired: true,
      target: {
        sharesPct: 60,
        optionsPct: 15,
        cashPct: 25,
        tolerancePct: 5,
        updatedAt: "2026-11-10T12:00:00.000Z",
      },
    },
  },
});

await page.goto(`${origin}/app/settings?section=target`);
await page.getByLabel("Cash").waitFor();
await page.getByLabel("Cash").fill("15");
await page.getByText("Adds to 90% — 10 short of 100%").waitFor();
await page.locator(".set-card").evaluate((el) => el.scrollIntoView({ block: "start" }));
await shoot("target-split-390");

await page.setViewportSize({ width: 1280, height: 900 });
await page.getByLabel("Cash").fill("25");
await page.getByText("Adds to 100% ✓").waitFor();
await shoot("target-split-desktop");

await close();
