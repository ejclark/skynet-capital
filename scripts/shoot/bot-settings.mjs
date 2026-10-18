// Visual harness for a bot's own settings (#4535 slice 3b) — from the REAL built shell (app/dist)
// over a stub API. One bot the owner holds, the forced pick's host with a hardcore build, so both
// controls and the change log draw; the phone frame first (docs/PICTURES.md → Screenshots).
// Usage: npm run build --prefix app && node scripts/shoot/bot-settings.mjs [outdir]
import { openShell } from "./shell.mjs";

const settings = {
  authConfigured: true,
  adminWired: true,
  fleetSuspended: false,
  timezones: [{ value: "America/New_York", label: "Eastern" }],
  accounts: [
    {
      id: "sauron",
      name: "Sauron",
      kind: "bot",
      hostConfigured: true,
      profile: null,
      suspended: false,
      settings: {
        hardcore: true,
        betaPicks: 2,
        maxBetaPicks: 10,
        changes: [
          {
            at: "2026-10-18T20:31:00.000Z",
            setting: "hardcore",
            before: null,
            after: true,
            proposedBy: "you",
            approvedBy: "you",
          },
          {
            at: "2026-10-18T20:30:00.000Z",
            setting: "betaPicks",
            before: null,
            after: 2,
            proposedBy: "you",
            approvedBy: "you",
          },
          {
            at: "2026-10-17T14:02:00.000Z",
            setting: "suspended",
            before: true,
            after: false,
            proposedBy: "you",
            approvedBy: "you",
          },
        ],
      },
    },
  ],
};

const { page, origin, shoot, close } = await openShell({
  name: "bot-settings",
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  stubs: {
    "/api/settings": settings,
    "/api/controls": { owner: false },
    "/api/guests": { guests: [] },
  },
});

await page.goto(`${origin}/app/settings?section=account`);
await page.getByLabel("Forced picks per day").waitFor();
await page.locator(".bot-settings").evaluate((el) => el.scrollIntoView({ block: "start" }));
await shoot("bot-settings-390");

await page.setViewportSize({ width: 1280, height: 900 });
await page.locator(".bot-settings").scrollIntoViewIfNeeded();
await shoot("bot-settings-desktop");

await close();
