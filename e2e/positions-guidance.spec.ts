import { expect, type Page, test } from "@playwright/test";
import { OWNED, ownTheDayTrader } from "./own-account";

/**
 * The guidance line on every row (#5070; round 2 of #5037, Eric's Build 4: "a line on every
 * position, under a divider, in a slot that doesn't shift"). Height and overflow are layout, so it
 * needs a real browser. The offline Day Trader holds two shares, both above cost; the spec puts the
 * first one below cost so the book carries a Review mark beside an On plan one, and makes the
 * viewer its owner so Not now is drawn. Everything else is the real offline server's answer.
 */

interface Position {
  readonly symbol: string;
  totalPl: string;
  totalPlRaw: number;
  returnPct: string;
  totalTone: string;
}

async function stage(page: Page): Promise<void> {
  await ownTheDayTrader(page);
  await page.route(`**/api/desk/${OWNED.id}`, async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    const first = (body.desk.positions as Position[])[0];
    if (first)
      Object.assign(first, {
        totalPl: "-$50",
        totalPlRaw: -50,
        returnPct: "-1.0%",
        totalTone: "neg",
      });
    await route.fulfill({ response, json: body });
  });
}

/** Every visible guidance line's height, and whether the page scrolls sideways. */
const measure = (page: Page) =>
  page.evaluate(() => ({
    lines: [...document.querySelectorAll<HTMLElement>(".pos-guide-line")]
      .filter((e) => e.getClientRects().length > 0)
      .map((e) => Math.round(e.getBoundingClientRect().height)),
    sideways: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));

test.describe("the guidance line at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("every card carries one, the same height whatever it says, and Not now keeps it", async ({
    page,
  }) => {
    await stage(page);
    await page.goto("/app/accounts");
    const cards = page.locator(".pos-cards");
    await expect(cards.locator(".pos-guide-mark--review")).toHaveCount(1);
    await expect(cards.locator(".pos-guide-mark--onplan")).toHaveCount(1);
    const before = await measure(page);
    expect(before.lines).toHaveLength(2);
    expect(new Set(before.lines).size, "one height for every line").toBe(1);
    expect(before.sideways, "no sideways page scroll").toBeLessThanOrEqual(0);

    // Opened in place, then set aside: the line's words change, its height does not.
    await cards
      .locator(".pos-card-guided")
      .first()
      .getByRole("button", { name: /^Guidance for/ })
      .click();
    await cards.getByRole("button", { name: "Not now", exact: true }).click();
    await expect(cards.locator(".pos-guide-mark--aside")).toHaveText(
      /Not now · .*till \w{3} close/,
    );
    const after = await measure(page);
    expect(after.lines).toEqual(before.lines);
    expect(after.sideways).toBeLessThanOrEqual(0);
  });
});

test.describe("the guidance line on the desk table", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("holds its Guidance inside the visible table even when the table scrolls sideways", async ({
    page,
  }) => {
    await stage(page);
    await page.goto("/app/accounts");
    const call = page.locator(".blotter .row-guide .pos-guide-call").first();
    await expect(call).toBeVisible();
    const gap = await call.evaluate((el) => {
      const frame = el.closest(".blotter-scroll")?.getBoundingClientRect();
      return frame ? Math.round(frame.right - el.getBoundingClientRect().right) : -1;
    });
    expect(gap, "the button ends inside the visible table").toBeGreaterThanOrEqual(0);
  });
});
