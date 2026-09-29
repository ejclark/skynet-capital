// Pictures for #3807 slice 3b-1: Settings → Preferences' "Tower motion" (phone first, then
// desktop, then the device's reduced-motion lock), and the character card compare on the Profile
// page under the flag — `?card=art` vs `?card=league` at 1280, both with the calendar head's
// moving tower. Same fixture as the Profile pictures (`accounts-fixture.mjs`).
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

/** Wait on a tower frame's scene (`__ready`), or say so and shoot without it. */
async function ready(selector, tag) {
  try {
    await page.waitForFunction(
      (sel) => document.querySelector(sel)?.contentWindow?.__ready === true,
      selector,
      { timeout: 60_000 },
    );
  } catch {
    console.log(`${tag}: ${selector} never reported ready — shot without it`);
  }
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

// The compare: the head's moving tower both times; only the right column differs.
for (const card of ["art", "league"]) {
  await page.goto(`${origin}/app/accounts?shell=watchtower&card=${card}`);
  await page.getByText("Net worth · Eric").waitFor();
  await ready("iframe.vantage", `accounts-${card}`);
  if (card === "art") await ready(".char-art iframe", "accounts-art");
  await page.waitForTimeout(1500);
  await shoot(`accounts-card-${card}-desktop`);
}
await page.goto(`${origin}/app/accounts?shell=off&card=art`);

await close();
