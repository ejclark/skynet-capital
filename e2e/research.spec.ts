import { expect, test } from "@playwright/test";
import { captureWholeFrame, freezePage } from "./determinism";

// R&D (renamed from "Research" in #3625; the URL path stays /research) — the Board section reads
// research markdown off disk (src/server/research-service.ts). The e2e server points
// SKYNET_RESEARCH_DIR at the frozen shelf in e2e/fixtures/research (playwright.config.ts, #4047),
// never the live docs/research/, so a new research doc cannot move research-page.png.
//
// What the fixture does NOT freeze: a symbol chip's sub-label is its next upcoming event, read off
// the LIVE market-events corpus against the real clock (`shelfSymbols(new Date()…)`,
// src/server/content-api-routes.ts). So a chip reads a date until that event passes and then flips
// to "no dated event" on its own — and adding a market-event JSON naming MU or NVDA flips it back.
// Each flip is a few hundred pixels, under FROZEN_DIFF_RATIO alone but enough to push a real
// change over it (#4496: MU's 2026-09-30 print had already rotted when the filter placeholder grew
// a `sector:` example, and the two together failed the shot). Re-shoot the snapshot; the chip is
// telling the truth. Freezing the clock for this route is filed separately.
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
