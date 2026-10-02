import { expect, test } from "@playwright/test";

// Live-data route (offlineDataSource-backed trade feed) — behavioral coverage only, see
// design decision 6 in the wider plan.
test("renders the activity page", async ({ page }) => {
  await page.goto("/app/activity");
  // exact: true — "Activity" is also the feed section's own switch label.
  await expect(page.getByRole("heading", { name: "Activity", exact: true })).toBeVisible();
});

// #784 slice 3 — one feed, booked P&L as a strip rather than a section. The two headings together
// are the shape: a strip that is always on screen, above one list, with no section to page to.
test("shows booked P&L as a strip above one feed", async ({ page }) => {
  await page.goto("/app/activity");
  await expect(page.getByRole("heading", { name: "Booked P&L" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Everything, newest first" })).toBeVisible();
  // The section switch keeps only what is genuinely a different shape of data.
  await expect(page.getByRole("button", { name: "The Council" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Booked P&L" })).toHaveCount(0);
});

// This deployment runs with the feedback lane unwired, so the feed has exactly one kind — and says
// so, rather than offering a kind chip that would blame a member's filter for a deployment fact.
test("says the feedback lane is unwired instead of offering a dead kind chip", async ({ page }) => {
  await page.goto("/app/activity");
  await expect(page.getByText("Filing ideas isn't switched on yet")).toBeVisible();
  await expect(page.getByRole("button", { name: "Ideas", exact: true })).toHaveCount(0);
  // The trade facets are still live — they are the kind this deployment does have.
  await expect(page.getByRole("button", { name: "Buys", exact: true })).toBeVisible();
});

// A bookmark on either legacy section must land somewhere honest, never a blank stage: `?section=pnl`
// on the feed with the strip right there, `?section=pulse` on the feed pre-filtered to filings.
test("lands a legacy ?section=pulse bookmark on the feed, filtered to filings", async ({
  page,
}) => {
  await page.goto("/app/activity?section=pulse");
  await expect(page.getByRole("heading", { name: "Everything, newest first" })).toBeVisible();
  await expect(page.getByPlaceholder(/filter/)).toHaveValue("is:feedback");
});
