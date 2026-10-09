import { expect, test } from "@playwright/test";

// The /u/$id/* any-account page (#3807 slice 2d) — live-data routes (offlineDataSource-backed),
// behavioral only per design decision 6. Uses real fixture participant ids
// (fixtures/offline/participants.json): day-trader/rumor-trader/sauron are bots, human-eric is the
// one human account. This suite's server runs with no auth, so the viewer owns nothing — every
// page here is "another member's account".
test.describe("the any-account page", () => {
  test("renders an account's overview under its own head", async ({ page }) => {
    await page.goto("/app/u/day-trader");
    await expect(page.getByRole("heading", { level: 1, name: /The Day Trader/ })).toBeVisible();
    const sections = page.getByRole("navigation", { name: "Sections" });
    for (const name of ["Overview", "Activity", "Pulse", "Heartbeat", "Thesis"]) {
      await expect(sections.getByRole("link", { name })).toBeVisible();
    }
    await expect(sections.getByRole("link", { name: "Settings" })).toHaveCount(0);
  });

  test("offers no write on an account the viewer does not own, and says so", async ({ page }) => {
    await page.goto("/app/u/sauron");
    await expect(page.getByText("You can trade only your own accounts")).toBeVisible();
    await expect(page.getByRole("main").getByRole("button", { name: /^Close/ })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /New trade/ })).toHaveCount(0);
    await expect(page.getByText("click a symbol for its fill timeline")).toHaveCount(0);
  });

  test("renders an account's heartbeat at the decisions route", async ({ page }) => {
    await page.goto("/app/u/day-trader/decisions");
    await expect(page.getByRole("heading", { name: "Heartbeat", exact: true })).toBeVisible();
  });

  test("renders an account's activity", async ({ page }) => {
    await page.goto("/app/u/sauron/activity");
    await expect(page.getByRole("heading", { name: "Activity", exact: true })).toBeVisible();
  });

  // The Playbook Store left the account page in #3625 (Eric, 2026-09-23: "the legacy route should
  // not have the playbook store view") — the route now only redirects to R&D → Playbooks with the
  // same account pre-selected in the "Subscribe as" rail.
  test("redirects an account's playbooks link to R&D → Playbooks", async ({ page }) => {
    await page.goto("/app/u/day-trader/playbooks");
    await expect(page).toHaveURL(/\/app\/research\?/);
    await expect(page).toHaveURL(/[?&]section=playbooks\b/);
    await expect(page).toHaveURL(/[?&]account=day-trader\b/);
    await expect(page.getByRole("heading", { level: 1, name: "Playbooks" })).toBeVisible();
  });

  test("renders an account's pulse", async ({ page }) => {
    await page.goto("/app/u/day-trader/pulse");
    await expect(page.getByRole("heading", { name: "Pulse", exact: true })).toBeVisible();
  });

  test("renders a bot's thesis", async ({ page }) => {
    // Thesis is bots-only (account-head.tsx) — sauron carries a richer position set to render.
    await page.goto("/app/u/sauron/thesis");
    await expect(page.getByRole("heading", { name: "Thesis", exact: true })).toBeVisible();
  });
});
