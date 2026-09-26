import { expect, test } from "@playwright/test";

// /join is a thin redirect stub → the Onboarding chapter of the Profile page's Milestones (#3807
// slice 2b; kept for old bookmarks/external links, e.g. the legacy /add form). No screenshot here —
// the chapter gets its own full-page coverage separately, and shooting the same page twice under
// two names wastes corpus weight for no new signal.
test("/join redirects to the Onboarding chapter", async ({ page }) => {
  await page.goto("/app/join");
  await expect(page).toHaveURL(/\/app\/accounts\?section=milestones&chapter=onboarding$/);
});
