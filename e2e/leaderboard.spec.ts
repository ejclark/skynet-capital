import { expect, type Page, test } from "@playwright/test";

// The Bots-vs-Humans standings board (#2321) — the app's real landing page (`/` redirects here).
//
// NO SCREENSHOT ASSERTION HERE (yet). Measured 2026-09-19: even frozen client-side
// (determinism.ts), the board's dollar figures, "seq N" counter, and "as of" timestamp still
// drift between runs — `src/observatory/history-sampler.ts` runs a real `setInterval` tick
// server-side, in offline mode too, and `freezePage()` only patches the BROWSER's clock, not the
// server process's. `maxDiffPixelRatio` is not the fix (docs/ENGINEERING.md → "Visual regression",
// rule 1) — the real fix is pinning or pausing the server-side tick for e2e, which is its own
// scoped follow-up, not patched in here. Behavioral coverage only until then.
test.describe("leaderboard", () => {
  test("/ redirects to /leaderboard", async ({ page }) => {
    await page.goto("/app/");
    await expect(page).toHaveURL(/\/app\/leaderboard(\?.*)?$/);
  });

  test("renders the match bar and ranked rows", async ({ page }) => {
    await page.goto("/app/leaderboard");
    await expect(page.locator(".match")).toBeVisible();
    await expect(page.getByText("The Day Trader")).toBeVisible();
  });

  // #4944's filter-chip promise, broken here until #5057: the new metric's snapshot was a fresh
  // query, the page swapped to "Reading the board…", and the shorter page threw the scroll to 0.
  test("a metric chip keeps the place at 390", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/app/leaderboard");
    await expect(page.locator(".rank-row").first()).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const reading = await page.evaluate(() => Math.round(window.scrollY));
    expect(reading).toBeGreaterThan(0);
    await page.getByRole("link", { name: "Return %" }).click();
    await expect(page.getByText("Return %", { exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(page.locator(".ladder")).not.toHaveAttribute("aria-busy", "true");
    expect(
      Math.abs((await page.evaluate(() => Math.round(window.scrollY))) - reading),
    ).toBeLessThanOrEqual(2);
  });
});

// Compare keeps your place and brings the pair to you (#5057, Eric's pick on #5037 question 8).
// Before it, each Compare tap scrolled to the top; at 390 the top showed neither the rows to pick
// from nor the head-to-head, whose top sat ~780–950px down an 844px screen.
const scrollY = (page: Page) => page.evaluate(() => Math.round(window.scrollY));
const topOf = async (page: Page, selector: string) =>
  page.evaluate((s) => document.querySelector(s)?.getBoundingClientRect().top ?? -1, selector);

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1280, height: 800 },
]) {
  test(`compare keeps your place and scrolls the pair in at ${viewport.width}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/app/leaderboard");
    const row = (name: string) => page.locator(".rank-row").filter({ hasText: name });
    const compare = (name: string) => row(name).getByRole("link", { name: /^Compare/ });

    // Read from the bottom of the board, where the last row is.
    await expect(row("Eric")).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const reading = await scrollY(page);
    expect(reading).toBeGreaterThan(0);

    // First pick: the page stays put, and a bar at the bottom names the pick and offers Cancel.
    await compare("Eric").click();
    const bar = page.getByRole("status").filter({ hasText: "Comparing" });
    await expect(bar).toContainText("Eric");
    await expect(bar).toBeInViewport({ ratio: 1 });
    await expect(bar.getByRole("link", { name: "Cancel" })).toBeVisible();
    expect(Math.abs((await scrollY(page)) - reading)).toBeLessThanOrEqual(2);

    // Second pick: the head-to-head comes into view under the top bar and takes focus.
    await compare("The Day Trader").scrollIntoViewIfNeeded();
    const pairedAt = await row("The Day Trader").evaluate((el) => el.getBoundingClientRect().top);
    await compare("The Day Trader").click();
    const heading = page.getByRole("heading", { name: "Head to head" });
    await expect(heading).toBeInViewport({ ratio: 1 });
    await expect(heading).toBeFocused();
    // Clear of the sticky top bar (133px tall at 390), not hidden behind it.
    const topbarBottom = await page.evaluate(
      () => document.querySelector(".topbar")?.getBoundingClientRect().bottom ?? 0,
    );
    await expect.poll(() => topOf(page, ".cmp h2")).toBeGreaterThanOrEqual(topbarBottom - 1);

    // Side by side: one row per line item, each account's value in its own column.
    const table = page.getByRole("table", { name: "Eric versus The Day Trader, line by line" });
    await expect(table.getByRole("columnheader", { name: /Eric/ })).toBeVisible();
    await expect(table.getByRole("rowheader", { name: /^Equity/ })).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: "Comparing" })).toHaveCount(0);

    // Clear: back to the row the pair was made from, where it sat on screen.
    await page.getByRole("button", { name: /Clear/ }).click();
    await expect(heading).toHaveCount(0);
    await expect
      .poll(() => row("The Day Trader").evaluate((el) => el.getBoundingClientRect().top))
      .toBeCloseTo(pairedAt, -1);
  });
}
