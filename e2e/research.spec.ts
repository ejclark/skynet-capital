import { expect, test } from "@playwright/test";
import { FROZEN_DIFF_RATIO, freezePage, resizeToContentHeight } from "./determinism";

// The research shelf — reads docs/research/*.md straight off disk (src/server/research-service.ts),
// already fully deterministic offline with no fixture/mock needed. Whole-frame via
// resizeToContentHeight, not `fullPage: true` — see determinism.ts for why fullPage itself was the
// source of a 1px stability failure on this exact page.
test.describe("research", () => {
  test("renders the research board", async ({ page }) => {
    await page.goto("/app/research");
    await expect(page.getByRole("heading", { name: "Research" })).toBeVisible();
  });

  test("matches the known-good page screenshot", async ({ page }) => {
    await freezePage(page);
    await page.goto("/app/research");
    await expect(page.getByRole("heading", { name: "Research" })).toBeVisible();
    // The page fires two queries (research + plays); `plays` feeds fog-of-war state that changes
    // what's shown once it resolves (dayLensFog(plays.data)) — screenshotting before it settles
    // races the render, not a flaky page. Wait for both requests to quiesce first.
    await page.waitForLoadState("networkidle");
    // No waitForLiveStatus here: /research never opens the board's live channel, so the status
    // pill stays "connecting…" permanently on this route — that's real, static, current behavior.
    await resizeToContentHeight(page);

    await expect(page).toHaveScreenshot("research-page.png", {
      maxDiffPixelRatio: FROZEN_DIFF_RATIO,
    });
  });
});
