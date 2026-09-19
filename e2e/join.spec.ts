import { expect, test } from "@playwright/test";

// /join is a thin redirect stub → /onboarding (kept for old bookmarks/external links, e.g. the
// legacy /add form). No screenshot here — /onboarding gets its own full-page coverage separately,
// and shooting the same page twice under two names wastes corpus weight for no new signal.
test("/join redirects to /onboarding", async ({ page }) => {
  await page.goto("/app/join");
  await expect(page).toHaveURL(/\/app\/onboarding$/);
});
