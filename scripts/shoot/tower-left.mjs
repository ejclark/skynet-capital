// Pictures for #7216 slice 1: the tower's column moves to the stage's LEFT on every page that has
// it (Eric's #7018 round 9 B pick, 2026-11-09). The landing page (`/app/`) and the Profile page
// (`/accounts`), chat closed at 1280 (the bench width, where the column starts) and chat open at
// 1760 (the window that still leaves the page the bench width beside Moneypenny's 440px rail,
// `use-tower-column.ts`) — the tower must stay put and the stage narrow from the right.
//
// `TOWER_BEFORE=1` lays the pre-#7216 grid (column on the right) over the same build, so one build shoots
// both sides of the PR's before/after pair.
//
//   npm run build --prefix app && npm run build:scene && [TOWER_BEFORE=1] node scripts/shoot/tower-left.mjs [outdir]

import { accountsFixture } from "./accounts-fixture.mjs";
import { openShell } from "./shell.mjs";

const before = process.env.TOWER_BEFORE === "1";
const side = before ? "before" : "after";
const { page, origin, shoot, close } = await openShell({
  name: "tower-left",
  stubs: await accountsFixture(),
  viewport: { width: 1280, height: 900 },
});
await page.emulateMedia({ reducedMotion: "no-preference" });

const RIGHT_COLUMN = `
.frame.frame--tower { grid-template-columns: minmax(0, 1fr) 384px; }
.frame.frame--tower > .stage { grid-column: 1; }
.frame.frame--tower > .tower-column { grid-column: 2; }`;

/** Wait on the page's one tower frame, or say so and shoot without it. */
async function ready(tag) {
  try {
    await page.waitForFunction(
      () => document.querySelector("iframe.vantage")?.contentWindow?.__ready === true,
      undefined,
      { timeout: 60_000 },
    );
  } catch {
    console.log(`${tag}: the tower never reported ready — shot without it`);
  }
  await page.mouse.move(0, 0);
  await page.waitForTimeout(1500);
}

async function visit(path, tag) {
  await page.goto(`${origin}${path}`);
  if (before) await page.addStyleTag({ content: RIGHT_COLUMN });
  await page.locator(".tower-column").waitFor();
  await ready(tag);
}

for (const [path, name] of [
  ["/app/", "landing"],
  ["/app/accounts", "accounts"],
]) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await visit(path, `${name}-closed`);
  await shoot(`${side}-${name}-1280-chat-closed`);

  await page.setViewportSize({ width: 1760, height: 900 });
  await visit(path, `${name}-open`);
  await page.locator(".mp-toggle").first().click();
  await page.locator(".mp-rail").waitFor();
  await page.waitForTimeout(800);
  await shoot(`${side}-${name}-1760-chat-open`);
  await page.locator(".mp-toggle").first().click();
}

await close();
