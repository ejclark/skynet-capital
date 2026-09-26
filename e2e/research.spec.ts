import { expect, test } from "@playwright/test";
import { captureWholeFrame, freezePage } from "./determinism";

// R&D (renamed from "Research" in #3625; the URL path stays /research) — the Board section reads
// docs/research/*.md straight off disk (src/server/research-service.ts), already fully
// deterministic offline with no fixture/mock needed.
test.describe("research", () => {
  test("renders the R&D board", async ({ page }) => {
    await page.goto("/app/research");
    await expect(page.getByRole("heading", { level: 1, name: "R&D" })).toBeVisible();
  });

  // The Playbook Store's one home since #3625 (moved off each account's desk).
  test("renders the playbooks section", async ({ page }) => {
    await page.goto("/app/research?section=playbooks");
    await expect(page.getByRole("heading", { level: 1, name: "Playbooks" })).toBeVisible();
    // The account picker — the store's "subscribe as" moved here from the desk (#3625), and from
    // the rail into the Playbooks section's own head when the rail left the frame (#3807 slice 2a).
    await expect(page.getByRole("group", { name: "Subscribe as" })).toBeVisible();
    await expect(
      page.locator("main .pb-subscribe").getByRole("button", { name: "Catalog only" }),
    ).toBeVisible();
  });

  test("matches the known-good page screenshot", async ({ page }) => {
    await freezePage(page);
    await page.goto("/app/research");
    // The page fires two queries (research + plays); `plays` feeds fog-of-war state that changes
    // what's shown once it resolves (dayLensFog(plays.data)) — screenshotting before it settles
    // races the render, not a flaky page. captureWholeFrame's networkidle wait covers this.
    await expect(page.getByRole("heading", { level: 1, name: "R&D" })).toBeVisible();
    // No live-status wait here: /research never opens the board's live channel, so the status
    // pill stays "connecting…" permanently on this route — that's real, static, current behavior.
    await captureWholeFrame(page, "research-page.png");
  });
});
