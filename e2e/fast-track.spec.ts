import { expect, test } from "@playwright/test";

// The landing page's first fast track (#7034 slice 2), against the real server and the checked-in
// calendar. Behavioural only: the server cuts the fortnight against the real date, so which events
// show changes by design; the shape is what's held here.
test.describe("the first fast track", () => {
  test("opens in place under the question box: at most 3 events, each dated in words with a stance", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/app/");
    const chip = page.getByRole("button", { name: "What's coming up that I should watch?" });
    await expect(chip).toHaveAttribute("aria-expanded", "false");
    await chip.click();
    await expect(chip).toHaveAttribute("aria-expanded", "true");
    const walk = page.locator(".ft-walk");
    // Criterion 7: the sources it doesn't read are named, whatever the fortnight holds.
    await expect(walk.locator(".ft-uncovered")).toHaveText("News and lawsuits: not covered yet.");
    const shown = walk.locator(":scope > .ft-events > .ft-event");
    expect(await shown.count()).toBeLessThanOrEqual(3);
    for (const row of await shown.all()) {
      // Criterion 2: confirmed or an estimate, in words; the house's stance or "not researched yet".
      await expect(row.locator(".ft-event-date")).toContainText(/date (confirmed|is an estimate)/);
      await expect(row.locator(".ft-stance")).toContainText("House stance");
      await expect(row.getByRole("button", { name: "Ask what we know" })).toBeVisible();
    }
    // Criterion 4: every card carries the member's own answer and added context.
    await expect(
      walk.locator("summary", { hasText: "My own answer (kept as a note)" }),
    ).toBeVisible();
    await expect(walk.locator("summary", { hasText: "Add context" })).toBeVisible();
  });

  test("the trade form shows a carried plan for its own name only", async ({ page }) => {
    const plan = "plan=NVDA&stop=A+guide+below+consensus&exit=Close+before+the+print";
    await page.goto(`/app/trade?symbol=NVDA&${plan}`);
    const carried = page.getByRole("region", { name: "Your plan" });
    await expect(carried).toContainText("A guide below consensus");
    await expect(carried).toContainText("Close before the print");
    await expect(carried).toContainText("nothing sells on it");
    await page.goto(`/app/trade?symbol=AAPL&${plan}`);
    await expect(page.getByRole("heading", { name: "Trade" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Your plan" })).toHaveCount(0);
  });
});
