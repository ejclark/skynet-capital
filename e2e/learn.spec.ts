import { expect, type Page, test } from "@playwright/test";
import { captureWholeFrame, freezePage } from "./determinism";

// Milestones — a viewer-level section of the Profile page (#3807 slice 2b; was /learn, #1119), and
// its Trading chapter (was /learn/trading). Ladder/journey progress state, not
// live-ticking trading data (design decision 6 in the wider plan).
// The e2e world has no account, so the section opens steps first and the table of contents waits in
// a fold beneath them (#5256): each test opens it, the way a member taps it.
async function openMilestones(page: Page): Promise<void> {
  await page.goto("/app/accounts?section=milestones");
  await page.locator("details.ms-toc-fold > summary").click();
  await expect(page.getByRole("link", { name: /M·02/ })).toBeVisible();
}

test.describe("learn", () => {
  test("renders the milestones page", async ({ page }) => {
    await openMilestones(page);
    await expect(page.getByRole("link", { name: /M·01/ })).toBeVisible();
  });

  test("matches the known-good page screenshot", async ({ page }) => {
    await freezePage(page);
    await openMilestones(page);
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
