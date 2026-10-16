import type { Page } from "@playwright/test";

/**
 * Make the viewer the Day Trader's owner. This suite's server runs with no auth, so the viewer owns
 * nothing and the Profile page (`/app/accounts`) shows no account; answering `/api/settings` (and
 * the net-worth roster the page waits on) with that account listed opens its Overview, its FORM
 * strip and its own sections. Everything else is the real offline server's answer.
 */

export const OWNED = { id: "day-trader", name: "The Day Trader", kind: "bot" } as const;

/** Enough of `NetWorthStatsView` for the Overview to render; the numbers are never asserted. */
const STATS = {
  value: "$1,006,400",
  valueKnown: true,
  dayChange: "+$0",
  dayTone: "flat",
  dayKnown: true,
  cash: "$948,250",
  cashKnown: true,
  positionCount: 3,
  bookedPl: "—",
  bookedTone: "flat",
  bookedKnown: false,
  onPaper: "—",
  onPaperTone: "flat",
  onPaperKnown: false,
  windows: [],
};

export async function ownTheDayTrader(page: Page): Promise<void> {
  await page.route("**/api/settings", async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    body.accounts = [{ ...OWNED, hostConfigured: true, profile: null }];
    await route.fulfill({ response, json: body });
  });
  await page.route("**/api/accounts/networth", async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    body.accounts = [{ ...STATS, ...OWNED }];
    body.total = STATS;
    await route.fulfill({ response, json: body });
  });
}
