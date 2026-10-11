import { expect, type Page, test } from "@playwright/test";
import { OWNED, ownTheDayTrader } from "./own-account";

/**
 * The chain opens at the price row on a phone (#5234, picked on #5171 round 1). Folded, the
 * "Current price" row used to start 1.2 screens down; the page now lands with it mid-screen under
 * the sticky top bar. Layout and scroll, so it needs a real browser.
 *
 * The offline server has no linked account, so its chain answer is a note; the spec answers the
 * chain read itself with an NVDA ladder (2.5 apart around a 181.30 spot — the shape a real NVDA
 * expiry has), makes the viewer the Day Trader's owner so the bench mounts, and leaves everything
 * else to the server.
 */

const CHAIN = `/app/trade?desk=${OWNED.id}&symbol=NVDA&section=chain`;

const SPOT = 181.3;
const EXPIRY = "2026-10-16";

function ladder(type: "call" | "put", expiration: string) {
  const rows = [];
  for (let strike = 150; strike <= 215; strike += 2.5) {
    const intrinsic = Math.max(0, type === "call" ? SPOT - strike : strike - SPOT);
    const premium = Math.round((intrinsic + 2.2) * 100) / 100;
    rows.push({
      strike,
      occSymbol: `NVDA261016${type === "call" ? "C" : "P"}${String(strike * 1000).padStart(8, "0")}`,
      premium,
      bid: Math.round((premium - 0.05) * 100) / 100,
      ask: Math.round((premium + 0.05) * 100) / 100,
    });
  }
  return {
    symbol: "NVDA",
    optionType: type,
    expirations: [EXPIRY, "2026-10-23", "2026-11-20"],
    expiration,
    spot: SPOT,
    rows,
  };
}

async function answerChains(page: Page): Promise<void> {
  await ownTheDayTrader(page);
  await page.route("**/api/trade/chain?**", (route) => {
    const asked = new URL(route.request().url()).searchParams;
    const type = asked.get("type") === "put" ? "put" : "call";
    return route.fulfill({ json: ladder(type, asked.get("exp") ?? EXPIRY) });
  });
}

/** The price row's middle, measured against the space the sticky top bar leaves visible. */
function priceRowPlacement(page: Page) {
  return page.evaluate(() => {
    const row = document.querySelector(".straddle-divider")?.getBoundingClientRect();
    const bar = document.querySelector(".topbar")?.getBoundingClientRect().bottom ?? 0;
    if (!row) return undefined;
    return {
      rowMiddle: row.top + row.height / 2,
      visibleMiddle: bar + (window.innerHeight - bar) / 2,
      scrollY: window.scrollY,
    };
  });
}

test.use({ viewport: { width: 390, height: 844 } });

test("a ?section=chain link opens with the current-price row mid-screen", async ({ page }) => {
  await answerChains(page);
  await page.goto(CHAIN);
  const divider = page.locator(".straddle-divider");
  await expect(divider).toBeInViewport();
  await expect(divider).toContainText("Current price");
  const placed = await priceRowPlacement(page);
  expect(placed).toBeDefined();
  expect(placed?.scrollY).toBeGreaterThan(0);
  // centred, within a row's height either way
  expect(Math.abs((placed?.rowMiddle ?? 0) - (placed?.visibleMiddle ?? 0))).toBeLessThan(40);
});

test("tapping Chain on the section switch opens at the price row too", async ({ page }) => {
  await answerChains(page);
  await page.goto(`/app/trade?desk=${OWNED.id}&symbol=NVDA&section=ticket`);
  await page.getByRole("button", { name: "Chain", exact: true }).click();
  await expect(page.locator(".straddle-divider")).toBeInViewport();
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
});

test("choosing another expiry leaves the page where the member put it", async ({ page }) => {
  await answerChains(page);
  await page.goto(CHAIN);
  await expect(page.locator(".straddle-divider")).toBeInViewport();
  // the member swipes back up to the expiry dates — the page is theirs from here
  await page.mouse.wheel(0, -2000);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  // a tap, not Playwright's click: its pre-click scroll-into-view would move the page itself
  await page.getByRole("button", { name: "Oct 23, 2026" }).dispatchEvent("click");
  await expect(page.getByRole("button", { name: "Oct 23, 2026" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});
