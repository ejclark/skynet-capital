import { expect, type Page, test } from "@playwright/test";
import { OWNED, ownTheDayTrader } from "./own-account";

/**
 * The positions table's action column (#4945) — layout, so it needs a real browser. Two bugs once
 * pushed a row's buttons out of the table: a media rule hit the `<col>` elements and left the
 * action column 0px wide, and `.btn`'s `width: 100%` stretched "Guidance" over the whole cell.
 *
 * The widest rows only render for an OWNER: "Guidance" + "Close all" on a share position, and
 * "Close this buy" + "Roll" on an option buy. This suite's server runs with no auth, so the viewer
 * owns nothing; the spec makes it the Day Trader's owner by answering `/api/settings` (and the
 * net-worth roster `/app/accounts` waits on) with that account listed, and adds one option to the
 * desk — the offline fixtures hold shares only. Everything else is the real server's answer.
 *
 * Two pages draw the table differently, so both are measured at every width:
 *   - `/app/accounts` shows the full colgroup at ≥1100 (all four detail columns);
 *   - `/app/u/:id` folds the detail columns behind the chevron again at ≥1200 (`.acct-book`).
 */

interface Lot {
  readonly lotId: string;
}
interface Position {
  readonly symbol: string;
  readonly isOption: boolean;
  readonly lots?: readonly Lot[];
}

/** The owner's view, plus one option in the desk: the offline fixtures hold shares only. */
async function ownTheDayTraderWithAnOption(page: Page): Promise<void> {
  await ownTheDayTrader(page);
  await page.route(`**/api/desk/${OWNED.id}`, async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    const positions = body.desk.positions as Position[];
    const shares = positions.find((p) => !p.isOption && p.lots && p.lots.length > 0);
    if (shares) {
      positions.push({
        ...shares,
        symbol: `${shares.symbol}261120C00180000`,
        isOption: true,
        lots: (shares.lots ?? []).map((lot) => ({ ...lot, lotId: `opt-${lot.lotId}` })),
      });
    }
    await route.fulfill({ response, json: body });
  });
}

/** Each act-col cell vs. its own box and the table's right edge, every lot row opened. */
async function measureActions(page: Page) {
  const table = page.locator("table.blotter-fixed").first();
  await expect(table.locator("td.act-col .btn").first()).toBeVisible();
  const headers = table.locator("button.sym-header");
  for (let i = 0; i < (await headers.count()); i++) await headers.nth(i).click();
  await expect(table.locator("td.lot-actions").first()).toBeVisible();
  return table.evaluate((t) => {
    const edge = t.getBoundingClientRect().right;
    return [...t.querySelectorAll<HTMLElement>("td.act-col")].flatMap((cell) => {
      const box = cell.getBoundingClientRect();
      return [...cell.querySelectorAll<HTMLElement>(".btn")].map((b) => {
        const btn = b.getBoundingClientRect();
        // A label wider than its box overflows past the box's own right edge, so the button
        // ends wherever its content does, not at its border box.
        const right = btn.left + Math.max(btn.width, b.scrollWidth);
        return {
          label: b.textContent?.trim() ?? "",
          pastLeft: Math.round((box.left - btn.left) * 10) / 10,
          pastRight: Math.round((right - box.right) * 10) / 10,
          pastTable: Math.round((right - edge) * 10) / 10,
        };
      });
    });
  });
}

for (const route of ["/app/accounts", `/app/u/${OWNED.id}`]) {
  test.describe(`the positions table's actions on ${route}`, () => {
    for (const width of [1024, 1100, 1280, 1440]) {
      test(`stay inside their column and the table at ${width}px`, async ({ page }) => {
        await ownTheDayTraderWithAnOption(page);
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route);
        const buttons = await measureActions(page);
        // The widest rows are really there: shares (Guidance + Close all), an option buy
        // (Close this buy + Roll) — fixture drift must not quietly thin this out.
        const labels = buttons.map((b) => b.label);
        for (const label of ["Guidance", "Close all", "Close this buy", "Roll"]) {
          expect(labels, `a "${label}" button`).toContain(label);
        }
        // Half a pixel for subpixel rounding; a squeezed row misses by tens of pixels.
        for (const b of buttons) {
          expect(b.pastLeft, `${b.label} starts inside its cell`).toBeLessThanOrEqual(0.5);
          expect(b.pastRight, `${b.label} ends inside its cell`).toBeLessThanOrEqual(0.5);
          expect(b.pastTable, `${b.label} ends inside the table`).toBeLessThanOrEqual(0);
        }
      });
    }
  });
}
