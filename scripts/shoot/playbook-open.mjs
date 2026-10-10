// Visual harness for a playbook card opened in full (#5073 slice 3; #5037 round 2, R2-open): the
// rule as a picture with "you are here", what the bot holds in its ticker, and whose say-so it
// runs on. Sauron's paper book from the round's study, Fri Oct 9 2026, 3:00 PM ET: NVDA 130 sh,
// CRWV 55 sh at $82.60, a sold CRWV $80 put to Nov 6 (breakeven $77.45). The Store view is the
// server's own builder over Sauron's subscriptions (CRWV-WHEEL on its owner's conviction), never
// hand-written copy; the heartbeat, roll call and lanes are the lanes shoot's fixture.
// Frames: CRWV-WHEEL opened at 390, S1-NVDA opened at 390, CRWV-WHEEL opened at 1280.
// Usage: npm run build --prefix app && npx tsx scripts/shoot/playbook-open.mjs [outdir]

import { playbookStoreView } from "../../src/observatory/playbook-store-json-view.ts";
import { accountsFixture } from "./accounts-fixture.mjs";
import { openShell } from "./shell.mjs";

const stubs = await accountsFixture();
const NOW = Date.parse("2026-10-09T19:00:00Z"); // Fri 3:00 PM New York
const AT = "2026-10-01T14:00:00.000Z";
const PUT = "CRWV261106P00080000";

const subscription = (playbookId, mode, over = {}) => ({
  accountId: "bot-sauron",
  playbookId,
  mode,
  enabled: true,
  createdAt: AT,
  updatedAt: AT,
  ...over,
});
const store = playbookStoreView(
  [
    subscription("SAURON", "aggressive"),
    subscription("CRWV-WHEEL", "aggressive", {
      capitalAllocated: 10_000,
      conviction: {
        reason: "CRWV's premium pays me to wait for a lower entry.",
        checkOn: "2027-01-29",
      },
    }),
    subscription("S1-NVDA", "standard"),
    subscription("NVDA-CALL-SPREAD", "aggressive"),
    subscription("G1-GOOG", "standard"),
  ],
  false,
  [],
  false,
  new Date(NOW).toISOString(),
);

const row = (symbol, display, quantity, over) => ({
  symbol,
  display,
  detail: "",
  isOption: symbol.length > 6,
  quantity,
  dayPct: "",
  weightPct: 0,
  ...over,
});
const base = stubs["/api/desk/bot-sauron"];
const desk = {
  ...base,
  generatedAt: new Date(NOW).toISOString(),
  desk: {
    ...base.desk,
    decisions: [],
    positions: [
      row("NVDA", "NVDA", "130", {
        costPerShare: "$223.98",
        price: "$232.10",
        costBasis: "$29,117",
        value: "$30,173",
        dayPl: "+$221",
        dayTone: "pos",
        totalPl: "+$1,056",
        totalPlRaw: 1056,
        returnPct: "+3.6%",
        totalTone: "pos",
        breakeven: "$223.98",
      }),
      row("CRWV", "CRWV", "55", {
        costPerShare: "$90.09",
        price: "$82.60",
        costBasis: "$4,955",
        value: "$4,543",
        dayPl: "-$66",
        dayTone: "neg",
        totalPl: "-$412",
        totalPlRaw: -412,
        returnPct: "-8.3%",
        totalTone: "neg",
        breakeven: "$90.09",
      }),
      row(PUT, "CRWV $80 put", "-1", {
        costPerShare: "$2.55",
        price: "$5.50",
        costBasis: "-$255",
        value: "-$550",
        dayPl: "-$40",
        dayTone: "neg",
        totalPl: "-$295",
        totalPlRaw: -295,
        returnPct: "-116%",
        totalTone: "neg",
        breakeven: "$77.45",
        expiresIn: "28 days",
        expiresInDays: 28,
      }),
    ],
  },
};
const optionPositions = {
  available: true,
  asOf: new Date(NOW).toISOString(),
  rows: [
    {
      symbol: PUT,
      display: "CRWV $80 put",
      underlying: "CRWV",
      type: "put",
      strike: 80,
      expiration: "2026-11-06",
      daysToExpiry: 28,
      contracts: -1,
      spot: 82.6,
      positionGreeks: { delta: 40, gamma: -2.1, theta: 11, vega: -9 },
    },
  ],
  book: { delta: 40, gamma: -2.1, theta: 11, vega: -9, covered: 1, total: 1, uncovered: [] },
  representative: true,
};

const heartbeatBase = (
  typeof stubs["/api/desk/bot-sauron/heartbeat"] === "function"
    ? stubs["/api/desk/bot-sauron/heartbeat"]()
    : stubs["/api/desk/bot-sauron/heartbeat"]
).heartbeat;
const heartbeat = () => ({
  available: true,
  heartbeat: {
    ...heartbeatBase,
    state: "beating",
    marketOpen: true,
    lastPassAt: new Date(NOW - 20_000).toISOString(),
    sinceLastPassMs: 20_000,
  },
});

const { page, origin, shoot, close } = await openShell({
  name: "playbook-open",
  viewport: { width: 390, height: 1500 },
  // The 1280 frame carries the whole opened card; 54 keeps it under the ~100KB a committed shot gets.
  quality: 54,
  stubs: {
    ...stubs,
    "/api/desk/bot-sauron": desk,
    "/api/desk/bot-sauron/heartbeat": heartbeat,
    "/api/playbook-store": store,
    "/api/trade/option-positions": optionPositions,
  },
});
await page.clock.setFixedTime(new Date(NOW));
await page.emulateMedia({ reducedMotion: "reduce" });
const cdp = await page.context().newCDPSession(page);
await cdp.send("Emulation.setTimezoneOverride", { timezoneId: "America/New_York" });

const section = `${origin}/app/accounts?account=bot-sauron&section=playbooks`;
/** Open one card and bring it just under the sticky head. */
async function openCard(name, ready) {
  await page.goto(section);
  await page.locator(".pbb-cards .pbb-name", { hasText: name }).first().waitFor();
  await page.locator(".pbb-cards .pbb-name", { hasText: name }).first().click();
  await page.locator(ready).first().waitFor();
  await page.evaluate((n) => {
    const card = [...document.querySelectorAll(".pbb-card")].find(
      (c) => c.querySelector(".pbb-name")?.textContent === n,
    );
    const sticky = document.querySelector(".cockpit-head")?.getBoundingClientRect().bottom ?? 0;
    if (card) window.scrollBy(0, card.getBoundingClientRect().top - sticky - 8);
  }, name);
}

await openCard("CRWV-WHEEL", ".pbr-strip");
await page.locator(".pbo-holds .pos-card").first().waitFor();
await shoot("playbook-open-wheel-phone");

await openCard("S1-NVDA", ".pbr-window");
await shoot("playbook-open-window-phone");

await page.setViewportSize({ width: 1280, height: 1300 });
await openCard("CRWV-WHEEL", ".pbr-strip");
await page.locator(".pbo-holds .pos-card").first().waitFor();
await shoot("playbook-open-wheel-desktop");

await close();
