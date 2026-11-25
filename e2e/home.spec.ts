import { expect, test } from "@playwright/test";

// The home screen (#8189, #8161 stage 2 slice 1) against the real server. `/app/` is the home: the
// tower, "Needs you", one tile per app. Campaign is one app at `/app/campaign`, and every old
// Campaign address forwards there with its search and hash; the board's `?by=` still opens the board.

test.describe("the home screen", () => {
  test("at 390: the tower's still, Needs you, then the tiles, all above the dock (criteria 1, 3, 4)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/app/");
    await expect(page).toHaveURL(/\/app\/$/);
    await expect(page.getByRole("heading", { level: 1, name: "Home" })).toBeAttached();
    const tower = page.locator(".home-tower");
    // A phone gets the committed still and no WebGL frame.
    await expect(tower.locator("img.home-tower-still")).toBeVisible();
    await expect(tower).toHaveAttribute("aria-hidden", "true");
    await expect(page.locator("iframe.vantage")).toHaveCount(0);
    expect((await tower.boundingBox())?.height ?? 999).toBeLessThanOrEqual(200);
    const needs = page.getByRole("region", { name: "Needs you" });
    await expect(needs).toBeVisible();
    const apps = page.getByRole("navigation", { name: "Apps" }).getByRole("link");
    await expect(apps).toHaveCount(7);
    // By position, so the order holds too, and a word in another tile's line can't match.
    for (const [i, [, href]] of [
      ["Campaign", "/app/campaign"],
      ["Profile", "/app/accounts"],
      ["Trade", "/app/trade"],
      ["Activity", "/app/activity"],
      ["R&D", "/app/research"],
      ["Bots", "/app/bots"],
      // #8253: the Scoreboard's tile opens the board whether or not the viewer has a seat yet.
      ["Scoreboard", "/app/leaderboard?by=equity"],
    ].entries())
      await expect(apps.nth(i)).toHaveAttribute("href", href);
    // In order, and "Needs you" plus the first row of tiles clear the dock's top edge.
    const towerBox = await tower.boundingBox();
    const needsBox = await needs.boundingBox();
    const firstTile = await apps.nth(1).boundingBox();
    const dock = await page.locator(".mp-dock").boundingBox();
    expect(towerBox && needsBox && firstTile && dock).toBeTruthy();
    if (!(towerBox && needsBox && firstTile && dock)) return;
    expect(towerBox.y).toBeLessThan(needsBox.y);
    expect(needsBox.y + needsBox.height).toBeLessThanOrEqual(firstTile.y);
    expect(firstTile.y + firstTile.height).toBeLessThanOrEqual(dock.y);
  });

  test("from 861px the session's one tower frame lays over the home's box (criterion 3)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto("/app/");
    await expect(page.locator(".home-tower [data-tower-slot]")).toBeAttached();
    await expect(page.locator("iframe.vantage")).toHaveAttribute("data-shown", "true");
  });

  test("the brand is the way home, and the Campaign tab opens /campaign", async ({ page }) => {
    await page.goto("/app/research");
    const nav = page.locator("nav.topnav");
    await nav.getByRole("link", { name: "Campaign", exact: true }).click();
    await expect(page).toHaveURL(/\/app\/campaign$/);
    await expect(nav.getByRole("link", { name: "Campaign", exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await page.getByRole("link", { name: "Home", exact: true }).click();
    await expect(page).toHaveURL(/\/app\/$/);
    await expect(page.getByRole("navigation", { name: "Apps" })).toBeVisible();
  });

  test("old Campaign addresses land on /campaign; the board's ask still opens the board (criterion 8)", async ({
    page,
  }) => {
    await page.goto("/app/?w=market");
    await expect(page).toHaveURL(/\/app\/campaign\?w=market$/);
    await expect(page.locator("h1.mctl-window-title")).toHaveText("The whole market");
    await page.goto("/app/#calendar");
    await expect(page).toHaveURL(/\/app\/campaign/);
    expect(new URL(page.url()).hash).toBe("#calendar");
    await page.goto("/app/?by=return");
    await expect(page).toHaveURL(/\/app\/leaderboard\?/);
  });
});

// #8189 slice 2: the tower leaves every other page, and a fresh load at `/app/` reopens the last app.
test.describe("the tower only on the home (criterion 2)", () => {
  const PAGES = [
    "/app/campaign",
    "/app/accounts",
    "/app/accounts?section=milestones",
    "/app/trade",
    "/app/activity",
    "/app/research",
    "/app/leaderboard",
    "/app/u/sauron",
    "/app/saved-positions",
    "/app/settings",
  ];
  for (const width of [390, 1024, 1600]) {
    test(`draws no tower on any other page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const path of PAGES) {
        await page.goto(path);
        await expect(page.locator("#main")).toBeVisible();
        await expect(page.locator("[data-tower-slot]"), path).toHaveCount(0);
        await expect(page.locator(".tower-column"), path).toHaveCount(0);
        await expect(page.locator(".char-card iframe"), path).toHaveCount(0);
        await expect(page.locator('iframe.vantage[data-shown="true"]'), path).toHaveCount(0);
      }
    });
  }
});

test("keeps the stage's left edge and width identical across pages at 1280 (criterion 12)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  // Layout boxes, not painted ones: a page's entrance animation scales its stage for a moment, and
  // a page that reads first (an account's) swaps its loading frame for the real one, so each page
  // is polled until its stage settles.
  const stageBox = () =>
    page
      .locator("main.stage")
      .first()
      .evaluate((el: HTMLElement) => ({ x: el.offsetLeft, width: el.offsetWidth }));
  await page.goto("/app/accounts");
  await expect(page.locator(".cockpit")).toBeVisible();
  const first = await stageBox();
  expect(first.width).toBeGreaterThan(1000);
  for (const path of ["/app/activity", "/app/research", "/app/trade", "/app/u/sauron"]) {
    await page.goto(path);
    await expect.poll(stageBox, { message: path }).toEqual(first);
  }
});

test("a fresh load at /app/ reopens the last app's root; a Home tap shows the home (criterion 7)", async ({
  page,
}) => {
  await page.goto("/app/research");
  await expect(page.locator("#main")).toBeVisible();
  await page.goto("/app/");
  await expect(page).toHaveURL(/\/app\/research$/);
  await page.getByRole("link", { name: "Home", exact: true }).click();
  await expect(page).toHaveURL(/\/app\/$/);
  await expect(page.getByRole("navigation", { name: "Apps" })).toBeVisible();
  // The home is now the last place used, so a reload stays on it.
  await page.reload();
  await expect(page).toHaveURL(/\/app\/$/);
  await expect(page.getByRole("navigation", { name: "Apps" })).toBeVisible();
});
