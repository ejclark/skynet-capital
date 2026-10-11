// Visual harness for a position's picture (#5070 slice 2; round 2 of #5037, R2 "tap opens it in
// place"): the sold CRWV put's guidance opened on the Overview, which now leads with the price
// strip, the waiting-earns strip and the three figures. PHONE FIRST (docs/PICTURES.md): the 390
// frame proves the curation; the 1280 frame is the same opened guidance under its desk row.
// Sauron's book from the round's frames (2026-10-08): NVDA 130 sh, CRWV 55 sh, one sold CRWV $80
// put to Nov 6 (collected $255, buy-back $550, breakeven $77.45, CRWV $82.60, 75% IV). Paper.
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

await close();
