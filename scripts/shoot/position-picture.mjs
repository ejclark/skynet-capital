// Visual harness for a position's picture (#5070 slices 2 and 2b; round 2 of #5037, R2 "tap opens
// it in place"): the sold CRWV put's guidance opened on the Overview, which now leads with the price
// strip (with the 20-day range and open contracts by strike on its axis), the waiting-earns strip
// and the three figures. PHONE FIRST (docs/PICTURES.md): the 390
// frame proves the curation; the 1280 frame is the same opened guidance under its desk row.
// Sauron's book from the round's frames (2026-10-08): NVDA 130 sh, CRWV 55 sh, one sold CRWV $80
// put to Nov 6 (collected $255, buy-back $550, breakeven $77.45, CRWV $82.60, 75% IV). Paper.
// Slice 3 adds two phone frames: Buy back's ticket in the row (1 of 1 contract, $5.50 limit at the
// mid of $5.30 / $5.70, good for today) and the recap modal the review opens.
// Slice 6 adds the opt-in Full page ›: the put's own page at 390 (its top, then its chart) and 1280,
// leading with the price picture and profit at price, then the ways to play it, fills and dates.
// The carried items add two phone frames: the CRWV shares' Not now naming the 20-day low as its
// early return, and a roll picked to $75 saying where that strike sits against the same facts.
// Usage: npm run build --prefix app && tsx scripts/shoot/position-picture.mjs [outdir]

import { profileStubs } from "./profile-fixture.mjs";
import { openShell } from "./shell.mjs";

const SAURON = { id: "bot-sauron", name: "Sauron", kind: "bot", suspended: false };

const pos = (over) => ({
  detail: "",
  isOption: false,
  dayPct: "+0.0%",
  dayTone: "flat",
  dayPl: "+$0",
  weightPct: 1,
  ...over,
});

const positions = [
  pos({
    symbol: "CRWV261106P00080000",
    display: "CRWV $80 PUT · 6 NOV 26",
    isOption: true,
    quantity: "-1",
    costPerShare: "$255.00",
    price: "$550.00",
    costBasis: "-$255",
    value: "-$550",
    dayPl: "-$60",
    dayTone: "neg",
    totalPl: "-$295",
    totalPlRaw: -295,
    returnPct: "-116%",
    totalTone: "neg",
    plainName: "Sold put · profits if CRWV stays above $80",
    expiresIn: "29 days",
    expiresInDays: 29,
    breakeven: "$77.45",
    best: "+$255",
    worst: "−$7,745",
  }),
  pos({
    symbol: "NVDA",
    display: "NVDA",
    quantity: "130",
    costPerShare: "$223.98",
    price: "$232.10",
    costBasis: "$29,117",
    value: "$30,173",
    dayPl: "+$195",
    dayTone: "pos",
    totalPl: "+$1,056",
    totalPlRaw: 1055.6,
    returnPct: "+3.63%",
    totalTone: "pos",
    plainName: "Shares · profits if NVDA rises",
    expiresIn: "no expiry",
    breakeven: "$223.98",
  }),
  pos({
    symbol: "CRWV",
    display: "CRWV",
    quantity: "55",
    costPerShare: "$90.10",
    price: "$82.60",
    costBasis: "$4,956",
    value: "$4,543",
    totalPl: "-$412",
    totalPlRaw: -412.5,
    returnPct: "-8.32%",
    totalTone: "neg",
    plainName: "Shares · profits if CRWV rises",
    expiresIn: "no expiry",
    breakeven: "$90.10",
  }),
];

// The Overview's hero chart reads a curve and SPY's bars: a flat month is enough for a frame whose
// subject is further down the page.
const days = Array.from({ length: 22 }, (_, i) => new Date(Date.UTC(2026, 8, 9 + i)).toISOString());
const curve = { range: "1M", points: days.map((t) => ({ t, value: 1_000_000 })) };
const bars = {
  symbol: "SPY",
  bars: days.map((t) => ({ t, o: 560, h: 560, l: 560, c: 560, v: 0 })),
};

const base = profileStubs([SAURON]);
const { page, origin, shoot, close } = await openShell({
  name: "position-picture",
  stubs: {
    ...base,
    "/api/desk/bot-sauron": {
      generatedAt: "2026-10-08T19:00:00Z",
      desk: {
        ...SAURON,
        considerations: [],
        decisions: [],
        allocation: {
          shares: "$34,716",
          options: "$0",
          optionsSold: "-$550",
          cash: "$965,284",
          sharesPct: 3.5,
          optionsPct: 0,
          cashPct: 96.5,
          cashShare: "96.5%",
          shareCount: 185,
        },
        positions,
      },
    },
    "/api/accounts/bot-sauron/equity-curve": curve,
    // The full page's Fills and Dates (slice 6): the stock's narrowed ledger.
    "/api/desk/bot-sauron/activity": {
      available: true,
      activity: [
        {
          orderId: "o-put",
          symbol: "CRWV261106P00080000",
          display: "CRWV $80 PUT · 6 NOV 26",
          side: "sell",
          quantity: 1,
          filled: 1,
          price: "$2.55",
          status: "filled",
          at: "2026-10-08T14:31:00.000Z",
          backfilled: false,
          origin: "desk",
        },
        {
          orderId: "o-crwv",
          symbol: "CRWV",
          display: "CRWV",
          side: "buy",
          quantity: 55,
          filled: 55,
          price: "$90.10",
          status: "filled",
          at: "2026-09-21T14:00:00.000Z",
          backfilled: false,
          origin: "desk",
        },
      ],
    },
    "/api/trade/bars": bars,
    "/api/trade/option-positions": {
      available: true,
      asOf: "2026-10-08T19:00:00Z",
      rows: [
        {
          symbol: "CRWV261106P00080000",
          display: "CRWV $80 PUT · 6 NOV 26",
          underlying: "CRWV",
          type: "put",
          strike: 80,
          expiration: "2026-11-06",
          daysToExpiry: 29,
          contracts: -1,
          spot: 82.6,
          impliedVol: 0.75,
          positionGreeks: { delta: 39.8, gamma: -2.1, theta: 11.46, vega: -9.4 },
        },
      ],
      book: {
        delta: 39.8,
        gamma: -2.1,
        theta: 11.46,
        vega: -9.4,
        covered: 1,
        total: 1,
        uncovered: [],
      },
      representative: true,
    },
  },
});

// Slice 2b's price context, round 2's illustrative numbers: CRWV's 20-day range $78.90–$96.30
// (average $87.60), and open contracts on the put's own Nov 6 chain. Registered after the shell's
// catch-all, so these win for CRWV while SPY's hero bars stay flat.
const crwvBars = Array.from({ length: 20 }, (_, i) => {
  const c = 87.6 + 6 * Math.sin(i / 3);
  return { t: days[i], o: c, h: i === 4 ? 96.3 : c + 1.2, l: i === 13 ? 78.9 : c - 1.2, c, v: 1 };
});
await page.route("**/api/trade/bars?symbol=CRWV*", (route) =>
  route.fulfill({ json: { symbol: "CRWV", bars: crwvBars } }),
);
const open = { 65: 600, 70: 800, 75: 1900, 80: 3200, 85: 1400, 90: 2600, 95: 1100, 100: 700 };
await page.route("**/api/trade/chain?*", (route) =>
  route.fulfill({
    json: {
      symbol: "CRWV",
      optionType: "put",
      expirations: ["2026-11-06"],
      expiration: "2026-11-06",
      spot: 82.6,
      rows: Object.entries(open).map(([strike, openInterest]) => ({
        strike: Number(strike),
        occSymbol: `CRWV261106P${String(Number(strike) * 1000).padStart(8, "0")}`,
        openInterest,
        ...(strike === "80" ? { bid: 5.3, ask: 5.7 } : {}),
      })),
    },
  }),
);

await page.clock.setFixedTime(new Date("2026-10-08T19:00:00Z"));

// --- PHONE FIRST (390px) ---
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${origin}/app/accounts?account=bot-sauron`);
const call = page.locator(".pos-cards .pos-guide-call", { hasText: "CRWV $80 PUT" }).first();
await call.waitFor();
await call.click();
await page.locator(".pos-cards .pp").first().waitFor();
// The Profile head stays stuck at the top on a phone: land the opened line just under it.
const head = await page.locator(".cockpit-head, .profile-head").first().boundingBox();
const line = page.locator(".pos-cards .pos-guide-open").first();
await line.evaluate(
  (el, top) => {
    const y = el.getBoundingClientRect().top + window.scrollY - top - 44;
    window.scrollTo(0, y);
  },
  (head?.y ?? 0) + (head?.height ?? 240),
);
await page.waitForTimeout(150);
await shoot("position-picture-390");

// --- DESK (1280px): the same guidance opened under its table row ---
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(`${origin}/app/accounts?account=bot-sauron`);
const deskCall = page.locator(".blotter .pos-guide-call", { hasText: "CRWV $80 PUT" }).first();
await deskCall.waitFor();
await deskCall.click();
await page.locator(".blotter .pp").first().waitFor();
await page
  .locator(".blotter .row-guide")
  .first()
  .evaluate((el) => el.scrollIntoView());
await page.evaluate(() => window.scrollBy(0, -140));
await page.waitForTimeout(150);
await shoot("position-picture-1280");

// --- ACT IN THE ROW (slice 3), phone: the ticket, then the recap the review opens ---
await page.route("**/api/trade/option/review", (route) => {
  const draft = route.request().postDataJSON();
  return route.fulfill({
    json: {
      preview: {
        code: "close",
        underlying: "CRWV",
        side: "buy",
        positionIntent: "buy_to_close",
        contracts: draft.contracts,
        orderType: "limit",
        limitPrice: draft.limitPrice,
        timeInForce: draft.timeInForce,
        ok: true,
        estNotional: draft.limitPrice * 100 * draft.contracts,
        refusals: [],
        warnings: [],
      },
    },
  });
});
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${origin}/app/accounts?account=bot-sauron`);
await call.waitFor();
await call.click();
await page.locator(".pos-cards .pp").first().waitFor();
await page.locator(".pos-cards .pos-act-btn", { hasText: "Buy back" }).first().click();
const ticket = page.locator(".pos-cards .pos-tkt").first();
await ticket.locator("input[value='5.50']").waitFor();
await ticket.evaluate((el) => el.scrollIntoView({ block: "center" }));
await page.waitForTimeout(150);
await shoot("position-act-390");
await ticket.getByRole("button", { name: "Review buy-back" }).click();
await page.locator("dialog.pos-recap[open]").waitFor();
await page.waitForTimeout(200);
await shoot("position-recap-390");

// --- CARRIED ITEMS, phone: a share row's Not now names its 20-day low, and the roll's strike is
// said against the picture's facts once a strike is picked ---
await page.goto(`${origin}/app/accounts?account=bot-sauron`);
const shares = page
  .locator(".pos-cards")
  .getByRole("button", { name: "Guidance for CRWV", exact: true })
  .first();
await shares.waitFor();
await shares.click();
const sharesOpen = page
  .locator(".pos-cards .pos-guide-open", { hasText: "its 20-day low" })
  .first();
await sharesOpen.waitFor();
await sharesOpen.locator(".pos-act").evaluate((el) => el.scrollIntoView({ block: "center" }));
await page.waitForTimeout(150);
await shoot("share-not-now-390");
await page.goto(`${origin}/app/accounts?account=bot-sauron`);
await call.waitFor();
await call.click();
await page.locator(".pos-cards .pp").first().waitFor();
await page.locator(".pos-cards .pos-act-btn", { hasText: "Roll" }).first().click();
const roll = page.locator(".pos-cards .pos-tkt").first();
await roll.getByLabel("Strike").selectOption("75");
await roll.locator(".tkt-roll-note", { hasText: "$75" }).waitFor();
await roll.evaluate((el) => el.scrollIntoView({ block: "center" }));
await page.waitForTimeout(150);
await shoot("roll-strike-390");

// --- FULL PAGE › (slice 6): the opt-in deep dive, phone first, then the desk ---
const openPage = async (scope) => {
  await page.goto(`${origin}/app/accounts?account=bot-sauron`);
  const guide = page.locator(`${scope} .pos-guide-call`, { hasText: "CRWV $80 PUT" }).first();
  await guide.waitFor();
  await guide.click();
  await page.locator(`${scope} .pos-guide-page`).first().click();
  await page.locator(".ppage-chart-art").waitFor();
  await page.locator(".ppage-fills li").first().waitFor();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
};
await page.setViewportSize({ width: 390, height: 844 });
await openPage(".pos-cards");
const head390 = await page.locator(".cockpit-head, .profile-head").first().boundingBox();
await page
  .locator(".ppage")
  .evaluate(
    (el, top) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - top),
    (head390?.y ?? 0) + (head390?.height ?? 0),
  );
await page.waitForTimeout(150);
await shoot("position-page-390");
// Further down the same page: profit at price, then the ways to play it.
await page
  .locator(".ppage-chart")
  .evaluate(
    (el, top) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - top - 8),
    (head390?.y ?? 0) + (head390?.height ?? 0),
  );
await page.waitForTimeout(150);
await shoot("position-page-chart-390");
// "← Positions" returns to the same row, still open.
await page.getByRole("button", { name: "Back to Positions" }).click();
await page.locator(".pos-cards .pp").first().waitFor();
await page.waitForTimeout(400);
await shoot("position-page-back-390");

await page.setViewportSize({ width: 1280, height: 900 });
await openPage(".blotter");
const head1280 = await page.locator(".cockpit-head, .profile-head").first().boundingBox();
await page
  .locator(".ppage")
  .evaluate(
    (el, top) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - top),
    (head1280?.y ?? 0) + (head1280?.height ?? 0),
  );
await page.waitForTimeout(150);
await shoot("position-page-1280");

await close();
