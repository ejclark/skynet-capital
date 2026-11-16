// Pictures for #7487 slice 4a: the tower's column moves to the stage's RIGHT on every page that
// has it (Eric, 2026-11-12, on the Campaign mission control design: "Move it right"). It reverses
// #7216 (the left, Eric's #7018 round 9 B pick, 2026-11-09), whose reason (Moneypenny's rail opened
// on the right) went when slice 2 turned the rail into a dock under the stage. Formerly
// `tower-left.mjs`, #7216's pictures. The landing page (`/app/`) and the Profile page (`/accounts`),
// chat closed at 1280 (the bench width, where the column starts) and chat open at 1760 —
// Moneypenny's History risen from her dock under the page. The tower must stay put with History
// open, and the stage keeps its left edge at the frame's own (the column is the last track).
//
// `TOWER_BEFORE=1` lays the #7216 grid (column on the left) over the same build, so one build
// shoots both sides of the PR's before/after pair.
//
//   npm run build --prefix app && npm run build:scene && [TOWER_BEFORE=1] node scripts/shoot/tower-right.mjs [outdir]

import { accountsFixture } from "./accounts-fixture.mjs";
import { openShell } from "./shell.mjs";

const before = process.env.TOWER_BEFORE === "1";
const side = before ? "before" : "after";
const { page, origin, shoot, close } = await openShell({
  name: "tower-right",
  stubs: await accountsFixture(),
  viewport: { width: 1280, height: 900 },
});
await page.emulateMedia({ reducedMotion: "no-preference" });

const LEFT_COLUMN = `
.frame.frame--tower { grid-template-columns: 384px minmax(0, 1fr); }
.frame.frame--tower > .stage { grid-column: 2; }
.frame.frame--tower > .tower-column { grid-column: 1; }`;

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
  if (before) await page.addStyleTag({ content: LEFT_COLUMN });
  await page.locator(".tower-column").waitFor();
  await ready(tag);
  // The side, by the numbers: after, the column's left edge is past the stage's right edge.
  const box = await page.evaluate(() => {
    const r = (sel) => document.querySelector(sel)?.getBoundingClientRect();
    const stage = r(".frame--tower > .stage");
    const tower = r(".tower-column");
    return stage && tower
      ? {
          stageX: Math.round(stage.left),
          stageRight: Math.round(stage.right),
          towerX: Math.round(tower.left),
        }
      : null;
  });
  const where = box ? (box.towerX >= box.stageRight ? "right" : "left") : "unmeasured";
  console.log(`${tag}: tower on the ${where} ${JSON.stringify(box)}`);
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
  await page.locator(".mp-dock-history").click();
  await page.locator(".mp-history").waitFor();
  await page.waitForTimeout(800);
  await shoot(`${side}-${name}-1760-chat-open`);
  await page.locator(".mp-dock-history").click();
}

await close();
