import { expect, test } from "@playwright/test";
import { captureWholeFrame, freezePage } from "./determinism";

// Preferences (theme, density), the invite/allowlist admin panel — config data, not live-ticking
// trading data (design decision 6 in the wider plan).
test.describe("settings", () => {
  test("renders the settings page", async ({ page }) => {
    await page.goto("/app/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  });

  test("matches the known-good page screenshot", async ({ page }) => {
    await freezePage(page);
    await page.goto("/app/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await captureWholeFrame(page, "settings-page.png");
  });
});
