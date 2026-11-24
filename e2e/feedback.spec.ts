import { expect, test } from "@playwright/test";
import { captureWholeFrame, freezePage } from "./determinism";

// The member's own journal (wishes, filings and private notes; #8190), a viewer-level section of
// the Profile page since #3807 slice 2b (was /feedback; the URL key stays `feedback`) —
// config/history data, not live-ticking trading data (design decision 6 in the wider plan).
test.describe("feedback", () => {
  test("renders the feedback page", async ({ page }) => {
    await page.goto("/app/accounts?section=feedback");
    await expect(page.getByRole("heading", { name: "Your journal" })).toBeVisible();
  });

  test("matches the known-good page screenshot", async ({ page }) => {
    await freezePage(page);
    await page.goto("/app/accounts?section=feedback");
    await expect(page.getByRole("heading", { name: "Your journal" })).toBeVisible();
    await captureWholeFrame(page, "feedback-page.png");
  });
});
