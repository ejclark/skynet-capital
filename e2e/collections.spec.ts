import { expect, test } from "@playwright/test";

// /collections — orphaned route (reachable only via the `g c` keyboard chord, per #3333's audit).
// Behavioral only (design decision 6). The $id route's slugs are server-curated, not fixed, so
// this discovers a real one by following the index's own link rather than guessing.
test("renders the collections index", async ({ page }) => {
  await page.goto("/app/collections");
  await expect(page.getByRole("heading", { name: "Collections" })).toBeVisible();
});

test("renders a collection shelf", async ({ page }) => {
  await page.goto("/app/collections");
  const firstCard = page.locator(".cx-card").first();
  await expect(firstCard).toBeVisible();
  await firstCard.click();
  await expect(page).toHaveURL(/\/app\/collections\/.+/);
  await expect(page.locator("h1")).toBeVisible();
});
