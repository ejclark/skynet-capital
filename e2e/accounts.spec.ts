import { expect, test } from "@playwright/test";

// Live-data route (offlineDataSource-backed accounts/positions) — behavioral coverage only, per
// design decision 6 in the wider plan: real pixel coverage for anything touching live data comes
// from CT-mounted components with fixed mock props, not a route-level screenshot.
test("renders the accounts page's zero-account door", async ({ page }) => {
  await page.goto("/app/accounts");
  // The offline OPEN server has no signed-in identity, so `settings.data.accounts` is empty — the
  // zero-account door (#3807 slice 2b): the Profile page itself, never an early return, its head
  // saying so where the switcher sits, opened on Milestones with the Onboarding chapter open.
  await expect(page.getByText(/No account linked yet/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Milestones", pressed: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Welcome to the league/ })).toBeVisible();
});
