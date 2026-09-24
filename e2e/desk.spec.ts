import { expect, test } from "@playwright/test";

// The /u/$id/* desk family — live-data routes (offlineDataSource-backed), behavioral only per
// design decision 6. Uses real fixture participant ids (fixtures/offline/participants.json):
// day-trader/rumor-trader/sauron are bots, human-eric is the one human account.
test.describe("desk", () => {
  test("renders a desk's active view", async ({ page }) => {
    await page.goto("/app/u/day-trader");
    await expect(page.getByRole("heading", { name: /The Day Trader/ })).toBeVisible();
  });

  test("renders a desk's decisions view", async ({ page }) => {
    await page.goto("/app/u/day-trader/decisions");
    await expect(page.getByRole("heading", { name: /decisions/ })).toBeVisible();
  });

  // The Playbook Store left the desk in #3625 (Eric, 2026-09-23: "the legacy route should not have
  // the playbook store view") — the desk route now only redirects to R&D → Playbooks with the same
  // account pre-selected in the "Subscribe as" rail.
  test("redirects a desk's playbooks link to R&D → Playbooks", async ({ page }) => {
    await page.goto("/app/u/day-trader/playbooks");
    await expect(page).toHaveURL(/\/app\/research\?/);
    await expect(page).toHaveURL(/[?&]section=playbooks\b/);
    await expect(page).toHaveURL(/[?&]account=day-trader\b/);
    await expect(page.getByRole("heading", { level: 1, name: "Playbooks" })).toBeVisible();
  });

  test("renders a desk's pulse view", async ({ page }) => {
    await page.goto("/app/u/day-trader/pulse");
    await expect(page.getByRole("heading", { name: /pulse/ })).toBeVisible();
  });

  test("renders a bot desk's thesis view", async ({ page }) => {
    // Thesis is bots-only (DeskRail comment) — sauron carries a richer position set to render.
    await page.goto("/app/u/sauron/thesis");
    await expect(page.getByRole("heading", { name: /thesis/ })).toBeVisible();
  });
});
