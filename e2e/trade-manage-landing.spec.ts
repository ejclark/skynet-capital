import { expect, type Page, test } from "@playwright/test";
import { OWNED, ownTheDayTrader } from "./own-account";

/**
 * Landing on a held contract's Close / Roll row (#5216). A held option's door to Trade names it —
 * `section=orders&manage=<OCC>` (#4947) — and the row scrolls to the middle of the screen. On the
 * docked bench the ticket and chart sit ABOVE that row and load on their own, so when the book
 * answers first the row renders, scrolls, and is then pushed about 650px below the fold: the study
 * landed 284px down on a Buy / Stock ticket with Close… / Roll… near 1,376px. Scroll position
 * against a page still loading is layout, so it needs a real browser.
 *
 * The spec makes that race happen every time: the book answers at once and every other API waits
 * 800ms, so the panes above grow after the row has already landed. Once the page has settled the
 * row's Close… and Roll… must still be on screen.
 */

const OCC = "CRWV261120P00080000";
const MANAGE = `/app/trade?desk=${OWNED.id}&symbol=CRWV&section=orders&manage=${OCC}`;
const LAG_MS = 800;

async function stage(page: Page): Promise<void> {
  // Registered first, so it is the fallback: the desk route below answers the book without the lag.
  await page.route("**/api/**", async (route) => {
    await new Promise((r) => setTimeout(r, LAG_MS));
    await route.fallback();
  });
  await ownTheDayTrader(page);
  await page.route(`**/api/desk/${OWNED.id}`, async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    const shares = body.desk.positions.find((p: { isOption: boolean }) => !p.isOption);
    body.desk.positions = [
      {
        ...shares,
        symbol: OCC,
        display: "CRWV $80 PUT · 20 NOV 26",
        isOption: true,
        quantity: "-1",
        costPerShare: "$2.55",
        price: "$5.50",
        costBasis: "-$255",
        value: "-$550",
        totalPl: "-$295",
        totalPlRaw: -295,
        returnPct: "-116%",
        totalTone: "neg",
        expiresIn: "41 days",
        expiresInDays: 41,
        breakeven: "$77.45",
        lots: undefined,
      },
      ...body.desk.positions,
    ];
    await route.fulfill({ response, json: body });
  });
}

for (const width of [1280, 1440]) {
  test.describe(`a held contract's door to Trade at ${width}px (#5216)`, () => {
    test.use({ viewport: { width, height: 900 } });

    test("lands on its Close… and Roll…, and stays there while the panes above load", async ({
      page,
    }) => {
      await stage(page);
      await page.goto(MANAGE);
      const row = page.locator(".tkt-close-row-focus");
      await expect(row).toBeVisible();
      // Everything above the row has answered, and one more layout pass has run.
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(LAG_MS);
      await expect(row.getByRole("button", { name: "Close…" })).toBeInViewport();
      await expect(row.getByRole("button", { name: "Roll…" })).toBeInViewport();
    });
  });
}
