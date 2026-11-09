import { expect, test } from "@playwright/test";

// The landing page (#7077): sign-in opens the day's market news at /app/, not the Leaderboard.
// Round 3 (#7018, slice 1b): the whole market first, then a calendar of one-line stories and events.
// Behavioural only: the edition is the latest one checked in, and the server cuts its dated items
// against the real date, so the words change by design; the shape is what's held here.
test.describe("landing page", () => {
  // Round 3's AT1 (#7018): the question box, then the whole market — all 11 sectors and the S&P 500,
  // each with a shape and a whole figure — on the first 390×844 screen.
  test("opens on the member's question, then all 11 sectors and the S&P 500 above the fold", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/app/");
    await page.evaluate(() => window.localStorage.removeItem("skynet.landing.sector-look"));
    await page.reload();
    await expect(page).toHaveURL(/\/app\/$/);
    await expect(page.getByLabel("What do you want to do today?")).toBeInViewport();
    const rows = page.locator(".sectors-rows--bars > li");
    await expect(rows).toHaveCount(12);
    await expect(rows.first()).toContainText("S&P 500");
    for (const row of await rows.all()) {
      const box = await row.boundingBox();
      expect((box?.y ?? Number.POSITIVE_INFINITY) + (box?.height ?? 0)).toBeLessThanOrEqual(844);
      await expect(row.locator(".sector-glyph")).toHaveText(/^[▲▼▬]$/);
      const move = row.locator(".sector-move");
      const whole = await move.evaluate((el) => el.scrollWidth <= el.clientWidth + 1);
      expect(whole).toBe(true);
    }
  });

  test("redraws every move for the period chosen, Week first (AT2)", async ({ page }) => {
    await page.goto("/app/");
    const period = page.getByRole("group", { name: "Period" });
    await expect(period.getByRole("button", { name: "Week" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const figures = () => page.locator(".sectors-rows .sector-move").allInnerTexts();
    const week = await figures();
    const since = await page.locator(".sectors-since").innerText();
    await period.getByRole("button", { name: "YTD" }).click();
    await expect(page.locator(".sectors-since")).not.toHaveText(since);
    expect(await figures()).not.toEqual(week);
  });

  test("draws the same numbers as Bars, Lines or Tiles, and keeps the last view (AT3)", async ({
    page,
  }) => {
    await page.goto("/app/");
    await page.evaluate(() => window.localStorage.removeItem("skynet.landing.sector-look"));
    await page.reload();
    await expect(page.locator(".sectors-rows--bars")).toBeVisible();
    // Down bars hatched, up bars solid: never colour alone.
    const down = page.locator(".sector-bar--down").first();
    expect(await down.evaluate((el) => getComputedStyle(el).backgroundImage)).toContain(
      "repeating-linear-gradient",
    );
    const up = page.locator(".sector-bar--up").first();
    if ((await up.count()) > 0)
      expect(await up.evaluate((el) => getComputedStyle(el).backgroundImage)).toBe("none");
    const viewGroup = page.getByRole("group", { name: "View" });
    await viewGroup.getByRole("button", { name: "Tiles" }).click();
    await expect(page.locator(".sectors-rows--tiles > li")).toHaveCount(12);
    await page.reload();
    await expect(page.locator(".sectors-rows--tiles")).toBeVisible();
    await viewGroup.getByRole("button", { name: "Lines" }).click();
    await expect(page.locator(".sectors-rows--lines > li")).toHaveCount(12);
  });

  // AT4 and AT5: below the sectors, the week's stories, then the coming days' events, each one line
  // at 390 with its number whole, closed until tapped.
  test("puts every story and event on one line, closed until tapped (AT4, AT5)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/app/");
    const sectors = page.locator(".sectors");
    const cal = page.locator(".ecal");
    const below = await sectors.evaluate(
      (s, c) => Boolean(c && s.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING),
      await cal.elementHandle(),
    );
    expect(below).toBe(true);
    await expect(cal.locator(".ecal-key")).toContainText("◆");
    const days = cal.locator(".ecal-days > li");
    await expect(days.first().locator(".story").first()).toBeVisible();
    const lines = cal.locator(".ecal-line");
    expect(await lines.count()).toBeGreaterThan(0);
    for (const line of await lines.all()) {
      const box = await line.boundingBox();
      expect(box?.height ?? 0).toBeLessThanOrEqual(40);
      const figure = line.locator(".ecal-figure");
      if ((await figure.count()) > 0) {
        const whole = await figure.evaluate((el) => el.scrollWidth <= el.clientWidth + 1);
        expect(whole).toBe(true);
        const right = (await figure.boundingBox())?.x ?? 0;
        expect(right).toBeLessThan(390);
      }
    }
    for (const story of await cal.locator(".story > .story-row").all())
      await expect(story).not.toHaveAttribute("open", "");
    const lead = page.locator(".story--lead > .story-row");
    await lead.locator(":scope > summary").click();
    await expect(lead.locator(".story-reports")).toBeVisible();
    const more = lead.locator(".story-body > .story-more");
    await expect(more.locator(".story-lines")).toBeHidden();
    await more.getByText("More on this story").click();
    await expect(more.locator(".story-lines")).toBeVisible();
    // Every line wears its mark as a word, never a colour alone.
    await expect(more.locator(".story-lines .story-mark").first()).toHaveText(/\w/);
  });

  test("offers at most two quick questions under the member's own (criterion 2)", async ({
    page,
  }) => {
    await page.goto("/app/");
    const quick = page.getByRole("list", { name: "Quick questions" }).getByRole("button");
    await expect(quick.first()).toBeVisible();
    expect(await quick.count()).toBeLessThanOrEqual(2);
  });

  test("answers a story's hunch with the record, never a buy call (criteria 5, 7)", async ({
    page,
  }) => {
    await page.goto("/app/");
    await page.locator(".story--lead > .story-row > summary").click();
    const ask = page.locator(".story--lead .story-ask");
    await expect(ask.getByText("Ask your own")).toBeVisible();
    const record = ask.locator(".story-record");
    await expect(record).toBeHidden();
    await ask.getByText("Is this a chance to buy?").click();
    await expect(record).toBeVisible();
    await expect(record.locator(".story-record-coda")).toContainText("Nothing here calls it a buy");
  });

  test("gives Chronicles the first tab, and the Leaderboard leaves the bar for Profile's card", async ({
    page,
  }) => {
    await page.goto("/app/");
    const nav = page.locator("nav.topnav");
    await expect(nav.getByRole("link", { name: "Chronicles", exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(nav.getByRole("link", { name: "Leaderboard" })).toHaveCount(0);
    await page.goto("/app/leaderboard");
    await expect(page.getByRole("heading", { name: "Leaderboard" })).toBeVisible();
  });
});
