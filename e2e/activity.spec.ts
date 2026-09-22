import { expect, test } from "@playwright/test";

// Live-data route (offlineDataSource-backed trade feed) — behavioral coverage only, see
// design decision 6 in the wider plan.
test("renders the activity page", async ({ page }) => {
  await page.goto("/app/activity");
  // exact: true — "Activity" also partially matches the page's own "Trading activity" h2.
  await expect(page.getByRole("heading", { name: "Activity", exact: true })).toBeVisible();
});
