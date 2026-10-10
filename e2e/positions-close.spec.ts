import { expect, type Page, test } from "@playwright/test";
import { OWNED, ownTheDayTrader } from "./own-account";

/**
 * The desk's Close, end to end (#5086). The server sends a position's size signed and formatted —
 * "-1" for a sold put, "1,200" for twelve hundred shares — and the opened row's Close once read it
 * with a bare Number(), so neither could ever close. In a real browser at 1280: the sold put's
 * panel seeds one contract and its review is a buy to close of one; 1,200 shares seed 1,200 and
 * review a sell of 1,200; a short stock's Close is off with its reason as text, and nothing is
 * ever reviewed for it — nor for any buy listed under it (#5091). At 390, Trade's option close
 * says the side and count in words on its Confirm.
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

/** Two buys under the short TSLA row, as a cut-off fill window once listed them (#5091): sizes that
 *  match the short's in absolute terms. The server no longer sends these; the row must refuse
 *  them anyway. */
const BUY = {
  costPerShare: "$380.00",
  price: "$400.00",
  dayPl: "+$100",
  dayTone: "pos",
  returnPct: "+5.3%",
  totalTone: "pos",
};
const SHORT_BUYS = [
  {
    ...BUY,
    lotId: "TSLA-0-a",
    openedAt: "2026-09-10 14:00 UTC",
    quantity: "60",
    costBasis: "$22,800",
    value: "$24,000",
    totalPl: "+$1,200",
  },
  {
    ...BUY,
    lotId: "TSLA-1-b",
    openedAt: "2026-09-15 14:00 UTC",
    quantity: "40",
    costBasis: "$15,200",
    value: "$16,000",
    totalPl: "+$800",
  },
];

async function stage(
  page: Page,
  { shortBuys = false }: { readonly shortBuys?: boolean } = {},
): Promise<{ readonly sent: Record<string, unknown>[] }> {
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
      {
        ...shares,
        // Short 100 at $380, now $400 — the server's own words for a short (`position-plain.ts`).
        symbol: "TSLA",
        display: "TSLA",
        quantity: "-100",
        costPerShare: "$380.00",
        price: "$400.00",
        costBasis: "-$38,000",
        value: "-$40,000",
        dayPl: "-$300",
        dayPct: "-0.8%",
        dayTone: "neg",
        totalPl: "-$2,000",
        totalPlRaw: -2_000,
        returnPct: "-5.26%",
        totalTone: "neg",
        weightPct: 0,
        plainName: "Short shares · profits if TSLA falls",
        breakeven: "$380.00",
        best: "+$38,000",
        worst: "unlimited",
        nextEvent: undefined,
        lots: shortBuys ? SHORT_BUYS : undefined,
      },
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
          // With no count sent (Trade's close), the server closes the whole holding: one contract.
          contracts: draft.contracts ?? 1,
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

  // #5091: each buy closes as a sell of its own size, so under a short every one stays off too.
  test("keeps every Close this buy off on a short stock, citing the row's reason", async ({
    page,
  }) => {
    const { sent } = await stage(page, { shortBuys: true });
    await page.goto("/app/accounts");
    await openRow(page, "TSLA");

    const closeBuy = table(page).getByRole("button", { name: "Close this buy" });
    await expect(closeBuy).toHaveCount(2);
    for (const button of await closeBuy.all()) {
      await expect(button).toBeDisabled();
      await expect(button).toHaveAccessibleDescription(/short 100 shares/);
    }
    await expect(table(page).locator(".close-panel")).toHaveCount(0);
    expect(sent).toEqual([]);
  });
});

test.describe("Trade's option close at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  // #5091: the confirm says the side and the count in words, from the server's preview — as the
  // desk's close panel does (#5089) — never a bare "close 1".
  test("says buy to close and the count on a sold put's confirm", async ({ page }) => {
    const { sent } = await stage(page);
    await page.goto(`/app/trade?desk=${OWNED.id}&section=orders`);

    const card = page.getByRole("region", { name: "Option positions" });
    await card.getByRole("button", { name: "Close…" }).click();
    await expect(
      card.getByRole("button", {
        name: "Confirm — buy to close 1 contract · market · Day · est $550.00",
      }),
    ).toBeVisible();
    expect(sent).toEqual([
      {
        kind: "close",
        participantId: OWNED.id,
        occSymbol: "CRWV261120P00080000",
        orderType: "market",
      },
    ]);
  });
});
