import { expect, test } from "@playwright/test";

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

  test("matches the known-good hero screenshot", async ({ page }) => {
    // The hero canvas is a continuous animation the CSS itself freezes under reduced motion
    // (authenticator.ts's own `prefers-reduced-motion` block) — ride that rather than fighting
    // the animation with waits, and clip to the auth panel so the baseline stays small and stable.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/login");
    await expect(page.locator("#herosub")).toBeVisible();

    await expect(page.locator("#herosub")).toHaveScreenshot("login-hero.png", {
      maxDiffPixelRatio: 0.02,
    });
  });
});
