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
    // Criterion 8's ask half: the page opens on the member's own question, above the news.
    const ask = page.getByLabel("What do you want to do today?");
    await expect(ask).toBeInViewport();
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
    const more = lead.locator(":scope > .story-more");
    await expect(more).not.toHaveAttribute("open", "");
    await expect(more.locator(".story-lines")).toBeHidden();
    await more.getByText("More on this story").click();
    await expect(more.locator(".story-lines")).toBeVisible();
    // Every line wears its mark as a word, never a colour alone.
    await expect(more.locator(".story-lines .story-mark").first()).toHaveText(/\w/);
  });

  test("offers at most two quick questions under the member's own (criterion 2)", async ({
    page,
  }) => {
    await page.goto("/app/");
    const quick = page.getByRole("list", { name: "Quick questions" }).getByRole("button");
    await expect(quick.first()).toBeVisible();
    expect(await quick.count()).toBeLessThanOrEqual(2);
  });

  test("answers a story's hunch with the record, never a buy call (criteria 5, 7)", async ({
    page,
  }) => {
    await page.goto("/app/");
    const ask = page.locator(".story--lead .story-ask");
    await expect(ask.getByText("Ask your own")).toBeVisible();
    const record = ask.locator(".story-record");
    await expect(record).toBeHidden();
    await ask.getByText("Is this a chance to buy?").click();
    await expect(record).toBeVisible();
    await expect(record.locator(".story-record-coda")).toContainText("Nothing here calls it a buy");
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
