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
    for (const name of ["Overview", "Activity", "Pulse", "Playbooks", "Thesis"]) {
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

  test("renders a bot's playbooks at its own address", async ({ page }) => {
    await page.goto("/app/u/day-trader/playbooks");
    await expect(page.getByRole("heading", { name: "Playbooks", exact: true })).toBeVisible();
    const sections = page.getByRole("navigation", { name: "Sections" });
    await expect(sections.getByRole("link", { name: "Playbooks" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  // #5073's IA call: the section's address follows its name. A saved Decisions/Heartbeat link was
  // asking for the bot's checks, so it lands on Playbooks with the check log open, its round kept.
  test("redirects a saved decisions link to Playbooks with the check log open", async ({
    page,
  }) => {
    await page.goto("/app/u/day-trader/decisions#cycle-1");
    await expect(page).toHaveURL(/\/app\/u\/day-trader\/playbooks\?checks=open#cycle-1$/);
    await expect(page.getByRole("heading", { name: "Playbooks", exact: true })).toBeVisible();
  });

  test("renders an account's activity", async ({ page }) => {
    await page.goto("/app/u/sauron/activity");
    await expect(page.getByRole("heading", { name: "Activity", exact: true })).toBeVisible();
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
