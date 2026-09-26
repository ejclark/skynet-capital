import { expect, test } from "@playwright/test";
import { captureWholeFrame, freezePage } from "./determinism";

// Milestone M·01 — the onboarding checklist (#1119), the Onboarding chapter of the Profile page's
// Milestones since #3807 slice 2b (was /onboarding). Reads /api/onboarding's ledger state, not
// live-ticking trading data, so a whole-page pixel snapshot is the right layer here (design
// decision 6 in the wider plan: live-data routes get behavioral-only coverage instead).
test.describe("onboarding", () => {
  test("renders the onboarding checklist", async ({ page }) => {
    await page.goto("/app/accounts?section=milestones&chapter=onboarding");
    await expect(page.getByRole("heading", { name: /Welcome to the league/ })).toBeVisible();
  });

  test("matches the known-good page screenshot", async ({ page }) => {
    await freezePage(page);
    await page.goto("/app/accounts?section=milestones&chapter=onboarding");
    await expect(page.getByRole("heading", { name: /Welcome to the league/ })).toBeVisible();
    await captureWholeFrame(page, "onboarding-page.png");
  });
});
