// Pictures for #3807 slice 3b-1: Settings → Preferences' "Tower motion" (phone first, then
// desktop, then the device's reduced-motion lock). The `?card=art|league` compare it also shot is
// retired (#3977); the Profile page's tower column has its own pictures (`tower-column.mjs`).
// Same fixture as the Profile pictures (`accounts-fixture.mjs`).
//
//   npm run build --prefix app && npm run build:scene && npx tsx scripts/shoot/motion-setting.mjs docs/shots/motion-setting

import { accountsFixture } from "./accounts-fixture.mjs";
import { openShell } from "./shell.mjs";

const { page, origin, shoot, close } = await openShell({
  name: "motion-setting",
  stubs: await accountsFixture(),
  viewport: { width: 390, height: 844 },
});

/** Scroll the Preferences card's motion row to the middle of the viewport. */
async function settings() {
  await page.goto(`${origin}/app/settings?section=preferences`);
  const group = page.getByRole("group", { name: "Tower motion" });
  await group.waitFor();
  await group.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(300);
}

// --- PHONE FIRST (390) ---
await settings();
await shoot("settings-motion-phone");
await page.emulateMedia({ reducedMotion: "reduce" });
await settings();
await shoot("settings-motion-reduced-phone");
await page.emulateMedia({ reducedMotion: "no-preference" });

// --- DESKTOP (1280) ---
await page.setViewportSize({ width: 1280, height: 900 });
await settings();
await shoot("settings-motion-desktop");

await close();
