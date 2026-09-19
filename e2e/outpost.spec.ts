import { expect, test } from "@playwright/test";

// /outpost — orphaned route (unreachable from any nav, per #3333's audit), covered here for the
// record ahead of the verification slice. Behavioral only, matching every live-data route in this
// batch (design decision 6).
test("renders the outpost page", async ({ page }) => {
  await page.goto("/app/outpost");
  await expect(page.getByRole("heading", { name: "The Trading Outpost" })).toBeVisible();
});
