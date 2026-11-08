import { expect, test } from "@playwright/test";

// The landing page (#7077): sign-in opens the day's market news at /app/, not the Leaderboard.
// Behavioural only: the edition is the latest one checked in, and the server cuts its dated items
// against the real date, so the words change by design; the shape is what's held here.
test.describe("landing page", () => {
  test("opens on the news, the lead story's reports then what moved on the first phone screen", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/app/");
    await expect(page).toHaveURL(/\/app\/$/);
    const lead = page.locator(".story--lead");
    await expect(lead.locator(".story-headline")).toBeVisible();
    // Criterion 8's news half, in §5.9's order: the coming reports lead, then what moved, both on
    // the first screen at 390.
    const reports = lead.locator(".story-reports");
    const facts = lead.locator(".story-facts");
    await expect(reports).toBeInViewport();
    const order = await reports.evaluate(
      (r, f) => Boolean(f && r.compareDocumentPosition(f) & Node.DOCUMENT_POSITION_FOLLOWING),
      await facts.elementHandle(),
    );
    expect(order).toBe(true);
    await expect(facts).toBeInViewport();
    const box = await facts.boundingBox();
    expect((box?.y ?? Number.POSITIVE_INFINITY) + (box?.height ?? 0)).toBeLessThanOrEqual(844);
  });

  test("holds the rest of a story until the member taps for more", async ({ page }) => {
    await page.goto("/app/");
    const lead = page.locator(".story--lead");
    const more = lead.locator(".story-more");
    await expect(more).not.toHaveAttribute("open", "");
    await expect(lead.locator(".story-lines")).toBeHidden();
    await more.getByText("More on this story").click();
    await expect(lead.locator(".story-lines")).toBeVisible();
    // Every line wears its mark as a word, never a colour alone.
    await expect(lead.locator(".story-lines .story-mark").first()).toHaveText(/\w/);
  });

  test("gives Chronicles the first tab, and the Leaderboard leaves the bar for Profile's card", async ({
    page,
  }) => {
    await page.goto("/app/");
    const nav = page.locator("nav.topnav");
    await expect(nav.getByRole("link", { name: "Chronicles", exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(nav.getByRole("link", { name: "Leaderboard" })).toHaveCount(0);
    await page.goto("/app/leaderboard");
    await expect(page.getByRole("heading", { name: "Leaderboard" })).toBeVisible();
  });
});
