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

  test("renders a desk's playbook store", async ({ page }) => {
    await page.goto("/app/u/day-trader/playbooks");
    await expect(page.getByRole("heading", { name: /Playbook Store/ })).toBeVisible();
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
