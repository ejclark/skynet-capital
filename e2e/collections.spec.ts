import { expect, test } from "@playwright/test";

// /collections and /collections/:id were deleted in #3343 — the narrative-shelf browsing now
// lives as /research's "Collections" section (app/src/shell/collections-section.tsx). Behavioral
// only (design decision 6). The shelf slugs are server-curated, not fixed, so this discovers a
// real one by following the index's own link rather than guessing.
test("renders the collections section", async ({ page }) => {
  await page.goto("/app/research?section=collections");
  await expect(page.getByRole("heading", { name: "Collections" })).toBeVisible();
});

test("renders a collection shelf", async ({ page }) => {
  await page.goto("/app/research?section=collections");
  const firstCard = page.locator(".cx-card").first();
  await expect(firstCard).toBeVisible();
  await firstCard.click();
  await expect(page).toHaveURL(/[?&]section=collections\b/);
  await expect(page).toHaveURL(/[?&]shelf=[^&]+/);
  await expect(page.locator("h1")).toBeVisible();
});
