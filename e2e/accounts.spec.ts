import { expect, test } from "@playwright/test";

// Live-data route (offlineDataSource-backed accounts/positions) — behavioral coverage only, per
// design decision 6 in the wider plan: real pixel coverage for anything touching live data comes
// from CT-mounted components with fixed mock props, not a route-level screenshot.
test("renders the accounts page", async ({ page }) => {
  await page.goto("/app/accounts");
  // The offline OPEN server has no signed-in identity, so `settings.data.accounts` is empty and
  // the page takes its own honest "no account yet" branch (accounts.tsx:197) rather than the
  // populated view — real, current behavior for this deployment shape, not a defect.
  await expect(page.getByText(/doesn't resolve to an account yet/)).toBeVisible();
});
