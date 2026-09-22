import { expect, test } from "@playwright/test";
import { FROZEN_DIFF_RATIO, freezePage } from "./determinism";

// Smoke coverage for the cinematic /login page — the one unauthenticated surface every visitor
// hits, and the first slice of real-browser regression detection (no Playwright suite existed
// before this). Deliberately narrow: it proves the page boots and its core beats render, not every
// animation frame. See CLAUDE.md "Playwright gives our CI process a visual sense" (2026-09-18).
test.describe("login page", () => {
  test("renders the hero, playbook toggle, and sign-in beacon", async ({ page }) => {
    await page.goto("/login");

    await expect(page.locator("#herosub")).toBeVisible();
    await expect(page.locator("#playMode")).toBeVisible();
    await expect(page.locator("#beacon")).toBeVisible();
  });

  test("opens the playbook drawer on hover", async ({ page }) => {
    await page.goto("/login");

    // PLAY opens on hover (its mouseenter handler), not just click — matches the real affordance.
    await page.locator("#playMode").hover();
    await expect(page.locator("#playMode")).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator(".play").first()).toBeVisible();
  });

  // The whole frame, not one element — the default every new screenshot spec inherits
  // (docs/ENGINEERING.md → "Visual regression"). It replaces a shot clipped to `#herosub`, which
  // covered the mode row and nothing else; this covers the wordmark, the beacon, the footer, the
  // grain and the full cinematic stage a visitor actually lands on.
  //
  // Viewport, not `fullPage: true`, and the reason is measured rather than conventional: `/login`
  // is a fixed-viewport composition, and a full-page capture resizes the layout viewport, which
  // clears every canvas bitmap the reduced-motion path never repaints. The "wider" frame came back
  // with the composition wiped and 40% dead space. determinism.ts carries the numbers.
  test("matches the known-good page screenshot", async ({ page }) => {
    await freezePage(page);
    await page.goto("/login");
    await expect(page.locator("#herosub")).toBeVisible();

    await expect(page).toHaveScreenshot("login-page.png", {
      maxDiffPixelRatio: FROZEN_DIFF_RATIO,
    });
  });
});
