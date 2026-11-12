import { expect, test } from "@playwright/test";

// The landing page (#7077): sign-in opens the day's market news at /app/, not the Leaderboard.
// Slice 1d: the question box and its canned paths first (AT9 as revised), the whole market under it
// (#7018 round 3), then R&D's market calendar: its arrows and lens over one-line stories and events
// under week headers (AT10), with R&D's month grid beside them at desktop width (AT11).
// Behavioural only: the edition is the latest one checked in, and the server cuts its dated items
// against the real date, so the words change by design; the shape is what's held here.
// #7487 slice 1 (Campaign mission control): the page is now one window at a time, chosen by `?w=`
// (Overview the default, never written). The quick questions lead Overview at /app/; the sectors are the
// Market window (`?w=market`), the calendar the Calendar window (`?w=calendar`) and the account's
// quests the Quests window (`?w=quests`). Each test opens the window its part now lives in.
test.describe("landing page", () => {
  // AT9 as revised (#7018 round 5), then #7487 slice 2 (D6): the member's own question moved to the
  // dock's box, the one text box Moneypenny reads, so Overview at /app/ leads with the canned paths
  // alone, on one row, ahead of "Your next step", and the dock's one-line box sits under the page.
  test("opens on the quick questions, one row, with the dock's box under the page (AT9)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/app/");
    await expect(page).toHaveURL(/\/app\/$/);
    const quick = page.locator(".mctl-window .ask-quick");
    await expect(quick).toBeVisible();
    const before = await page
      .locator(".mctl-window .mctl-rows")
      .first()
      .evaluate(
        (r, a) => Boolean(a && r.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_PRECEDING),
        await quick.elementHandle(),
      );
    expect(before).toBe(true);
    // No text box on Overview any more: the member types in the dock.
    await expect(page.locator(".mctl-window input, .mctl-window textarea")).toHaveCount(0);
    const chips = await quick.locator(".ask-chip").all();
    expect(chips.length).toBeGreaterThan(0);
    const tops = await Promise.all(chips.map(async (c) => (await c.boundingBox())?.y ?? -1));
    expect(new Set(tops).size).toBe(1);
    const box = page.locator(".mp-dock").getByRole("textbox", { name: "Message Moneypenny" });
    await expect(box).toBeVisible();
    expect((await box.boundingBox())?.height ?? 0).toBeLessThanOrEqual(52);
  });

  // AT1 and AT8: all 11 sectors and the S&P 500 still end within an 844px screen of the Market
  // window's top at 390, each with its 20-day range mark and a whole figure (#7018 round 6's
  // geometry: ~838px). The trail now sits above the window, so the fold is measured from the window.
  test("opens the Market window on all 11 sectors and the S&P 500 within one screen, each with its range mark", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/app/?w=market");
    await page.evaluate(() => window.localStorage.removeItem("skynet.landing.sector-look"));
    await page.reload();
    await expect(page).toHaveURL(/\/app\/\?w=market$/);
    const rows = page.locator(".sectors-rows--lines > li");
    await expect(rows).toHaveCount(12);
    await expect(rows.first()).toContainText("S&P 500");
    const top = (await page.locator("section.mctl-window").boundingBox())?.y ?? 0;
    for (const row of await rows.all()) {
      const box = await row.boundingBox();
      expect((box?.y ?? Number.POSITIVE_INFINITY) + (box?.height ?? 0) - top).toBeLessThanOrEqual(
        844,
      );
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
    await page.goto("/app/?w=market");
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
    await page.goto("/app/?w=market");
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

  // AT4 and AT5: the Calendar window holds the week's stories, then the coming days' events, each
  // one line at 390 with its number whole, closed until tapped. (Before #7487 the calendar sat below
  // the sectors on one page; now each is its own window, so the calendar shows without the sectors.)
  test("puts every story and event on one line, closed until tapped (AT4, AT5)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/app/?w=calendar");
    const cal = page.locator(".mctl-window .ecal");
    await expect(cal).toBeVisible();
    await expect(page.locator(".sectors")).toHaveCount(0);
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
    await page.goto("/app/?w=calendar");
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
    await page.goto("/app/?w=calendar");
    const cal = page.locator(".ecal");
    const grid = cal.locator(".ecal-grid .eh-grid");
    await expect(grid).toBeVisible();
    expect(await grid.locator(".eh-band").count()).toBeGreaterThan(0);
    const rows = await cal.locator(".ecal-agenda").boundingBox();
    const beside = await cal.locator(".ecal-grid").boundingBox();
    expect(beside?.x ?? 0).toBeGreaterThan((rows?.x ?? 0) + (rows?.width ?? 0) - 1);
    await expect(cal.locator(".ecal-grid .eh-legend")).toContainText("a story waits on it");
  });

  // AT12's wide chart (#7018 round 8 Q4 B): at desktop width each Lines row's range mark widens into
  // its 20 closes over time, the band shaded behind and a dot at the last close; the two dates sit
  // once, over the column. At 390 the small mark stays (the first test holds that).
  test("draws each row's 20 closes inside its band at desktop width, the dates at the ends (AT12)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/app/?w=market");
    await page.evaluate(() => window.localStorage.removeItem("skynet.landing.sector-look"));
    await page.reload();
    const rows = page.locator(".sectors-rows--lines > li");
    await expect(rows).toHaveCount(12);
    await expect(page.locator(".sectors-rows .sector-range")).toHaveCount(0);
    for (const row of await rows.all()) {
      const trail = row.locator(".sector-trail");
      await expect(trail).toHaveAttribute("aria-label", /20-day range .*last 20 closes/);
      const points = await trail.locator("polyline").getAttribute("points");
      expect(points?.trim().split(/\s+/)).toHaveLength(20);
      await expect(trail.locator(".sector-trail-band")).toHaveCount(1);
      await expect(trail.locator(".sector-trail-dot")).toBeVisible();
      // The room on the right goes to the chart: wider than the name's column at 1280. (A fixed
      // 200px held before #7487; the Waypoints rail now takes ~234px of the 1280, so the chart is
      // measured against the name's column it sits beside, as the line above always said.)
      const name = (await row.locator(".sector-name").boundingBox())?.width ?? 0;
      expect((await trail.boundingBox())?.width ?? 0).toBeGreaterThan(name);
    }
    const ends = page.locator(".sectors-axis-ends > span");
    await expect(ends).toHaveCount(2);
    for (const end of await ends.all()) await expect(end).toHaveText(/\w{3}, \w{3} \d{1,2}/);
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
    await page.goto("/app/?w=calendar");
    await page.locator(".story--lead > .story-row > summary").click();
    const ask = page.locator(".story--lead .story-ask");
    await expect(ask.getByText("Ask your own")).toBeVisible();
    const record = ask.locator(".story-record");
    await expect(record).toBeHidden();
    await ask.getByText("Is this a chance to buy?").click();
    await expect(record).toBeVisible();
    await expect(record.locator(".story-record-coda")).toContainText("Nothing here calls it a buy");
  });

  // Slice 3 (#7028 slice 5): quests sit by their source. The offline server owns no signed-in
  // account, so `/api/quests` answers 404 and the page draws none; this test answers it with one
  // market quest on the lead story's first name and four account quests, ranked as the route ranks.
  // Since #7487 the account's quests are the Quests window and the story's quest is in the Calendar.
  test("puts a market quest under its story and the account's quests in their own window, 3 shown (slice 3)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const edition = (await (await page.request.get("/api/edition")).json()) as {
      edition: { stories: { symbols: string[] }[] };
    };
    const symbol = edition.edition.stories[0]?.symbols[0] ?? "SPY";
    const base = {
      why: [{ rule: "r", text: "The rule that produced it." }],
      baseRate: { kind: "untested", note: "No study has tested this yet." },
      exits: [],
      expires: { date: "2026-12-19", why: "the call expires" },
      houseCall: "take",
      confidence: "medium",
      atOpen: false,
    };
    const move = (label: string, sym: string) => ({
      kind: "sell-to-close",
      label,
      symbol: sym,
      href: `/app/trade?desk=me&symbol=${sym}`,
    });
    const quests = [
      {
        ...base,
        id: "e1",
        source: "event",
        move: move(`Sell a cash-secured put on ${symbol}`, symbol),
      },
      ...["A", "B", "C", "D"].map((n) => ({
        ...base,
        id: `p${n}`,
        source: "position",
        move: move(`Sell your 1 ${n} call`, "XYZ"),
      })),
    ];
    await page.route("**/api/quests", (route) =>
      route.fulfill({
        json: { available: true, asOf: "2026-11-09T12:00:00Z", quests, unread: [] },
      }),
    );
    await page.goto("/app/?w=quests");
    const part = page.locator(".mctl-window section.quests");
    // The section's own heading is visually hidden inside the window, but still names it.
    await expect(part.getByRole("heading", { name: "Your quests" })).toBeAttached();
    // Apart from the news: the Quests window holds no calendar.
    await expect(page.locator(".ecal")).toHaveCount(0);
    await expect(part.locator(":scope > .quest-list > .quest")).toHaveCount(3);
    await expect(part.locator(".quest-rest > summary")).toHaveText("1 more quest");
    for (const line of await part.locator(".quest-line").all())
      expect((await line.boundingBox())?.height ?? 0).toBeLessThanOrEqual(44);
    await part.scrollIntoViewIfNeeded();
    await part.screenshot({ path: "test-results/landing-quests-390.jpg", quality: 85 });
    // The market quest sits inside the lead story, closed until tapped, opening on a draft ticket.
    await page.goto("/app/?w=calendar");
    await page.locator(".story--lead > .story-row > summary").click();
    const inStory = page.locator(".story--lead .story-quests");
    await expect(inStory.locator(".quest-label")).toHaveText(
      `Sell a cash-secured put on ${symbol}`,
    );
    // The symbol is never cut: the label takes a second line instead of an ellipsis.
    const whole = await inStory
      .locator(".quest-label")
      .evaluate((el) => el.scrollHeight <= el.clientHeight + 1);
    expect(whole).toBe(true);
    await inStory.locator(".quest-line").click();
    await expect(inStory.locator("a.quest-open")).toHaveAttribute("href", /\/app\/trade\?/);
    await expect(inStory).toContainText("Untested");
    await inStory.screenshot({ path: "test-results/landing-story-quest-390.jpg", quality: 85 });
  });

  test("gives Campaign the first tab, and the Leaderboard leaves the bar for Profile's card", async ({
    page,
  }) => {
    await page.goto("/app/");
    const nav = page.locator("nav.topnav");
    await expect(nav.getByRole("link", { name: "Campaign", exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(nav.getByRole("link", { name: "Leaderboard" })).toHaveCount(0);
    await page.goto("/app/leaderboard");
    await expect(page.getByRole("heading", { name: "Leaderboard" })).toBeVisible();
  });
});

// #7487 slice 1: Campaign mission control. One window at a time, `?w=` names it (Overview the
// default, never written), the trail lists the windows reached this session, and the waypoints
// rail sits beside the window from 861px.
test.describe("campaign mission control", () => {
  test("opens on Overview: the trail, your next step and every window at a glance", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/app/");
    const win = page.locator("section.mctl-window");
    await expect(win).toHaveCount(1);
    await expect(win.locator("h1.mctl-window-title")).toHaveText("Where things stand");
    const trail = page.getByRole("navigation", { name: "Windows opened this session" });
    const pills = trail.locator(".mctl-trail-pill");
    await expect(pills).toHaveCount(1);
    await expect(pills.first()).toContainText("Overview");
    await expect(pills.first()).toHaveAttribute("aria-current", "page");
    await expect(win.getByRole("heading", { name: "Your next step" })).toBeVisible();
    await expect(win.getByRole("heading", { name: "At a glance" })).toBeVisible();
    const glance = win.locator(".mctl-rows").nth(1).locator("button.mctl-row");
    await expect(glance.locator(".mctl-row-title")).toHaveText([
      "The whole market",
      "The calendar",
      "Quests",
      "The party",
    ]);
  });

  test("opens a window from its row: the address gains ?w= and the trail both pills", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/app/");
    await page.locator("section.mctl-window button.mctl-row", { hasText: "The calendar" }).click();
    await expect(page).toHaveURL(/\/app\/\?w=calendar$/);
    await expect(page.locator("h1.mctl-window-title")).toHaveText("The calendar");
    await expect(page.locator(".mctl-window .ecal")).toBeVisible();
    const pills = page
      .getByRole("navigation", { name: "Windows opened this session" })
      .locator(".mctl-trail-pill");
    await expect(pills).toHaveCount(2);
    await expect(pills.nth(0)).toContainText("Overview");
    await expect(pills.nth(0)).not.toHaveAttribute("aria-current", "page");
    await expect(pills.nth(1)).toContainText("Calendar");
    await expect(pills.nth(1)).toHaveAttribute("aria-current", "page");
    // The trail is Back: its Overview pill returns, and Overview is never written to the address.
    await pills.nth(0).click();
    await expect(page).toHaveURL(/\/app\/$/);
    await expect(page.locator("h1.mctl-window-title")).toHaveText("Where things stand");
  });

  test("opens the Calendar window when the address points at one of its events", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    // A real key from the fixture edition: the first event row the calendar draws this week.
    await page.goto("/app/?w=calendar");
    const event = page.locator(".ecal li.ecal-event[id^='event-']").first();
    await expect(event).toBeAttached();
    const id = await event.getAttribute("id");
    expect(id).toMatch(/^event-\d{4}-\d{2}-\d{2}/);
    await page.goto("about:blank");
    await page.goto(`/app/#${id}`);
    await expect(page.locator("h1.mctl-window-title")).toHaveText("The calendar");
    await expect(page.locator(`[id="${id}"]`)).toBeAttached();
    // The inferred window is written into the address (replace, hash kept), so stepping the
    // calendar's range or clearing a pivot never snaps the member back to Overview.
    await expect(page).toHaveURL(/[?&]w=calendar/);
    expect(new URL(page.url()).hash).toBe(`#${id}`);
  });

  test("shows the Waypoints rail at 1280 and hides it at 390", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/app/");
    const rail = page.getByRole("navigation", { name: "Waypoints" });
    await expect(rail).toBeVisible();
    // The five waypoints and the workbench's Trade (slice 6).
    await expect(rail.locator(".mctl-way")).toHaveCount(6);
    await expect(rail.locator(".mctl-way[aria-current='page']")).toContainText("Overview");
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(rail).toBeHidden();
  });

  // Slice 3: ✎ tags a window or a row onto the dock's prompt; Escape in the dock drops every tag.
  test("tags a window and an opened event onto the dock's box with ✎, and Escape clears them", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/app/?w=market");
    const box = page.getByRole("textbox", { name: "Message Moneypenny" });
    const tags = page.getByRole("list", { name: "Your moves" }).locator("li.mp-tag");
    await page
      .locator("header.mctl-window-head")
      .getByRole("button", { name: /^Ask or say something about Market/ })
      .click();
    await expect(box).toBeFocused();
    await expect(tags).toHaveCount(1);
    await expect(tags.first()).toHaveText(/✎\s*Market/);
    await page
      .getByRole("navigation", { name: "Linked windows" })
      .getByRole("button", { name: /Calendar/ })
      .click();
    await expect(page.locator("h1.mctl-window-title")).toHaveText("The calendar");
    const event = page.locator(".ecal li.ecal-event").first();
    await event.locator("summary.ecal-line").click();
    await event.locator("button.tag-mark--inline").click();
    await expect(tags).toHaveCount(2);
    await expect(tags.nth(1)).toContainText("Calendar · ");
    await box.press("Escape");
    await expect(tags).toHaveCount(0);
  });

  // Slice 6: the Trade window drafts a paper ticket from real lists and places nothing; "Review
  // order" opens /trade with the draft, where the gate reviews it. The draft outlives the window.
  test("drafts a paper ticket in the Trade window and hands it to the gate on /trade", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/app/");
    await page
      .getByRole("navigation", { name: "Linked windows" })
      .getByRole("button", { name: /Trade/ })
      .click();
    await expect(page).toHaveURL(/\/app\/\?w=trade$/);
    const win = page.locator("section.mctl-window");
    await expect(win.locator("h1.mctl-window-title")).toHaveText("Trade");
    await expect(win.getByText("PAPER · DRAFT", { exact: true })).toBeVisible();
    // The dock's box stays the page's only text box: names are picked, never typed.
    await expect(win.locator("input, textarea")).toHaveCount(0);
    const review = win.getByRole("button", { name: "Review order" });
    await expect(review).toBeDisabled();
    await expect(win.locator(".mctl-trade-line")).toHaveText("Buy 1 — · market · day");
    const name = win.getByRole("group", { name: "Symbol" }).locator(".mctl-seg-btn").first();
    await expect(name).toBeVisible();
    const symbol = (await name.textContent())?.trim() ?? "";
    expect(symbol).toMatch(/^[A-Z.]{1,6}$/);
    await name.click();
    await expect(name).toHaveAttribute("aria-pressed", "true");
    await win.getByRole("button", { name: "One share more" }).click();
    await win.getByRole("button", { name: "Limit" }).click();
    await expect(win.locator(".mctl-trade-line")).toHaveText(`Buy 2 ${symbol} · limit · GTC`);
    // Every segment is a whole 44px target at 390.
    for (const seg of await win.locator(".mctl-seg-btn").all())
      expect((await seg.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
    // The draft survives a trip to another window, and Overview offers the way back to it.
    await page
      .getByRole("navigation", { name: "Windows opened this session" })
      .getByRole("button", { name: /Overview/ })
      .click();
    const back = page.locator("section.mctl-window button.mctl-row", {
      hasText: "Your draft ticket",
    });
    await expect(back).toContainText(`Buy 2 ${symbol} · limit · GTC`);
    await back.click();
    await expect(page.locator(".mctl-trade-line")).toHaveText(`Buy 2 ${symbol} · limit · GTC`);
    await page.getByRole("button", { name: "Review order" }).click();
    await expect(page).toHaveURL(/\/app\/trade\?/);
    const url = new URL(page.url());
    expect(url.searchParams.get("play")).toBe("101");
    expect(url.searchParams.get("symbol")).toBe(symbol);
    expect(url.searchParams.get("shares")).toBe("2");
    expect(url.searchParams.get("type")).toBe("limit");
    // The Trade page's gate does the reviewing (the offline server links no account, so it says
    // how to connect one; `tests/shell/gate-campaign-draft.spec.tsx` pins the ticket seeding).
    await expect(page.getByRole("heading", { name: "Trade", level: 1 })).toBeVisible();
  });

  test("puts a dated report's company on the ticket from the Calendar's Trade pill", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/app/?w=calendar");
    const pill = page
      .getByRole("navigation", { name: "Linked windows" })
      .getByRole("button", { name: /Trade: [A-Z.]+ reports / });
    const label = (await pill.textContent()) ?? "";
    const symbol = /Trade: ([A-Z.]+) reports/.exec(label)?.[1] ?? "";
    await pill.click();
    await expect(page).toHaveURL(/\/app\/\?w=trade$/);
    await expect(page.locator(".mctl-trade-line")).toHaveText(`Buy 1 ${symbol} · market · day`);
    await expect(page.getByRole("button", { name: symbol, exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    // The Trade window links back to that report on the calendar.
    await expect(
      page
        .getByRole("navigation", { name: "Linked windows" })
        .getByRole("button", { name: new RegExp(`Calendar: ${symbol} reports `) }),
    ).toBeVisible();
  });

  test("lists Trade under its own Workbench head on the rail at 1280", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/app/");
    const rail = page.getByRole("navigation", { name: "Waypoints" });
    await expect(rail.locator(".mctl-eyebrow")).toHaveText(["Waypoints", "Workbench"]);
    await expect(rail.locator(".mctl-way").last()).toContainText("Trade");
    await expect(rail.locator(".mctl-way").last()).toContainText("draft");
  });
});
