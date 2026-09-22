import { expect, test } from "@playwright/test";

// Live-data route — behavioral coverage only (design decision 6). Also the one route gated by
// desk-gate.ts's isMarketOpen(), which reads the real server clock — a route-level pixel assertion
// here would drift with real market hours regardless of freezePage()'s browser-side clock (#3333).
// Rendering at all (open or closed market) is what this spec checks.
test("renders the trade page", async ({ page }) => {
  await page.goto("/app/trade");
  await expect(page.getByRole("heading", { name: "Trade" })).toBeVisible();
});
