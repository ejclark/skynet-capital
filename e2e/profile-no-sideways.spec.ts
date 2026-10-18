import { expect, test } from "@playwright/test";
import { OWNED, ownTheDayTrader } from "./own-account";

/**
 * The Profile page never scrolls sideways on a phone (#5108). A wide table scrolls inside its own
 * box; its screen-reader labels (`.visually-hidden`, absolute with no offsets) once escaped that
 * box — it was not positioned — and widened the whole page: 92px on Overview, 135px on Activity.
 * Layout, so it needs a real browser. The viewer is made the Day Trader's owner (`own-account.ts`).
 */

const SECTIONS = ["overview", "positions", "activity", "orders"] as const;

for (const width of [360, 390]) {
  test(`the Profile page stays inside a ${width}px phone on every section (#5108)`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await ownTheDayTrader(page);
    let labelled = 0;
    for (const section of SECTIONS) {
      await page.goto(`/app/accounts?account=${OWNED.id}&section=${section}`);
      await expect(page.locator("main")).toBeVisible();
      await page.waitForLoadState("networkidle");
      const seen = await page.evaluate(() => {
        // The issue's own measure: ask the page to scroll sideways and see whether it can.
        window.scrollTo(300, window.scrollY);
        const x = window.scrollX;
        window.scrollTo(0, window.scrollY);
        // Every box that scrolls a table sideways and holds a screen-reader label must contain it:
        // the fixture's tables fit a phone, so the leak itself only shows with a wider book.
        const boxes = [...document.querySelectorAll<HTMLElement>("main *")].filter(
          (el) =>
            ["auto", "scroll"].includes(getComputedStyle(el).overflowX) &&
            el.querySelector("table .visually-hidden"),
        );
        return {
          x,
          labelled: boxes.length,
          loose: boxes
            .filter((b) => getComputedStyle(b).position === "static")
            .map((b) => b.className),
        };
      });
      expect(seen.x, `${section}: how far the page scrolls sideways`).toBe(0);
      expect(seen.loose, `${section}: table scroll boxes a label can escape`).toEqual([]);
      labelled += seen.labelled;
    }
    // Not vacuous: some section holds a sideways-scrolling table with a screen-reader label.
    expect(labelled, "table scroll boxes holding a screen-reader label").toBeGreaterThan(0);
  });
}
