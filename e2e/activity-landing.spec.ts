import { expect, type Locator, type Page, test } from "@playwright/test";
import { OWNED, ownTheDayTrader } from "./own-account";

/**
 * Landing on a row below the sticky head (#5022) — scroll position against a sticky header is
 * layout, so it needs a real browser. Two doors on the Profile page's Overview jump to a row:
 *   - a FORM square (the net-worth card's closed trades) opens Activity at `#act-<orderId>`;
 *   - an Events row's `#pos-<symbol>` link lands on the position in the book (the decision pager's
 *     "Show in table" door made the same URL until the pager retired, #5070).
 * Either one must leave its row fully on screen BELOW the cockpit head (topbar + sticky head),
 * marked `data-landed` for a moment — the outline and inset bar that say "this one".
 *
 * At 390 the FORM strip is not drawn (≤700px the card's footer steps aside, #3689 slice 8), but
 * the link it makes is: a Thesis marker carries the same `#act-` URL. So the phone opens that URL
 * and the desktop taps the square; both widths open the `#pos-` URL an Events row makes — one
 * landing, both widths.
 *
 * The offline ledger holds two buys and no closes, so the spec answers the Day Trader's activity
 * with thirty orders, half of them closes: the FORM strip's oldest square then points well down
 * the table, so the page has to scroll to reach it. A holding decision rides on its desk, as a
 * flagged book's would.
 */

const HOUR = 3_600_000;

/** Thirty orders, newest first: each close (a sell with a realized P/L) follows the buy it closed. */
function ledger(): unknown {
  const start = Date.parse("2026-07-24T15:00:00Z");
  const activity = Array.from({ length: 30 }, (_, i) => {
    const close = i % 2 === 0;
    const win = i % 4 === 0;
    return {
      orderId: `l${i}`,
      symbol: "AAPL",
      display: "AAPL",
      side: close ? "sell" : "buy",
      quantity: 10,
      filled: 10,
      price: "$140.00",
      status: "filled",
      at: new Date(start - i * HOUR).toISOString(),
      backfilled: false,
      origin: "unknown",
      ...(close
        ? {
            realizedPl: win ? "+$12.00" : "−$8.00",
            realizedTone: win ? "pos" : "neg",
            returnPct: win ? "+0.9%" : "−0.6%",
          }
        : {}),
    };
  });
  return { available: true, activity };
}

/** A held position the decision engine flags, as a flagged book's desk carries it. */
const HOLDING = {
  id: "lock-in-AAPL",
  kind: "lock-in",
  symbol: "AAPL",
  display: "AAPL",
  plainName: "Apple",
  pl: "+$40.00 · +0.7%",
  plTone: "pos",
  title: "AAPL is up — lock some of it in?",
  captionShort: "Up since you bought it.",
  caption: "Up since you bought it.",
  why: "a gain on paper is not a gain yet.",
  clocks: [],
  primary: { label: "Review on Trade ↗", href: `/app/trade?desk=${OWNED.id}&symbol=AAPL` },
  secondary: { label: "Show in table", href: "#pos-AAPL" },
  stakeRaw: 5_684,
};

const OVERVIEW = `/app/accounts?account=${OWNED.id}`;
/** The oldest close the FORM strip shows: its row is the deepest one the strip links. */
const DEEPEST_CLOSE = "act-l18";
/** The row at desktop, the card at 390 — whichever the breakpoint lays out. */
const POSITION = 'tr[id="pos-AAPL"], .pos-card[data-pos-anchor="pos-AAPL"]';

async function stage(page: Page): Promise<void> {
  await ownTheDayTrader(page);
  await page.route(
    (url) => url.pathname === `/api/desk/${OWNED.id}/activity`,
    (route) => route.fulfill({ json: ledger() }),
  );
  await page.route(`**/api/desk/${OWNED.id}`, async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    body.desk.decisions = [HOLDING, ...(body.desk.decisions ?? [])];
    await route.fulfill({ response, json: body });
  });
}

/** How far `el`'s top sits below the cockpit head's bottom, and its bottom above the fold. */
function clearanceOf(el: Element): { belowHead: number; aboveFold: number } {
  const head = document.querySelector(".cockpit-head")?.getBoundingClientRect().bottom ?? 0;
  const box = el.getBoundingClientRect();
  return {
    belowHead: Math.round(box.top - head),
    aboveFold: Math.round(window.innerHeight - box.bottom),
  };
}

/** Marked on arrival, then — once the mark has run its course and the page above has settled —
 *  still fully on screen between the sticky head and the fold. */
async function expectLanded(target: Locator): Promise<void> {
  await expect(target).toHaveAttribute("data-landed", "");
  await expect(target).not.toHaveAttribute("data-landed", { timeout: 6_000 });
  const seen = await target.evaluate(clearanceOf);
  expect(seen.belowHead, "the row's top is at or below the sticky head").toBeGreaterThanOrEqual(0);
  expect(seen.aboveFold, "the row's bottom is above the fold").toBeGreaterThanOrEqual(0);
}

test.describe("landing at 1280px, through the Overview's doors (#5022)", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("a FORM square lands on its Activity row below the sticky head, marked", async ({
    page,
  }) => {
    await stage(page);
    await page.goto(OVERVIEW);
    const square = page.locator(".form-sq").first();
    await expect(square).toBeVisible();
    expect(await square.getAttribute("href")).toContain(`section=activity#${DEEPEST_CLOSE}`);
    await square.click();
    await expectLanded(page.locator(`tr[id="${DEEPEST_CLOSE}"]`));
  });

  // The decision pager's "Show in table" door retired with the pager (#5070): its job is the fact
  // badge on every row. The `#pos-<symbol>` URL it made is still an Events row's link.
  test("an Events row's #pos- link lands its position below the sticky head, marked", async ({
    page,
  }) => {
    await stage(page);
    // The offline book is two rows at the very end of the page, where no jump can top-align a row;
    // a member's real book has room below it. Give the page that room.
    await page.addInitScript(() => {
      document.addEventListener("DOMContentLoaded", () => {
        document.body.style.paddingBottom = "1500px";
      });
    });
    await page.goto(`${OVERVIEW}#pos-AAPL`);
    await expectLanded(page.locator(POSITION).filter({ visible: true }));
  });
});

test.describe("landing at 390px, through the links those doors make (#5022)", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("a FORM square's link lands on its Activity row below the sticky head, marked", async ({
    page,
  }) => {
    await stage(page);
    await page.goto(`${OVERVIEW}&section=activity#${DEEPEST_CLOSE}`);
    // At 390 the ledger is one card an order (#5101), and the card carries the row's anchor.
    const card = page.locator(`[id="${DEEPEST_CLOSE}"]`);
    await expect(card).toHaveClass(/act-card/);
    await expectLanded(card);
  });

  test("a position's link lands on its card below the sticky head, marked", async ({ page }) => {
    await stage(page);
    await page.goto(`${OVERVIEW}#pos-AAPL`);
    const card = page.locator(POSITION).filter({ visible: true });
    await expect(card).toHaveClass(/pos-card/);
    await expectLanded(card);
  });
});

/**
 * The FORM squares as touch targets (#5046). A drawn square is 26×22 — too small for a thumb — so
 * each one owns a 44×44 box centred on it, and no two boxes overlap: any point within 21px of a
 * square's centre, across and down, belongs to that square. A press 18px off the centre, outside
 * the drawn square but inside its box, opens that trade. And the strip says in words that the
 * squares open trades: the popover that also says so needs a hover a touch screen never makes.
 *
 * The press is a mouse click, not `touchscreen.tap`: Chromium's touch adjustment snaps an emulated
 * tap onto the nearest link, so a tap passes with no box at all and cannot tell the box from the
 * browser's guess. A click lands exactly where it is sent — what a stylus, a trackpad, or a
 * browser that does not adjust taps gets.
 *
 * Both ends of the widths that draw the strip: 1280, and 701 — one pixel above the phone layout
 * that hides it (#3689 slice 8).
 */
const CUE = "Each square opens its trade";

/** The points within 21px of each square's centre that hit-test to something other than it. */
function strayPoints(): string[] {
  const misses: string[] = [];
  for (const sq of document.querySelectorAll<HTMLElement>(".form-sq")) {
    const box = sq.getBoundingClientRect();
    const [cx, cy] = [box.left + box.width / 2, box.top + box.height / 2];
    for (const dx of [-21, 0, 21]) {
      for (const dy of [-21, 0, 21]) {
        const hit = document.elementFromPoint(cx + dx, cy + dy)?.closest(".form-sq");
        if (hit !== sq) misses.push(`${sq.getAttribute("href")} at (${dx}, ${dy})`);
      }
    }
  }
  return misses;
}

for (const width of [1280, 701]) {
  test.describe(`the FORM squares as touch targets at ${width}px (#5046)`, () => {
    test.use({ viewport: { width, height: 900 } });

    test("every square owns a 44×44 box centred on it, clear of its neighbours", async ({
      page,
    }) => {
      await stage(page);
      await page.goto(OVERVIEW);
      await expect(page.locator(".form-sq")).toHaveCount(10);
      await page.locator(".form-squares").scrollIntoViewIfNeeded();
      expect(await page.evaluate(strayPoints)).toEqual([]);
    });

    test("a press 18px off a square's centre opens that trade's Activity row", async ({ page }) => {
      await stage(page);
      await page.goto(OVERVIEW);
      const square = page.locator(".form-sq").first();
      await square.scrollIntoViewIfNeeded();
      const box = await square.boundingBox();
      if (!box) throw new Error("the first FORM square has no box");
      await page.mouse.click(box.x + box.width / 2 - 18, box.y + box.height / 2 + 18);
      await expectLanded(page.locator(`tr[id="${DEEPEST_CLOSE}"]`));
    });

    test("the strip says its squares open trades, with no hover", async ({ page }) => {
      await stage(page);
      await page.goto(OVERVIEW);
      await expect(page.locator(".form-strip").getByText(CUE)).toBeVisible();
    });
  });
}
