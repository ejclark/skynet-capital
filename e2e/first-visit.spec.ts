import { expect, type Page, test } from "@playwright/test";

// A member's first visit to Mission Control (#7487 slice 7; the handoff's README § Interactions
// "First visit"). The offline server is fully open, so no session names a member; each test answers
// the onboarding read as a new member would see it — signed in (a `viewerId`), no account, nothing
// said to Moneypenny yet — and leaves every other read to the offline server's fixture data. The
// welcome is hers on that first visit only; the tour opens one window per step with the Eye on one
// real row; the goal is collected in the dock's box and pinned as the first row of Quests.

async function asNewMember(page: Page, viewerId = "e2e-first-visit"): Promise<void> {
  await page.route("**/api/onboarding", async (route) => {
    const res = await route.fetch();
    const body = (await res.json()) as {
      account?: unknown;
      steps: { id: string; done: boolean }[];
    };
    const { account: _account, ...rest } = body;
    await route.fulfill({
      response: res,
      json: { ...rest, viewerId, steps: body.steps.map((s) => ({ ...s, done: false })) },
    });
  });
}

const dock = (page: Page) => page.locator(".mp-dock");
const latest = (page: Page) => page.locator(".mp-dock-latest");
const move = (page: Page, name: string) =>
  dock(page).getByRole("list", { name: "Your moves" }).getByRole("button", { name });

test.describe("a member's first visit", () => {
  test("welcomes a new member, tours one window per step with the Eye on a row, and never again", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await asNewMember(page);
    await page.goto("/app/");
    await expect(latest(page)).toHaveText(
      "welcome. how would you like to start? play money, real markets, nothing at risk.",
    );
    for (const name of ["Walk me through it", "First step", "I have a goal"])
      await expect(move(page, name)).toBeVisible();

    await move(page, "Walk me through it").click();
    await expect(page).toHaveURL(/\/app\/\?w=market$/);
    await expect(latest(page)).toContainText("this is the whole market");
    // The Eye holds one sector row, and says why in words.
    await expect(page.locator(".eye-ring-label")).toContainText("led the week");
    await expect(
      page.locator("li.sector-line-row[data-eye-lit], li.sector-tile[data-eye-lit]"),
    ).toHaveCount(1);
    await expect(move(page, "That's enough")).toBeVisible();

    await move(page, "Next ›").click();
    await expect(page).toHaveURL(/\/app\/\?w=calendar$/);
    await expect(latest(page)).toContainText("the calendar");

    await move(page, "Next ›").click();
    await expect(page).toHaveURL(/\/app\/\?w=quests$/);
    await expect(page.locator(".eye-ring-label")).toContainText("start here");
    await expect(page.locator("#quest-connect")).toHaveAttribute("data-eye-lit", "");

    await move(page, "Next ›").click();
    await expect(page).toHaveURL(/\/app\/\?w=party$/);
    await expect(latest(page)).toContainText("against The Tower");

    await move(page, "One last thing ›").click();
    await expect(latest(page)).toContainText("tap ✎ on any window");
    await expect(move(page, "Set a goal")).toBeVisible();

    // A returning member — the same one, back again — never sees the welcome.
    await page.goto("/app/");
    await expect(latest(page)).not.toContainText("welcome.");
    await page.reload();
    await expect(latest(page)).toContainText("tap ✎ on any window");
  });

  test("collects a goal in the box and pins it as the first row of Quests, set today", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await asNewMember(page, "e2e-first-visit-goal");
    await page.goto("/app/");
    await expect(latest(page)).toContainText("welcome.");
    await move(page, "I have a goal").click();
    const box = dock(page).getByRole("textbox", { name: "Message Moneypenny" });
    await expect(box).toHaveAttribute("placeholder", "Your goal, in your own words");
    await expect(box).toBeFocused();
    await expect(latest(page)).toContainText("say it in your own words");
    await box.fill("Get comfortable with covered calls");
    await box.press("Enter");
    await expect(latest(page)).toContainText("pinned at the top of Quests");
    await expect(box).toHaveAttribute("placeholder", "Ask, or say where to go");

    await page.goto("/app/?w=quests");
    const first = page.locator("section.mctl-window .mctl-rows li").first();
    await expect(first).toContainText("Your goal");
    await expect(first).toContainText("“Get comfortable with covered calls”");
    await expect(first.locator(".mctl-row-tag")).toHaveText("set today");

    await first.getByRole("button", { name: "Clear your goal" }).click();
    await expect(page.locator("section.mctl-window .mctl-rows li").first()).toContainText(
      "Set a goal",
    );
  });

  test("a signed-out viewer never gets the welcome", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/app/");
    await expect(page.locator("h1.mctl-window-title")).toBeVisible();
    await expect(latest(page)).not.toContainText("welcome.");
    await expect(move(page, "Walk me through it")).toHaveCount(0);
  });
});
