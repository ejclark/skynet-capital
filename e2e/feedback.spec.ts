import { expect, test } from "@playwright/test";
import { captureWholeFrame, freezePage } from "./determinism";

// The member's own feedback index — config/history data, not live-ticking trading data (design
// decision 6 in the wider plan).
test.describe("feedback", () => {
  test("renders the feedback page", async ({ page }) => {
    await page.goto("/app/feedback");
    await expect(page.getByRole("heading", { name: "Your feedback" })).toBeVisible();
  });

  test("matches the known-good page screenshot", async ({ page }) => {
    await freezePage(page);
    await page.goto("/app/feedback");
    await expect(page.getByRole("heading", { name: "Your feedback" })).toBeVisible();
    await captureWholeFrame(page, "feedback-page.png");
  });
});
