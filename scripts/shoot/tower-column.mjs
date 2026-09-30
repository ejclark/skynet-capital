// Pictures for #3977: the Profile page's big tower in its own column, from just under the navbar,
// unboxed (Eric, 2026-09-30, picked by eye from a mock). Phone first — the page stays one column
// and the Overview keeps the boxed card in its flow — then 1280 (the bench width, where the column
// starts) and 1600, and one section other than the Overview to show the column stays.
//
//   npm run build --prefix app && npm run build:scene && node scripts/shoot/tower-column.mjs <outdir>

import { accountsFixture } from "./accounts-fixture.mjs";
import { openShell } from "./shell.mjs";

const { page, origin, shoot, close } = await openShell({
  name: "tower-column",
  stubs: await accountsFixture(),
  viewport: { width: 390, height: 844 },
});
await page.emulateMedia({ reducedMotion: "no-preference" });

/** Wait on the tower frame's scene (`__ready`), or say so and shoot without it. */
async function ready(tag) {
  try {
    await page.waitForFunction(
      () => document.querySelector(".char-art iframe")?.contentWindow?.__ready === true,
      undefined,
      { timeout: 60_000 },
    );
  } catch {
    console.log(`${tag}: the tower never reported ready — shot without it`);
  }
  await page.mouse.move(0, 0);
  await page.waitForTimeout(1500);
}

// --- PHONE FIRST (390): one column, the card after the decisions ---
await page.goto(`${origin}/app/accounts`);
await page.getByText("Net worth · Eric").waitFor();
await page.locator(".char-art").scrollIntoViewIfNeeded();
await ready("phone");
await shoot("tower-column-phone");

// --- 1280 and 1600: the column from just under the navbar ---
for (const width of [1280, 1600]) {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto(`${origin}/app/accounts`);
  await page.getByText("Net worth · Eric").waitFor();
  await page.locator(".tower-column").waitFor();
  await ready(`${width}`);
  await shoot(`tower-column-${width}`);
}

// Another section: the column stays.
await page.goto(`${origin}/app/accounts?section=activity`);
await page.locator(".tower-column").waitFor();
await ready("activity");
await shoot("tower-column-activity-1600");

await close();
