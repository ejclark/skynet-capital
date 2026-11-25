import { expect, test } from "@playwright/test";
import { captureWholeFrame, freezePage } from "./determinism";

// R&D (renamed from "Research" in #3625; the URL path stays /research) — the Board section reads
// research markdown off disk (src/server/research-service.ts). The e2e server points
// SKYNET_RESEARCH_DIR at the frozen shelf in e2e/fixtures/research (playwright.config.ts, #4047),
// never the live docs/research/, so a new research doc cannot move research-page.png.
//
// A symbol chip's sub-label is its next upcoming event, read off the LIVE market-events corpus as
// of the server's `researchNow` — on this offline boot, FIXED_CLOCK (`SKYNET_FIXED_NOW`), the same
// instant the browser's calendar header shows (#8483). Before that it read the real date, so the
// chips moved every time a print passed (#4496, and the #8044 re-cut that absorbed NVDA's skip to
// 2027-02-24). What still moves a chip: a market-event JSON naming MU or NVDA dated between
// FIXED_CLOCK and today's pick. That flip is a real corpus change — re-shoot the snapshot.
test.describe("research", () => {
  test("renders the R&D board", async ({ page }) => {
    await page.goto("/app/research");
    await expect(page.getByRole("heading", { level: 1, name: "R&D" })).toBeVisible();
  });

  // The Playbook Store's one home since #3625 (moved off each account's desk).
  test("renders the playbooks section", async ({ page }) => {
    await page.goto("/app/research?section=playbooks");
    await expect(page.getByRole("heading", { level: 1, name: "Playbooks" })).toBeVisible();
    // The head is the mission line and the list of the plays (#5494 step 1); the "Subscribe as"
    // picker left it — a bot subscribes from the + on a play (#5442).
    await expect(
      page.getByText("Create scenarios, develop strategies, track results."),
    ).toBeVisible();
    await expect(page.getByRole("navigation", { name: "The playbooks" })).toBeVisible();
    await expect(page.getByRole("group", { name: "Subscribe as" })).toHaveCount(0);
  });

  test("matches the known-good page screenshot", async ({ page }) => {
    await freezePage(page);
    await page.goto("/app/research");
    // The page fires two queries (research + plays); `plays` feeds fog-of-war state that changes
    // what's shown once it resolves (dayLensFog(plays.data)) — screenshotting before it settles
    // races the render, not a flaky page. captureWholeFrame's networkidle wait covers this.
    await expect(page.getByRole("heading", { level: 1, name: "R&D" })).toBeVisible();
    // No live-status wait here: /research never opens the board's live channel, so the Live stream
    // row stays "connecting…" on this route — real, static behavior, and folded out of the frame
    // behind the top bar's status line anyway (its panel opens only on a tap).
    await captureWholeFrame(page, "research-page.png");
  });
});
