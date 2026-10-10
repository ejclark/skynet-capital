import { expect, type Page, test } from "@playwright/test";
import { OWNED, ownTheDayTrader } from "./own-account";

/**
 * The desk's Close, end to end (#5086). The server sends a position's size signed and formatted —
 * "-1" for a sold put, "1,200" for twelve hundred shares — and the opened row's Close once read it
 * with a bare Number(), so neither could ever close. In a real browser at 1280: the sold put's
 * panel seeds one contract and its review is a buy to close of one; 1,200 shares seed 1,200 and
 * review a sell of 1,200; a short stock's Close is off with its reason as text, and nothing is
 * ever reviewed for it.
 *
 * The book is the offline Day Trader's, owned (so Close renders), with those three rows in place of
 * its own. The review routes answer as the server's previews do, echoing the count the panel sent,
 * so what is asserted is what the panel asked for.
 */

interface Position {
  readonly symbol: string;
  readonly isOption: boolean;
}

const SOLD_PUT = "CRWV $80 PUT · 20 NOV 26";

async function stage(page: Page): Promise<{ readonly sent: Record<string, unknown>[] }> {
  const sent: Record<string, unknown>[] = [];
  await ownTheDayTrader(page);
  await page.route(`**/api/desk/${OWNED.id}`, async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    const shares = (body.desk.positions as Position[]).find((p) => !p.isOption);
    body.desk.positions = [
      {
        ...shares,
        symbol: "CRWV261120P00080000",
        display: SOLD_PUT,
        isOption: true,
        quantity: "-1",
        costPerShare: "$2.55",
        price: "$5.50",
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
      },
      { ...shares, symbol: "NVDA", display: "NVDA", quantity: "1,200", lots: undefined },
      { ...shares, symbol: "TSLA", display: "TSLA", quantity: "-100", lots: undefined },
    ];
    await route.fulfill({ response, json: body });
  });
  await page.route("**/api/trade/option/review", async (route) => {
    const draft = route.request().postDataJSON();
    sent.push(draft);
    await route.fulfill({
      json: {
        preview: {
          code: "close",
          underlying: "CRWV",
          occSymbol: draft.occSymbol,
          side: "buy",
          positionIntent: "buy_to_close",
          contracts: draft.contracts,
          orderType: "market",
          timeInForce: "day",
          ok: true,
          estNotional: 550,
          refusals: [],
          warnings: [],
        },
      },
    });
  });
  await page.route("**/api/trade/review", async (route) => {
    const draft = route.request().postDataJSON();
    sent.push(draft);
    await route.fulfill({
      json: {
        preview: {
          ok: true,
          action: draft.action,
          symbol: draft.symbol,
          quantity: draft.quantity,
          orderType: "market",
          timeInForce: "day",
          refusals: [],
          warnings: [],
        },
      },
    });
  });
  return { sent };
}

const table = (page: Page) => page.locator("table.pos-table").first();
const openRow = (page: Page, display: string) =>
  table(page)
    .getByRole("button", { name: `Detail for ${display}` })
    .click();

test.describe("the opened row's Close at 1280px", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("closes a sold put as a buy to close of one contract", async ({ page }) => {
    const { sent } = await stage(page);
    await page.goto("/app/accounts");
    await openRow(page, SOLD_PUT);
    await table(page).getByRole("button", { name: "Close", exact: true }).click();

    const panel = table(page).locator(".close-panel");
    await expect(panel.getByRole("spinbutton")).toHaveValue("1");
    const closeAll = panel.getByRole("button", { name: "Close all" });
    await expect(closeAll).toBeEnabled();
    await closeAll.click();

    await expect(panel.getByText(/Buy to close 1 contract\b/)).toBeVisible();
    await expect(panel.getByRole("button", { name: "Confirm" })).toBeVisible();
    expect(sent).toEqual([
      {
        kind: "close",
        participantId: OWNED.id,
        occSymbol: "CRWV261120P00080000",
        contracts: 1,
      },
    ]);
  });

  test("closes 1,200 shares as a sell of 1,200", async ({ page }) => {
    const { sent } = await stage(page);
    await page.goto("/app/accounts");
    await openRow(page, "NVDA");
    await table(page).getByRole("button", { name: "Close", exact: true }).click();

    const panel = table(page).locator(".close-panel");
    await expect(panel.getByRole("spinbutton")).toHaveValue("1200");
    await panel.getByRole("button", { name: "Close all" }).click();

    await expect(panel.getByText(/Sell 1,200 shares\b/)).toBeVisible();
    expect(sent).toEqual([
      { participantId: OWNED.id, symbol: "NVDA", quantity: 1200, action: "sell" },
    ]);
  });

  test("keeps a short stock's Close off with its reason in words", async ({ page }) => {
    const { sent } = await stage(page);
    await page.goto("/app/accounts");
    await openRow(page, "TSLA");

    const close = table(page).getByRole("button", { name: "Close", exact: true });
    await expect(close).toBeDisabled();
    await expect(close).toHaveAccessibleDescription(/short 100 shares/);
    await expect(table(page).getByText(/A sell would add to the short\./)).toBeVisible();
    expect(sent).toEqual([]);
  });
});
