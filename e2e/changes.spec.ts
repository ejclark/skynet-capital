import { type APIRequestContext, expect, type Page, test } from "@playwright/test";
import { mintSession } from "../scripts/crawl/mint-session";
import { sessionCookie } from "../scripts/crawl/steps.mjs";

// CHANGE PLAYTHROUGHS — a member changes their paper account through the UI and the spec reads the
// account back (docs/members/change-scenarios.md). The model-free floor under the simulated
// faculty (scripts/faculty/): each test is one scenario's optimal path, so a refactor that breaks
// a write fails CI instead of waiting for a member to find it. Runs in the `changes` project only
// (e2e/playwright.faculty.ts), against the faculty world whose writes land.
//
// The account is shared and the tests change it in order (serial), so each asserts on what it
// added — an order id the account did not have before — never on a total.

const OWNER = "crawl@example.test";
const ACCOUNT = "human-eric";
const PHONE = { width: 390, height: 844 };

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([sessionCookie(mintSession(OWNER), baseURL as string)]);
});

interface Row {
  readonly id: string;
  readonly symbol: string;
  readonly side: string;
  readonly quantity: number;
  readonly orderType: string;
  readonly limitPrice?: number;
  readonly state: string;
  readonly replaces?: string;
}

/** The account's orders as the desk serves them — working and recent, one list. */
async function orders(request: APIRequestContext): Promise<Row[]> {
  const res = await request.get(`/api/trade/orders?participantId=${ACCOUNT}`);
  const body = (await res.json()) as { working: Row[]; recent: Row[] };
  return [...body.working, ...body.recent];
}

/** The stock form's Symbol, Shares, then the quantity — the way a member fills it. */
async function enterStock(page: Page, symbol: string, shares: string): Promise<void> {
  await page.getByLabel("Symbol", { exact: true }).click();
  await page.keyboard.type(symbol);
  // The label, not the box: the tap a member makes right after typing a symbol (the regression
  // below has the whole story).
  await page.locator("label", { hasText: /^Shares$/ }).click();
  await page.keyboard.type(shares);
}

test("a market buy entered on the form lands in the account", async ({ page }) => {
  const known = new Set((await orders(page.request)).map((o) => o.id));
  await page.goto("/app/trade");
  await page.getByLabel("Symbol", { exact: true }).scrollIntoViewIfNeeded();
  await enterStock(page, "SPY", "3");
  await page.getByLabel("Order type", { exact: true }).selectOption("market");
  await page.getByRole("button", { name: "Review order" }).click();
  await page.getByRole("button", { name: /^Submit order/ }).click();
  await expect
    .poll(async () => (await orders(page.request)).filter((o) => !known.has(o.id)))
    .toEqual([
      expect.objectContaining({ symbol: "SPY", side: "buy", quantity: 3, orderType: "market" }),
    ]);
});

test("on a phone, the Shares label takes the tap right after a symbol is typed", async ({
  page,
}) => {
  // The faculty's first run: mousedown on the label blurred the Symbol field, the suggestion list
  // folded and the quote line arrived, the form moved under the finger, and the click went to the
  // fields' common parent — focus nowhere, the quantity typed into nothing (symbol-field.tsx).
  await page.setViewportSize(PHONE);
  await page.goto("/app/trade");
  await page.getByLabel("Symbol", { exact: true }).scrollIntoViewIfNeeded();
  await enterStock(page, "SPY", "7");
  await expect(page.getByLabel("Shares", { exact: true })).toHaveValue("7");
});

test("typing over a seeded limit price replaces it, and the limit order lands at that price", async ({
  page,
}) => {
  // Round 1 of the faculty: members typed into seeded amounts and sent "510.00505" (EQ-03) — the
  // form seeds the limit at the mid on the first quote, and typing appended to it.
  const known = new Set((await orders(page.request)).map((o) => o.id));
  await page.goto("/app/trade");
  await page.getByLabel("Symbol", { exact: true }).scrollIntoViewIfNeeded();
  await enterStock(page, "QQQ", "10");
  const limit = page.getByLabel("Limit price", { exact: true });
  await expect(limit).not.toHaveValue("");
  await limit.click();
  await page.keyboard.type("505");
  await expect(limit).toHaveValue("505");
  await page.getByRole("button", { name: "Review order" }).click();
  await page.getByRole("button", { name: /^Submit order/ }).click();
  await expect
    .poll(async () => (await orders(page.request)).filter((o) => !known.has(o.id)))
    .toEqual([
      expect.objectContaining({
        symbol: "QQQ",
        side: "buy",
        quantity: 10,
        orderType: "limit",
        limitPrice: 505,
      }),
    ]);
});

test("changing a working order's price replaces it, then cancelling the new one ends it", async ({
  page,
}) => {
  await page.goto("/app/trade?section=orders");
  const row = page
    .locator(".wo-row, li, tr", { hasText: "MSFT" })
    .filter({ hasText: "Working" })
    .first();
  await row.getByRole("button", { name: "Modify" }).click();
  const price = page.getByLabel("Limit price").last();
  await price.fill("405");
  await page.getByRole("button", { name: "Send change" }).click();
  await expect
    .poll(async () => (await orders(page.request)).find((o) => o.replaces === "faculty-msft-limit"))
    .toEqual(expect.objectContaining({ symbol: "MSFT", limitPrice: 405, state: "working" }));

  const successor = (await orders(page.request)).find(
    (o) => o.replaces === "faculty-msft-limit",
  ) as Row;
  await page.reload();
  const live = page
    .locator(".wo-row, li, tr", { hasText: "MSFT" })
    .filter({ hasText: "405" })
    .first();
  await live.getByRole("button", { name: "Cancel", exact: true }).click();
  await live.getByRole("button", { name: "Confirm cancel" }).click();
  await expect
    .poll(async () => (await orders(page.request)).find((o) => o.id === successor.id)?.state)
    .toBe("cancelled");
});
