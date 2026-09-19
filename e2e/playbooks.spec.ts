import { expect, test } from "@playwright/test";
import { captureWholeFrame, freezePage } from "./determinism";

// Playbook definitions (strategy templates) — static content, not live-ticking trading data
// (design decision 6 in the wider plan).
test.describe("playbooks", () => {
  test("renders the playbooks page", async ({ page }) => {
    await page.goto("/app/playbooks");
    await expect(page.getByRole("heading", { name: /Prove the play by hand/ })).toBeVisible();
  });

  test("matches the known-good page screenshot", async ({ page }) => {
    await freezePage(page);
    await page.goto("/app/playbooks");
    await expect(page.getByRole("heading", { name: /Prove the play by hand/ })).toBeVisible();
    await captureWholeFrame(page, "playbooks-page.png");
  });
});
