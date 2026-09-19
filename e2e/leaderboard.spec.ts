import { expect, test } from "@playwright/test";

// The Bots-vs-Humans standings board (#2321) — the app's real landing page (`/` redirects here).
//
// NO SCREENSHOT ASSERTION HERE (yet). Measured 2026-09-19: even frozen client-side
// (determinism.ts), the board's dollar figures, "seq N" counter, and "as of" timestamp still
// drift between runs — `src/observatory/history-sampler.ts` runs a real `setInterval` tick
// server-side, in offline mode too, and `freezePage()` only patches the BROWSER's clock, not the
// server process's. `maxDiffPixelRatio` is not the fix (docs/ENGINEERING.md → "Visual regression",
// rule 1) — the real fix is pinning or pausing the server-side tick for e2e, which is its own
// scoped follow-up, not patched in here. Behavioral coverage only until then.
test.describe("leaderboard", () => {
  test("/ redirects to /leaderboard", async ({ page }) => {
    await page.goto("/app/");
    await expect(page).toHaveURL(/\/app\/leaderboard(\?.*)?$/);
  });

  test("renders the match bar and ranked rows", async ({ page }) => {
    await page.goto("/app/leaderboard");
    await expect(page.locator(".match")).toBeVisible();
    await expect(page.getByText("The Day Trader")).toBeVisible();
  });
});
