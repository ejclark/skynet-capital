import { expect, type Page, test } from "@playwright/test";

/**
 * The top bar keeps every view in sight (#4046 item 4). It was written against Moneypenny's right
 * rail, which narrowed the bar without narrowing the window; the bar's own width now decides when
 * the views take a row of their own. Since #7487 slice 2 the rail is gone and Moneypenny is a dock
 * under the page, so the premise inverts: expanding her conversation (one pane in the dock since
 * 2026-11-13) must leave the bar exactly as wide as the window gave it, every view still in sight. The desk keeps its one-row bar at 861px.
 */

function viewsInSight(page: Page) {
  return page.evaluate(() => {
    const nav = document.querySelector(".topnav");
    if (!nav) return { shown: 0, of: -1 };
    const box = nav.getBoundingClientRect();
    const links = [...nav.querySelectorAll("a")];
    const shown = links.filter((a) => {
      const b = a.getBoundingClientRect();
      return b.left >= box.left - 1 && b.right <= box.right + 1;
    }).length;
    return { shown, of: links.length };
  });
}

const barWidth = (page: Page) =>
  page.locator(".topbar").evaluate((el) => el.getBoundingClientRect().width);

for (const width of [1000, 1100, 1280]) {
  test(`every view stays in sight with Moneypenny's conversation expanded at ${width}px (#4046, #7487)`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/app/activity");
    await expect(page.locator(".topnav")).toBeVisible();
    const before = await barWidth(page);
    await page
      .locator(".mp-dock")
      .getByRole("button", { name: /^Expand/ })
      .click();
    await expect(
      page.getByRole("region", { name: "Conversation with Moneypenny" }),
    ).toHaveAttribute("data-size", "expanded");
    expect(await barWidth(page), "the dock never narrows the bar").toBe(before);
    const seen = await viewsInSight(page);
    expect(seen.of).toBeGreaterThan(0);
    expect(seen.shown, "views in sight on the bar").toBe(seen.of);
  });
}

test("the desk's bar stays one row at its narrowest (861px)", async ({ page }) => {
  await page.setViewportSize({ width: 861, height: 800 });
  await page.goto("/app/activity");
  await expect(page.locator(".topnav")).toBeVisible();
  const height = await page.locator(".topbar").evaluate((el) => el.getBoundingClientRect().height);
  expect(height).toBeLessThan(60);
  const seen = await viewsInSight(page);
  expect(seen.shown).toBe(seen.of);
});
