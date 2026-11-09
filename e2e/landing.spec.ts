import { expect, test } from "@playwright/test";

// The landing page (#7077): sign-in opens the day's market news at /app/, not the Leaderboard.
// Slice 1d: the question box and its canned paths first (AT9 as revised), the whole market under it
// (#7018 round 3), then R&D's market calendar: its arrows and lens over one-line stories and events
// under week headers (AT10), with R&D's month grid beside them at desktop width (AT11).
// Behavioural only: the edition is the latest one checked in, and the server cuts its dated items
// against the real date, so the words change by design; the shape is what's held here.
test.describe("landing page", () => {
  // AT9 as revised (#7018 round 5) with AT1 and AT8: the question box and its two canned paths lead,
  // on one row each, and all 11 sectors and the S&P 500 still end above the 844px fold at 390, each
  // with its 20-day range mark and a whole figure (#7018 round 6's geometry: ~838px).
  test("opens on the question box, then all 11 sectors and the S&P 500 above the fold, each with its range mark", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/app/");
    await page.evaluate(() => window.localStorage.removeItem("skynet.landing.sector-look"));
    await page.reload();
    await expect(page).toHaveURL(/\/app\/$/);
    const rows = page.locator(".sectors-rows--lines > li");
    await expect(rows).toHaveCount(12);
    await expect(rows.first()).toContainText("S&P 500");
    // AT9: the question box leads the overview, one line, its canned paths on one row.
    const ask = page.getByLabel("What do you want to do today?");
    const before = await page
      .locator(".sectors")
      .evaluate(
        (s, a) => Boolean(a && s.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_PRECEDING),
        await ask.elementHandle(),
      );
    expect(before).toBe(true);
    const form = await page.locator(".ask-form").boundingBox();
    expect(form?.height ?? 0).toBeLessThanOrEqual(52);
    const chips = await page.locator(".ask-quick .ask-chip").all();
    const tops = await Promise.all(chips.map(async (c) => (await c.boundingBox())?.y ?? -1));
    expect(new Set(tops).size).toBe(1);
    for (const row of await rows.all()) {
      const box = await row.boundingBox();
      expect((box?.y ?? Number.POSITIVE_INFINITY) + (box?.height ?? 0)).toBeLessThanOrEqual(844);
      // AT8: the range mark replaced the ▲ ▼, and says where the close sits for a screen reader.
      await expect(row.locator(".sector-range")).toHaveAttribute("aria-label", /20-day range/);
      await expect(row.locator(".sector-glyph")).toHaveCount(0);
      const move = row.locator(".sector-move");
      const whole = await move.evaluate((el) => el.scrollWidth <= el.clientWidth + 1);
      expect(whole).toBe(true);
    }
    // Words only at the extremes, and only those words.
    const extremes = page.locator(
      ".sectors-rows .sector-range--above, .sectors-rows .sector-range--below",
    );
    const words = page.locator(".sectors-rows .sector-range-word");
    await expect(words).toHaveCount(await extremes.count());
    for (const w of await words.allInnerTexts())
      expect(w).toMatch(/^(above|below) its usual range$/);
    // AT12: each row reads name · its fund's ticker beside it · the move · the range mark.
    const first = rows.first();
    const x = async (sel: string) => (await first.locator(sel).boundingBox())?.x ?? -1;
    const [name, fund, move, mark] = [
      await x(".sector-name"),
      await x(".sector-fund"),
      await x(".sector-move"),
      await x(".sector-range"),
    ];
    expect(name).toBeLessThan(fund);
    expect(fund).toBeLessThan(move);
    expect(move).toBeLessThan(mark);
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

  test("draws the same numbers as Lines or Tiles, Lines first, and keeps the last view (AT3)", async ({
    page,
  }) => {
    await page.goto("/app/");
    await page.evaluate(() => window.localStorage.setItem("skynet.landing.sector-look", "bars"));
    await page.reload();
    // Bars are gone (AT3 revised): a member who had picked them opens on Lines.
    await expect(page.locator(".sectors-rows--lines")).toBeVisible();
    const viewGroup = page.getByRole("group", { name: "View" });
    await expect(viewGroup.getByRole("button")).toHaveText(["Lines", "Tiles"]);
    await viewGroup.getByRole("button", { name: "Tiles" }).click();
    await expect(page.locator(".sectors-rows--tiles > li")).toHaveCount(12);
    // Down tiles hatched: never colour alone.
    const down = page.locator(".sector-tile--down").first();
    if ((await down.count()) > 0)
      expect(await down.evaluate((el) => getComputedStyle(el).backgroundImage)).toContain(
        "repeating-linear-gradient",
      );
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
    // AT5b: the days sit under week headers, and the weeks run down the page, never across.
    const weeks = cal.locator(".ecal-week-title");
    expect(await weeks.count()).toBeGreaterThan(0);
    let lastY = -1;
    for (const w of await weeks.all()) {
      await expect(w).toHaveText(
        /^(.+ weeks? ago|Last week|This week|Next week|In \d+ weeks) · Mon \d+/,
      );
      const y = (await w.boundingBox())?.y ?? -1;
      expect(y).toBeGreaterThan(lastY);
      lastY = y;
    }
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

  // AT10: the calendar is R&D's — its head steps the range a week at a time at 390, Day · Week ·
  // Month offered and none fogged, and the rows below it still hold AT4, AT5 and AT5b.
  test("steps the calendar a week at a time with R&D's arrows, nothing fogged (AT10)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/app/");
    const cal = page.locator(".ecal");
    const lenses = cal.locator(".eh-lens");
    await expect(lenses).toHaveText(["Day", "Week", "Month"]);
    for (const lens of await lenses.all()) await expect(lens).toBeEnabled();
    await expect(cal.locator(".eh-fog")).toHaveCount(0);
    await expect(cal.getByRole("button", { name: "Week", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const range = cal.locator(".eh-range");
    const thisWeek = await range.innerText();
    await expect(range).toHaveText(/^[A-Z][a-z]{2} \d+ – [A-Z][a-z]{2} \d+$/);
    await cal.getByRole("button", { name: "Next week" }).click();
    await expect(range).not.toHaveText(thisWeek);
    await expect(page).toHaveURL(/[?&]on=\d{4}-\d{2}-\d{2}/);
    // The stories are the news, so they lead whichever week is in range; every line stays one line.
    await expect(cal.locator(".ecal-days > li").first().locator(".story").first()).toBeVisible();
    for (const line of await cal.locator(".ecal-line").all())
      expect((await line.boundingBox())?.height ?? 0).toBeLessThanOrEqual(40);
    await cal.getByRole("button", { name: "Previous week" }).click();
    await expect(range).toHaveText(thisWeek);
    // At 390 the rows are the whole calendar: no grid (AT11).
    await expect(cal.locator(".eh-grid")).toHaveCount(0);
  });

  // AT11: at desktop width R&D's month grid sits beside the rows, the range banded on it.
  test("adds R&D's month grid beside the rows at desktop width (AT11)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/app/");
    const cal = page.locator(".ecal");
    const grid = cal.locator(".ecal-grid .eh-grid");
    await expect(grid).toBeVisible();
    expect(await grid.locator(".eh-band").count()).toBeGreaterThan(0);
    const rows = await cal.locator(".ecal-agenda").boundingBox();
    const beside = await cal.locator(".ecal-grid").boundingBox();
    expect(beside?.x ?? 0).toBeGreaterThan((rows?.x ?? 0) + (rows?.width ?? 0) - 1);
    await expect(cal.locator(".ecal-grid .eh-legend")).toContainText("a story waits on it");
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
