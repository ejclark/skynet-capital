import { expect, type Locator, type Page, test } from "@playwright/test";
import { OWNED, ownTheDayTrader } from "./own-account";

/**
 * Landing on a row below the sticky head (#5022) — scroll position against a sticky header is
 * layout, so it needs a real browser. Two doors on the Profile page's Overview jump to a row:
 *   - a FORM square (the net-worth card's closed trades) opens Activity at `#act-<orderId>`;
 *   - a decision card's "Show in table" is a plain `#pos-<symbol>` anchor to the positions book.
 * Either one must leave its row fully on screen BELOW the cockpit head (topbar + sticky head),
 * marked `data-landed` for a moment — the outline and inset bar that say "this one".
 *
 * At 390 neither door is drawn (≤700px the card's footer and the secondary action step aside,
 * #3689 slice 8), but the links they make are: a Thesis marker carries the same `#act-` URL and an
 * Events row the same `#pos-` one. So the phone opens those URLs and the desktop taps the doors —
 * one landing, both widths.
 *
 * The offline ledger holds two buys and no closes, so the spec answers the Day Trader's activity
 * with thirty orders, half of them closes: the FORM strip's oldest square then points well down
 * the table, so the page has to scroll to reach it. A holding decision is added to its desk so the
 * pager carries "Show in table".
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

/** A held position the pager flags, with its "Show in table" door — first, so it is the card shown. */
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

  test("“Show in table” lands its position below the sticky head, marked", async ({ page }) => {
    await stage(page);
    await page.goto(OVERVIEW);
    const door = page.getByRole("link", { name: "Show in table" });
    await expect(door).toBeVisible();
    // The offline book is two rows at the very end of the page, where no jump can top-align a row;
    // a member's real book has room below it. Give the page that room.
    await page.addStyleTag({ content: "body { padding-bottom: 1500px; }" });
    // A plain anchor: the browser makes its own top-aligned jump before the landing runs, and
    // `popstate` fires right after that jump, ahead of the router and the landing. Read it there.
    await page.evaluate((selector) => {
      window.addEventListener(
        "popstate",
        () => {
          const el = [...document.querySelectorAll(selector)].find(
            (c) => c.getClientRects().length > 0,
          );
          const head = document.querySelector(".cockpit-head")?.getBoundingClientRect().bottom ?? 0;
          document.body.dataset.firstJump = el
            ? String(Math.round(el.getBoundingClientRect().top - head))
            : "none";
        },
        { capture: true, once: true },
      );
    }, POSITION);
    await door.click();
    await expectLanded(page.locator(POSITION).filter({ visible: true }));
    // Read, not defaulted: a jump that was never observed must not pass as one that landed at 0.
    const firstJump = await page.locator("body").getAttribute("data-first-jump");
    expect(firstJump, "the browser's own jump was observed").toMatch(/^-?\d+$/);
    expect(Number(firstJump), "it stops below the head").toBeGreaterThanOrEqual(0);
  });
});

test.describe("landing at 390px, through the links those doors make (#5022)", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("a FORM square's link lands on its Activity row below the sticky head, marked", async ({
    page,
  }) => {
    await stage(page);
    await page.goto(`${OVERVIEW}&section=activity#${DEEPEST_CLOSE}`);
    await expectLanded(page.locator(`tr[id="${DEEPEST_CLOSE}"]`));
  });

  test("a position's link lands on its card below the sticky head, marked", async ({ page }) => {
    await stage(page);
    await page.goto(`${OVERVIEW}#pos-AAPL`);
    const card = page.locator(POSITION).filter({ visible: true });
    await expect(card).toHaveClass(/pos-card/);
    await expectLanded(card);
  });
});
