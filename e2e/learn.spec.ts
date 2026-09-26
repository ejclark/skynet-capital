import { expect, test } from "@playwright/test";
import { captureWholeFrame, freezePage } from "./determinism";

// Milestones — a viewer-level section of the Profile page (#3807 slice 2b; was /learn, #1119), and
// its Trading chapter (was /learn/trading). Ladder/journey progress state, not
// live-ticking trading data (design decision 6 in the wider plan).
test.describe("learn", () => {
  test("renders the milestones page", async ({ page }) => {
    await page.goto("/app/accounts?section=milestones");
    await expect(page.getByRole("heading", { name: "Your milestones" })).toBeVisible();
  });

  test("matches the known-good page screenshot", async ({ page }) => {
    await freezePage(page);
    await page.goto("/app/accounts?section=milestones");
    await expect(page.getByRole("heading", { name: "Your milestones" })).toBeVisible();
    await captureWholeFrame(page, "learn-page.png");
  });
});

test.describe("learn/trading", () => {
  test("renders the trading rung page", async ({ page }) => {
    await page.goto("/app/accounts?section=milestones&chapter=trading");
    await expect(
      page.getByRole("heading", { name: /One fill unlocks the next rung/ }),
    ).toBeVisible();
  });

  test("matches the known-good page screenshot", async ({ page }) => {
    await freezePage(page);
    await page.goto("/app/accounts?section=milestones&chapter=trading");
    await expect(
      page.getByRole("heading", { name: /One fill unlocks the next rung/ }),
    ).toBeVisible();
    await captureWholeFrame(page, "learn-trading-page.png");
  });
});
