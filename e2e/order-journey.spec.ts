import { type APIRequestContext, expect, type Page, test } from "@playwright/test";
import { mintSession } from "../scripts/crawl/mint-session";
import { sessionCookie } from "../scripts/crawl/steps.mjs";
import { FIXED_CLOCK } from "./determinism";

// THE ORDER GUARD (#8188, stage 1 of the #8161 redesign). A paper stock order and a paper option
// order, each placed end to end and then found on the book: the trade core every stage 2 route move
// must keep green. Runs in the `orders` project only (e2e/playwright.faculty.ts): its own faculty
// boot, writes applied, the server pinned to FIXED_CLOCK so a market order fills at any hour CI
// runs (on the wall clock after hours it would sit `accepted` until the open).
//
// Two halves. The API half posts review → submit and reads orders, positions and cash back: it
// guards the core whatever the routes become. The UI half is the member's path at 390×844 through
// the trade form and the options ticket to the book: the part a stage 2 PR that moves a surface
// edits, in ROUTES and nowhere else. Each test uses a symbol or contract the faculty book does not
// hold, and asserts only on what it added.

/** Each surface's entry route, named once. A stage 2 PR that moves one edits its line here. */
const ROUTES = {
  stockForm: "/app/trade",
  optionsTicket: "/app/trade",
  book: "/app/accounts",
  orders: "/app/trade?section=orders",
} as const;

const OWNER = "crawl@example.test";
const ACCOUNT = "human-eric";
const PHONE = { width: 390, height: 844 };
const CONTRACT_MULTIPLIER = 100;
/** Bounded waits for a fill to read back; never a sleep. */
const POLL = { timeout: 10_000 } as const;

// One account, changed in file order (the project is not fullyParallel, so one worker runs these
// one after another). Not `serial`: a red API test must not skip the UI tests, whose own verdict
// is what tells a stage 2 PR whether it broke the route or the core.
test.describe.configure({ mode: "default" });

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([sessionCookie(mintSession(OWNER), baseURL as string)]);
});

interface OrderRow {
  readonly id: string;
  readonly symbol: string;
  readonly display: string;
  readonly unit: "shares" | "contracts";
  readonly side: string;
  readonly quantity: number;
  readonly filledQuantity: number;
  readonly avgFillPrice?: number;
  readonly state: string;
}

interface ChainRow {
  readonly strike: number;
  readonly occSymbol: string;
}

interface Chain {
  readonly expiration: string;
  readonly spot: number;
  readonly rows: readonly ChainRow[];
}

async function getJson<T>(request: APIRequestContext, path: string): Promise<T> {
  const res = await request.get(path);
  expect(res.ok(), `GET ${path} → ${res.status()}`).toBe(true);
  return (await res.json()) as T;
}

async function postJson<T>(request: APIRequestContext, path: string, data: object): Promise<T> {
  const res = await request.post(path, { data });
  expect(res.ok(), `POST ${path} → ${res.status()}`).toBe(true);
  return (await res.json()) as T;
}

/** Working and recent orders, one list, as the desk serves them. */
async function orders(request: APIRequestContext): Promise<OrderRow[]> {
  const body = await getJson<{ working: OrderRow[]; recent: OrderRow[] }>(
    request,
    `/api/trade/orders?participantId=${ACCOUNT}`,
  );
  return [...body.working, ...body.recent];
}

interface Desk {
  readonly tiles: { readonly cashRaw: number };
  readonly positions: readonly { readonly symbol: string; readonly quantity: string }[];
}

async function desk(request: APIRequestContext): Promise<Desk> {
  return (await getJson<{ desk: Desk }>(request, `/api/desk/${ACCOUNT}`)).desk;
}

async function heldContracts(request: APIRequestContext, occSymbol: string): Promise<number> {
  const body = await getJson<{ rows: { symbol: string; contracts: number }[] }>(
    request,
    `/api/trade/option-positions?participantId=${ACCOUNT}`,
  );
  return body.rows.find((r) => r.symbol === occSymbol)?.contracts ?? 0;
}

/** The SPY call chain as the ticket reads it: the expiry and strikes come from here, never typed. */
function spyCalls(request: APIRequestContext): Promise<Chain> {
  return getJson<Chain>(request, "/api/trade/chain?symbol=SPY&type=call");
}

const cents = (dollars: number): number => Math.round(dollars * 100);

/** Waits for one order to fill and returns its row. */
async function filled(request: APIRequestContext, id: string): Promise<OrderRow> {
  await expect
    .poll(async () => (await orders(request)).find((o) => o.id === id)?.state, POLL)
    .toBe("filled");
  return (await orders(request)).find((o) => o.id === id) as OrderRow;
}

/** Waits for the one order this test added, matching `symbol` (stock) or `display` (contract). */
async function added(request: APIRequestContext, known: Set<string>, match: RegExp) {
  await expect
    .poll(
      async () =>
        (await orders(request)).filter((o) => !known.has(o.id) && match.test(o.display)).length,
      POLL,
    )
    .toBe(1);
  const row = (await orders(request)).find((o) => !known.has(o.id) && match.test(o.display));
  return filled(request, (row as OrderRow).id);
}

/** A phone, on the server's clock, so the ticket and the broker agree the market is open. */
async function phone(page: Page): Promise<void> {
  await page.clock.setFixedTime(FIXED_CLOCK);
  await page.setViewportSize(PHONE);
}

test.describe("API half: the trading core", () => {
  test("a stock market buy reviews clean, submits, fills, and lands on the book with its cash", async ({
    page,
  }) => {
    // page.request carries the context's session cookie; the bare `request` fixture does not.
    const request = page.request;
    const order = {
      participantId: ACCOUNT,
      action: "buy",
      symbol: "TSLA",
      quantity: 2,
      orderType: "market",
    };
    const before = await desk(request);
    expect(before.positions.some((p) => p.symbol === "TSLA")).toBe(false);

    const { preview } = await postJson<{ preview: { ok: boolean; refusals: string[] } }>(
      request,
      "/api/trade/review",
      order,
    );
    expect(preview.refusals).toEqual([]);
    expect(preview.ok).toBe(true);

    const sent = await postJson<{ ok: boolean; orderId?: string }>(
      request,
      "/api/trade/submit",
      order,
    );
    expect(sent.ok).toBe(true);
    expect(typeof sent.orderId).toBe("string");

    const row = await filled(request, sent.orderId as string);
    expect(row).toEqual(
      expect.objectContaining({ symbol: "TSLA", side: "buy", unit: "shares", filledQuantity: 2 }),
    );
    const after = await desk(request);
    expect(after.positions.find((p) => p.symbol === "TSLA")?.quantity).toBe("2");
    expect(cents(before.tiles.cashRaw - after.tiles.cashRaw)).toBe(
      cents(row.filledQuantity * (row.avgFillPrice as number)),
    );
  });

  test("a one-contract call buy reviews clean, submits, fills, and lands on the book with its cash", async ({
    page,
  }) => {
    // page.request carries the context's session cookie; the bare `request` fixture does not.
    const request = page.request;
    const chain = await spyCalls(request);
    const atm = chain.rows.reduce((a, r) =>
      Math.abs(r.strike - chain.spot) < Math.abs(a.strike - chain.spot) ? r : a,
    );
    const order = {
      kind: "open",
      participantId: ACCOUNT,
      code: "302",
      underlying: "SPY",
      contracts: 1,
      strike: atm.strike,
      expiration: chain.expiration,
      orderType: "market",
    };
    const before = await desk(request);
    expect(await heldContracts(request, atm.occSymbol)).toBe(0);

    const { preview } = await postJson<{
      preview: { ok: boolean; refusals: string[]; occSymbol: string };
    }>(request, "/api/trade/option/review", order);
    expect(preview.refusals).toEqual([]);
    expect(preview.ok).toBe(true);
    expect(preview.occSymbol).toBe(atm.occSymbol);

    const sent = await postJson<{ ok: boolean; orderId?: string }>(
      request,
      "/api/trade/option/submit",
      order,
    );
    expect(sent.ok).toBe(true);
    expect(typeof sent.orderId).toBe("string");

    const row = await filled(request, sent.orderId as string);
    expect(row).toEqual(
      expect.objectContaining({
        symbol: atm.occSymbol,
        side: "buy",
        unit: "contracts",
        filledQuantity: 1,
      }),
    );
    expect(await heldContracts(request, atm.occSymbol)).toBe(1);
    const after = await desk(request);
    expect(cents(before.tiles.cashRaw - after.tiles.cashRaw)).toBe(
      cents(row.filledQuantity * (row.avgFillPrice as number) * CONTRACT_MULTIPLIER),
    );
  });
});

test.describe("UI half: a member on a phone", () => {
  test("a stock order entered on the trade form fills and shows on the book", async ({ page }) => {
    await phone(page);
    const known = new Set((await orders(page.request)).map((o) => o.id));
    await page.goto(ROUTES.stockForm);
    await page.getByLabel("Symbol", { exact: true }).scrollIntoViewIfNeeded();
    await page.getByLabel("Symbol", { exact: true }).click();
    await page.keyboard.type("XLF");
    // The label, not the box: the tap a member makes after typing a symbol (changes.spec.ts).
    await page.locator("label", { hasText: /^Shares$/ }).click();
    await page.keyboard.type("5");
    await page.getByLabel("Order type", { exact: true }).selectOption("market");
    await page.getByRole("button", { name: "Review order" }).click();
    await page.getByRole("button", { name: /^Submit order/ }).click();

    const row = await added(page.request, known, /^XLF$/);
    expect(row).toEqual(expect.objectContaining({ side: "buy", filledQuantity: 5 }));

    await page.goto(ROUTES.book);
    await expect(page.getByRole("link", { name: /^XLF ,.* 5 shares ,/ })).toBeVisible();
  });

  test("a one-contract call bought on the options ticket fills and shows on the book", async ({
    page,
  }) => {
    await phone(page);
    // The first strike above spot: the API half bought the one nearest it, so this one is new.
    const chain = await spyCalls(page.request);
    const strike = Math.min(...chain.rows.map((r) => r.strike).filter((s) => s > chain.spot));
    const known = new Set((await orders(page.request)).map((o) => o.id));

    await page.goto(ROUTES.optionsTicket);
    await page.getByRole("button", { name: "Option", exact: true }).click();
    await page.getByRole("button", { name: "Call", exact: true }).click();
    await page.getByLabel("Symbol", { exact: true }).click();
    await page.keyboard.type("SPY");
    await page.keyboard.press("Enter");
    await page.getByRole("button", { name: `Pick the ${strike} call ask` }).click();
    await expect(page.getByLabel("Contracts (100 shares)")).toHaveValue("1");
    await page.getByLabel("Order", { exact: true }).selectOption("market");
    await page.getByRole("button", { name: "Review order" }).click();
    await page.getByRole("button", { name: /^Submit order/ }).click();

    const row = await added(page.request, known, new RegExp(`^SPY \\$${strike} CALL · `));
    expect(row).toEqual(
      expect.objectContaining({ side: "buy", unit: "contracts", filledQuantity: 1 }),
    );

    await page.goto(ROUTES.book);
    await expect(
      page.getByRole("link", { name: new RegExp(`^SPY \\$${strike} LONG CALL ,.* 1 contract ,`) }),
    ).toBeVisible();
  });
});

// EXITS AT ENTRY (#8249). The same spec runs twice: under `orders` with the setting as committed
// (off), and under `orders-exit` with the offline override at `members` (playwright.config.ts). Off,
// a stop-limit or an exit is refused in a sentence and nothing is placed; on, a whole-share limit
// buy carries its take-profit and stop to the broker as one bracket. XLE: the book does not hold it.
const EXIT_ON = (): boolean => test.info().project.name === "orders-exit";

test.describe("Exits at entry: the setting decides", () => {
  test("with the setting off, a stop-limit or an exit is refused in a sentence and nothing is placed", async ({
    page,
  }) => {
    test.skip(EXIT_ON(), "the refusal is the setting-off half");
    const request = page.request;
    const known = new Set((await orders(request)).map((o) => o.id));
    const limitBuy = {
      participantId: ACCOUNT,
      action: "buy",
      symbol: "XLE",
      quantity: 3,
      orderType: "limit",
      limitPrice: 91,
    };
    for (const body of [
      { ...limitBuy, exit: { takeProfit: 95, stop: 85 } },
      { ...limitBuy, orderType: "stop_limit", stopPrice: 92, limitPrice: 92.5 },
    ]) {
      for (const path of ["/api/trade/review", "/api/trade/submit"]) {
        const res = await request.post(path, { data: body });
        expect(res.status(), path).toBe(400);
        expect(((await res.json()) as { refusals: string[] }).refusals[0]).toMatch(
          /nothing was placed/,
        );
      }
    }
    expect((await orders(request)).filter((o) => !known.has(o.id))).toEqual([]);
  });

  test("with the setting on, a limit buy with an exit reviews its dollars, fills, and puts both exits to work", async ({
    page,
  }) => {
    test.skip(!EXIT_ON(), "the bracket is the setting-on half");
    const request = page.request;
    const before = await desk(request);
    expect(before.positions.some((p) => p.symbol === "XLE")).toBe(false);
    const order = {
      participantId: ACCOUNT,
      action: "buy",
      symbol: "XLE",
      quantity: 3,
      orderType: "limit",
      limitPrice: 91,
      exit: { takeProfit: 95, stop: 85 },
    };

    const { preview } = await postJson<{
      preview: { ok: boolean; refusals: string[]; timeInForce: string; exit: object };
    }>(request, "/api/trade/review", order);
    expect(preview.refusals).toEqual([]);
    expect(preview.timeInForce).toBe("gtc");
    expect(preview.exit).toEqual({
      takeProfit: 95,
      stop: 85,
      takeProfitDollars: 12,
      stopDollars: -18,
    });

    const sent = await postJson<{ ok: boolean; orderId?: string }>(
      request,
      "/api/trade/submit",
      order,
    );
    expect(sent.ok).toBe(true);
    const entry = await filled(request, sent.orderId as string);
    expect(entry).toEqual(
      expect.objectContaining({ symbol: "XLE", side: "buy", filledQuantity: 3 }),
    );

    // A flat read: each exit is a working row of its own, at the price the broker holds.
    const body = await getJson<{
      working: (OrderRow & { orderType: string; limitPrice?: number; stopPrice?: number })[];
    }>(request, `/api/trade/orders?participantId=${ACCOUNT}`);
    const exits = body.working.filter((o) => o.symbol === "XLE");
    expect(exits).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ side: "sell", orderType: "limit", limitPrice: 95, quantity: 3 }),
        expect.objectContaining({ side: "sell", orderType: "stop", stopPrice: 85, quantity: 3 }),
      ]),
    );
    expect(exits).toHaveLength(2);
    expect((await desk(request)).positions.find((p) => p.symbol === "XLE")?.quantity).toBe("3");
  });
});

// The form's half of #8249 (PR 2): what a member on a phone sees under each setting. QQQ: the book
// does not hold it, and no other test here buys it.
const dollars = (value: number): string => `$${value.toFixed(2)}`;

test.describe("Exits at entry: the form at 390×844", () => {
  test("with the setting off, the form offers no Stop-Limit and no exit", async ({ page }) => {
    test.skip(EXIT_ON(), "the plain form is the setting-off half");
    await phone(page);
    await page.goto(ROUTES.stockForm);
    const type = page.getByLabel("Order type", { exact: true });
    await type.selectOption("limit");
    await expect(type.locator("option")).toHaveText(["Market", "Limit", "Stop-Market"]);
    await expect(page.getByRole("button", { name: "Add an exit" })).toHaveCount(0);
  });

  test("with the setting on, a limit buy with an exit entered on the form fills, and the position and both exits show", async ({
    page,
  }) => {
    test.skip(!EXIT_ON(), "the bracket is the setting-on half");
    await phone(page);
    const request = page.request;
    expect((await desk(request)).positions.some((p) => p.symbol === "QQQ")).toBe(false);
    // A limit at or above the ask fills on placement; the exits sit well clear of the touch.
    const { ask } = await getJson<{ ask: number }>(request, "/api/trade/quote?symbol=QQQ");
    const limit = Math.ceil(ask) + 1;
    const takeProfit = limit + 5;
    const stop = Math.max(1, Math.floor(ask) - 5);
    const known = new Set((await orders(request)).map((o) => o.id));

    await page.goto(ROUTES.stockForm);
    await page.getByLabel("Symbol", { exact: true }).click();
    await page.keyboard.type("QQQ");
    await page.locator("label", { hasText: /^Shares$/ }).click();
    await page.keyboard.type("2");
    await page.getByLabel("Order type", { exact: true }).selectOption("limit");
    await page.getByLabel("Limit price", { exact: true }).fill(String(limit));
    await page.getByRole("button", { name: "Add an exit" }).click();
    await page.getByLabel("Take-profit", { exact: true }).fill(String(takeProfit));
    await page.getByLabel("Stop", { exact: true }).fill(String(stop));
    await expect(page.getByText(/^Guards regular hours only/)).toBeVisible();
    await page.getByRole("button", { name: "Review order" }).click();
    await expect(page.getByText(`Take-profit ${dollars(takeProfit)} · +`)).toBeVisible();
    await expect(page.getByText(`Stop ${dollars(stop)} · about −`)).toBeVisible();
    await page.getByRole("button", { name: /^Submit order/ }).click();
    await expect(
      page.getByText(
        `Sent with its exits: Take-profit ${dollars(takeProfit)} · Stop ${dollars(stop)}.`,
      ),
    ).toBeVisible();

    // The bracket adds three rows (the entry and its two exits); the entry is the one buy.
    const entryId = async (): Promise<string | undefined> =>
      (await orders(request)).find(
        (o) => !known.has(o.id) && o.symbol === "QQQ" && o.side === "buy",
      )?.id;
    await expect.poll(entryId, POLL).toBeDefined();
    const entry = await filled(request, (await entryId()) as string);
    expect(entry).toEqual(expect.objectContaining({ filledQuantity: 2 }));

    await page.goto(ROUTES.orders);
    await expect(page.getByText(`Take-profit ${dollars(takeProfit)} · GTC`)).toBeVisible();
    await expect(page.getByText(`Stop ${dollars(stop)} · GTC`)).toBeVisible();

    await page.goto(ROUTES.book);
    await expect(page.getByRole("link", { name: /^QQQ ,.* 2 shares ,/ })).toBeVisible();
  });
});
