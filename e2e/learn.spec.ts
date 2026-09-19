import { expect, test } from "@playwright/test";
import { captureWholeFrame, freezePage } from "./determinism";

// Milestones — the Profile tab's landing page (#2321/#1119). Ladder/journey progress state, not
// live-ticking trading data (design decision 6 in the wider plan).
test.describe("learn", () => {
  test("renders the milestones page", async ({ page }) => {
    await page.goto("/app/learn");
    await expect(page.getByRole("heading", { name: /milestones/i })).toBeVisible();
  });

  test("matches the known-good page screenshot", async ({ page }) => {
    await freezePage(page);
    await page.goto("/app/learn");
    await expect(page.getByRole("heading", { name: /milestones/i })).toBeVisible();
    await captureWholeFrame(page, "learn-page.png");
  });
});

test.describe("learn/trading", () => {
  test("renders the trading rung page", async ({ page }) => {
    await page.goto("/app/learn/trading");
    await expect(
      page.getByRole("heading", { name: /One fill unlocks the next rung/ }),
    ).toBeVisible();
  });

  test("matches the known-good page screenshot", async ({ page }) => {
    await freezePage(page);
    await page.goto("/app/learn/trading");
    await expect(
      page.getByRole("heading", { name: /One fill unlocks the next rung/ }),
    ).toBeVisible();
    await captureWholeFrame(page, "learn-trading-page.png");
  });
});
