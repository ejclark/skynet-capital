import { expect, type Page, test } from "@playwright/test";
import { OWNED, ownTheDayTrader } from "./own-account";

/**
 * The desk table's ranked columns (#5071; round 2 of #5037, Q2 R2 — Eric's Build A: "ranked
 * columns, the rest opens in the row, no sideways scroll"). Which columns show is a container
 * query on the table's own scroll box, so only a real browser at real widths can prove it: at
 * 390 (the phone's cards), 860, 1100, 1280 beside the tower, and 1280 with Moneypenny's History
 * open over her dock (#7487 slice 2: the tower stays, nothing narrows), neither the page nor the
 * table scrolls sideways — closed, and with every row opened.
 *
 * The book is the offline Day Trader's, owned (so the widest rows, with Close, render), plus the
 * two longest rows a book draws: a sold put and a bought call with its buys. Everything else is
 * the real offline server's answer.
 */

interface Lot {
  readonly lotId: string;
}
interface Position {
  readonly symbol: string;
  readonly isOption: boolean;
  readonly lots?: readonly Lot[];
}

async function stage(page: Page): Promise<void> {
  await ownTheDayTrader(page);
  await page.route(`**/api/desk/${OWNED.id}`, async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    const positions = body.desk.positions as Position[];
    const shares = positions.find((p) => !p.isOption && p.lots && p.lots.length > 0);
    if (shares) {
      const sym = shares.symbol;
      positions.unshift({
        ...shares,
        symbol: `${sym}261120P00080000`,
        display: `${sym} $80 PUT · 20 NOV 26`,
        isOption: true,
        quantity: "-1",
        costBasis: "-$255",
        value: "-$550",
        dayPl: "-$60",
        dayTone: "neg",
        totalPl: "-$295",
        totalPlRaw: -295,
        returnPct: "-116%",
        totalTone: "neg",
        expiresIn: "41 days",
        expiresInDays: 41,
        breakeven: "$77.45",
        lots: undefined,
      } as Position);
      positions.push({
        ...shares,
        symbol: `${sym}261120C00180000`,
        display: `${sym} $180 CALL · 20 NOV 26`,
        isOption: true,
        expiresIn: "41 days",
        expiresInDays: 41,
        lots: (shares.lots ?? []).map((lot) => ({ ...lot, lotId: `opt-${lot.lotId}` })),
      } as Position);
    }
    await route.fulfill({ response, json: body });
  });
}

/**
 * Sideways overflow of the page and of every visible table box; which columns show (a ranked-out
 * column is zero-width and invisible, never removed — positions-columns.css); and how the header
 * divides each box: its cells must add up to the whole box (a full-width row spanning more columns
 * than the table has makes the browser invent unheaded ones) and leave Position its room.
 */
const measure = (page: Page) =>
  page.evaluate(() => {
    const doc = document.documentElement;
    const laidOut = (el: Element) => el.getClientRects().length > 0;
    const shown = (el: Element) =>
      laidOut(el) &&
      getComputedStyle(el).visibility === "visible" &&
      el.getBoundingClientRect().width > 0;
    const boxes = [...document.querySelectorAll<HTMLElement>(".blotter-scroll")].filter(laidOut);
    const cards = [...document.querySelectorAll<HTMLElement>(".pos-cards")].filter(laidOut);
    return {
      page: doc.scrollWidth - doc.clientWidth,
      boxes: boxes.map((b) => {
        const heads = [...b.querySelectorAll<HTMLElement>("table.pos-table thead th")];
        // Layout widths, not painted ones: a page's entrance animation scales its boxes for a moment.
        const widths = heads.map((th) => th.offsetWidth);
        return {
          width: b.clientWidth,
          // Unrounded: the container query compares this, and a box can land a pixel from a step.
          exact: b.getBoundingClientRect().width,
          over: b.scrollWidth - b.clientWidth,
          headed: Math.round(widths.reduce((sum, w) => sum + w, 0)),
          position: Math.round(widths[0] ?? 0),
        };
      }),
      cards: cards.map((c) => c.scrollWidth - c.clientWidth),
      columns: [...document.querySelectorAll("table.pos-table thead th")]
        .filter(shown)
        .map((th) => (th.className.match(/pos-col-(\w+)/) ?? [])[1]),
      tower: [...document.querySelectorAll(".tower-column")].some(laidOut),
      history: [...document.querySelectorAll(".mp-history")].some(laidOut),
    };
  });

type Frame = Awaited<ReturnType<typeof measure>>;

function expectNoSidewaysScroll(frame: Frame, when: string): void {
  expect(frame.page, `the page scrolls sideways ${when}`).toBeLessThanOrEqual(0);
  for (const box of frame.boxes) {
    expect(box.over, `a ${box.width}px table scrolls sideways ${when}`).toBeLessThanOrEqual(0);
    // Whole pixels per header cell; an invented column would leave a gap of ~80px or more.
    expect(
      Math.abs(box.headed - box.width),
      `the header spans the whole ${box.width}px table ${when}`,
    ).toBeLessThanOrEqual(8);
    expect(box.position, `Position keeps its room ${when}`).toBeGreaterThanOrEqual(185);
  }
  for (const over of frame.cards) {
    expect(over, `the cards scroll sideways ${when}`).toBeLessThanOrEqual(0);
  }
}

/** Open every row on the table, then measure again. */
async function openEveryRow(page: Page): Promise<Frame> {
  const openers = page.locator("table.pos-table").getByRole("button", { name: /^Detail for/ });
  const count = await openers.count();
  expect(count, "the staged book's rows").toBeGreaterThanOrEqual(4);
  for (let i = 0; i < count; i++) await openers.nth(i).click();
  await expect(page.locator("table.pos-table .row-open")).toHaveCount(count);
  return measure(page);
}

const FIVE = ["pos", "greeks", "value", "pl", "open"];

/** The columns a box of this width stands (positions-columns.css): its own width, never the
 *  window's, picks them. */
const ranked = (width: number): string[] => [
  "pos",
  ...(width >= 640 ? ["greeks"] : []),
  "value",
  "pl",
  ...(width >= 960 ? ["event"] : []),
  ...(width >= 1100 ? ["best"] : []),
  "open",
];

/** The one table on the page stands exactly the columns its width ranks. */
function expectRanked(frame: Frame, when: string): void {
  expect(frame.boxes, `one table ${when}`).toHaveLength(1);
  const [box] = frame.boxes;
  expect(frame.columns, `the columns a ${box?.exact}px table ranks ${when}`).toEqual(
    ranked(box?.exact ?? 0),
  );
}

// A test that has measured all it needs can end while a staged answer is still in flight (an
// account's page asks for its settings late); its handler must not fail the test after the fact.
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: "ignoreErrors" });
});

const ROUTES = ["/app/accounts", `/app/u/${OWNED.id}`];

test.describe("the positions at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  for (const route of ROUTES) {
    test(`are cards that never scroll sideways on ${route}`, async ({ page }) => {
      await stage(page);
      await page.goto(route);
      await expect(page.locator(".pos-cards .pos-card-name").first()).toBeVisible();
      const frame = await measure(page);
      expect(frame.boxes, "the wide table is not drawn on a phone").toHaveLength(0);
      expect(frame.cards.length).toBeGreaterThan(0);
      expectNoSidewaysScroll(frame, "at 390");
    });
  }
});

for (const width of [860, 1100]) {
  test.describe(`the positions table at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    for (const route of ROUTES) {
      test(`keeps the five ranked columns and never scrolls sideways on ${route}`, async ({
        page,
      }) => {
        await stage(page);
        await page.goto(route);
        await expect(page.locator("table.pos-table").first()).toBeVisible();
        const closed = await measure(page);
        expect(closed.boxes.length).toBeGreaterThan(0);
        for (const key of FIVE) expect(closed.columns).toContain(key);
        expectRanked(closed, `at ${width}`);
        expectNoSidewaysScroll(closed, `at ${width}`);
        expectNoSidewaysScroll(await openEveryRow(page), `at ${width}, every row opened`);
      });
    }
  });
}

test.describe("the positions table at 1280px", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  for (const route of ROUTES) {
    test(`stands five columns beside the tower with no sideways scroll on ${route}`, async ({
      page,
    }) => {
      await stage(page);
      await page.goto(route);
      await expect(page.locator("table.pos-table").first()).toBeVisible();
      const closed = await measure(page);
      expect(closed.tower, "the tower has its column").toBe(true);
      // The bench beside the tower is ~806px: exactly the five, the wide-table extras stepped out.
      expect(closed.columns).toEqual(FIVE);
      expectNoSidewaysScroll(closed, "beside the tower");
      expectNoSidewaysScroll(await openEveryRow(page), "beside the tower, every row opened");
    });
  }

  // Before #7487 slice 2 Moneypenny's rail took 440px here, so the tower stepped aside (#3977) and
  // the book read as a table or as cards by what was left. The rail is now a dock under the page
  // and her History overlays from its top edge, so the premise inverts: opening it moves nothing.
  // The tower keeps its column and the book keeps the same five columns, never scrolling sideways.
  for (const route of ROUTES) {
    test(`keeps the tower and the five columns with Moneypenny's History open on ${route}`, async ({
      page,
    }) => {
      await stage(page);
      await page.goto(route);
      await expect(page.locator("table.pos-table").first()).toBeVisible();
      await page
        .locator(".mp-dock")
        .getByRole("button", { name: /^History/ })
        .click();
      await expect(
        page.getByRole("region", { name: "Conversation with Moneypenny" }),
      ).toBeVisible();
      const open = await measure(page);
      expect(open.history).toBe(true);
      expect(open.tower, "the tower keeps its column").toBe(true);
      expect(open.columns).toEqual(FIVE);
      expectNoSidewaysScroll(open, "with History open");
    });
  }
});
