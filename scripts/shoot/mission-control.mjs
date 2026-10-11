// Visual harness for the owner's Mission Control switchboard — from the REAL built shell
// (app/dist) over a stub API. One frame: the fleet rows plus the new "Moneypenny's model" dial
// (#1672 slice 4), Sonnet selected as the delivered default — then the same rows at 390, where the
// Suspend button once drew over the bot's name (#5172).
// Usage: npm run build --prefix app && npm run shoot:mission-control [outdir]
import { openShell } from "./shell.mjs";

const settings = {
  authConfigured: true,
  adminWired: true,
  fleetSuspended: false,
  timezones: [{ value: "America/New_York", label: "Eastern" }],
  accounts: [
    {
      id: "human-eric",
      name: "eric",
      kind: "human",
      hostConfigured: true,
      profile: { displayName: "Eric", timezone: "America/New_York" },
    },
  ],
};

const controls = {
  owner: true,
  fleet: {
    allSuspended: false,
    bots: [
      { id: "sauron", displayName: "Sauron", suspended: false },
      { id: "banker", displayName: "The Banker", suspended: true },
    ],
    companionModel: "claude-sonnet-5-5",
    companionModels: ["claude-haiku-4-5", "claude-sonnet-5-5"],
    updatedAt: "2026-09-06T12:00:00.000Z",
    updatedBy: "eric@example.com",
  },
};

const { page, origin, shoot, close } = await openShell({
  name: "mission-control",
  viewport: { width: 1280, height: 900 },
  stubs: {
    "/api/settings": settings,
    "/api/controls": controls,
    "/api/guests": { guests: [] },
  },
});

await page.goto(`${origin}/app/settings?section=account`);
await page.getByRole("heading", { name: "Moneypenny's model" }).waitFor();
await page.locator("#mission-control").scrollIntoViewIfNeeded();
await shoot("mission-control-companion-dial");

await page.setViewportSize({ width: 390, height: 844 });
await page.locator("#mission-control").scrollIntoViewIfNeeded();
await shoot("mission-control-390");

await close();
