import { expect, type Page, test } from "@playwright/test";
import { FIXED_CLOCK } from "./determinism";
import { OWNED, ownTheDayTrader } from "./own-account";

/**
 * Landing on the wait line from Events (#7439, found by the post-merge audit of #7423). A standing
 * wait's reopen day is an Events row, and its one link — "Your wait on the Overview →" — jumps to
 * `#book-wait` with the router's top-aligned hash scroll. With no `scroll-margin-top` the line
 * parked under the sticky topbar and cockpit head: nothing about the wait was visible on arrival.
 * The fix lists `#book-wait` among `landing.css`'s landing targets; this holds it there.
 *
 * Scroll position against a sticky head is layout, so it needs a real browser (the same reason as
 * `ledger-landing.spec.ts`). The browser clock is pinned so the reopen day sits inside the Events
 * range: two days after FIXED_CLOCK's New York date.
 */

const REOPENS_ON = "2026-09-20";
const EVENTS = `/app/accounts?account=${OWNED.id}&section=events`;

async function stage(page: Page): Promise<void> {
  await page.clock.setFixedTime(FIXED_CLOCK);
  await ownTheDayTrader(page);
  await page.route(
    (url) => url.pathname === "/api/book-wait",
    (route) =>
      route.fulfill({
        json: {
          wait: {
            state: "standing",
            daysLeft: 2,
            wait: {
              reopensOn: REOPENS_ON,
              reason: "earnings are close; no new risk",
              setAt: "2026-09-17T14:00:00.000Z",
            },
          },
        },
      }),
  );
  // The offline book is short; a member's real book has room below the wait line, and without it
  // no jump could top-align the line at all. Give the page that room.
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      document.body.style.paddingBottom = "1500px";
    });
  });
}

/** What is drawn at the wait line's centre, and the share of its vertical centre line that is it. */
function whatIsSeen(el: Element): { overCentre: string; visibleShare: number } {
  const box = el.getBoundingClientRect();
  const x = box.left + box.width / 2;
  const hit = document.elementFromPoint(x, box.top + box.height / 2);
  const steps = 20;
  let mine = 0;
  // Sample strictly inside the box: its bottom edge's pixel row belongs to whatever follows it.
  for (let i = 0; i <= steps; i++) {
    const y = box.top + (box.height * (i + 0.5)) / (steps + 1);
    const at = y >= 0 && y < window.innerHeight ? document.elementFromPoint(x, y) : null;
    if (at && el.contains(at)) mine++;
  }
  const name = hit
    ? el.contains(hit)
      ? "the wait line"
      : `${hit.tagName.toLowerCase()}.${[...hit.classList].join(".")}`
    : "nothing";
  return { overCentre: name, visibleShare: mine / (steps + 1) };
}

for (const viewport of [
  { width: 1280, height: 900 },
  { width: 390, height: 844 },
]) {
  test.describe(`the Events row's wait link at ${viewport.width}px (#7439)`, () => {
    test.use({ viewport });

    test("lands the wait line fully on screen below the sticky head", async ({ page }) => {
      await stage(page);
      await page.goto(EVENTS);
      const link = page.getByRole("link", { name: "Your wait on the Overview →" });
      await expect(link).toBeVisible();
      await link.click();
      const line = page.locator("#book-wait");
      await expect(line).toBeVisible();
      await expect(page).toHaveURL(/#book-wait$/);
      // Measure once the router's hash jump has happened and the page has stopped moving — never
      // mid-flight, where the line could pass on its pre-jump position.
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
      await page.waitForFunction(
        () =>
          new Promise<boolean>((done) => {
            const y = window.scrollY;
            setTimeout(() => done(window.scrollY === y), 300);
          }),
      );
      const seen = await line.evaluate(whatIsSeen);
      expect(seen.overCentre, "what is drawn at the wait line's centre").toBe("the wait line");
      expect(seen.visibleShare, "the share of the line on screen and uncovered").toBe(1);
    });
  });
}
