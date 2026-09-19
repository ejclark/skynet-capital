import { expect, test } from "@playwright/test";
import { captureWholeFrame, freezePage } from "./determinism";

// The research shelf — reads docs/research/*.md straight off disk (src/server/research-service.ts),
// already fully deterministic offline with no fixture/mock needed.
test.describe("research", () => {
  test("renders the research board", async ({ page }) => {
    await page.goto("/app/research");
    await expect(page.getByRole("heading", { name: "Research" })).toBeVisible();
  });

  test("matches the known-good page screenshot", async ({ page }) => {
    await freezePage(page);
    await page.goto("/app/research");
    // The page fires two queries (research + plays); `plays` feeds fog-of-war state that changes
    // what's shown once it resolves (dayLensFog(plays.data)) — screenshotting before it settles
    // races the render, not a flaky page. captureWholeFrame's networkidle wait covers this.
    await expect(page.getByRole("heading", { name: "Research" })).toBeVisible();
    // No live-status wait here: /research never opens the board's live channel, so the status
    // pill stays "connecting…" permanently on this route — that's real, static, current behavior.
    await captureWholeFrame(page, "research-page.png");
  });
});
