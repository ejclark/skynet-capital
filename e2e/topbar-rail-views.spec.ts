import { expect, type Page, test } from "@playwright/test";

/**
 * The top bar keeps every view in sight while Moneypenny's rail is open (#4046 item 4). The rail
 * narrows the bar without narrowing the window, so a window-width rule left the views on the bar's
 * first row to scroll inside it: at 1100 only two of five showed, and the page's own view was not
 * one of them. The bar's own width now decides — too narrow for one row, the views take a row of
 * their own. With the rail closed, the desk keeps its one-row bar.
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

for (const width of [1000, 1100, 1280]) {
  test(`every view stays in sight with Moneypenny's rail open at ${width}px (#4046)`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/app/activity");
    await page.getByRole("button", { name: /Moneypenny/ }).click();
    await expect(page.locator(".mp-rail")).toBeVisible();
    const seen = await viewsInSight(page);
    expect(seen.of).toBeGreaterThan(0);
    expect(seen.shown, "views in sight on the bar").toBe(seen.of);
  });
}

test("with the rail closed, the desk's bar stays one row at its narrowest (861px)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 861, height: 800 });
  await page.goto("/app/activity");
  await expect(page.locator(".topnav")).toBeVisible();
  const height = await page.locator(".topbar").evaluate((el) => el.getBoundingClientRect().height);
  expect(height).toBeLessThan(60);
  const seen = await viewsInSight(page);
  expect(seen.shown).toBe(seen.of);
});
