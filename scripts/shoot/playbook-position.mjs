// Visual harness for a position's way in to its playbook (#5073 slice 4b; #5037 round 2, R2-pos):
// on a bot's own Overview, a position the playbook opened in full names it in the row's footer —
// "Opened by ◷ CRWV-WHEEL · waiting ›" — and the tag lands on that card on Playbooks, open, with one
// way back to the position. Sauron's book in the round-2 study's world, Fri Oct 9 2026, 3:00 PM ET:
// the CRWV $80 put is CRWV-WHEEL's; the NVDA and CRWV shares came from more than one rule, so they
// name none. Frames: the rows at 390, the card the put's tag lands on at 390, the table at 1280.
// Usage: npm run build --prefix app && npx tsx scripts/shoot/playbook-position.mjs [outdir]

import { playbookStoreView } from "../../src/observatory/playbook-store-json-view.ts";
import { accountsFixture } from "./accounts-fixture.mjs";
import { openShell } from "./shell.mjs";

const stubs = await accountsFixture();
const NOW = Date.parse("2026-10-09T19:00:00Z"); // Fri 3:00 PM New York
const PUT = "CRWV261106P00080000";

const row = (over) => ({
  detail: "",
  isOption: false,
  dayPct: "—",
  dayTone: "flat",
  weightPct: 0,
  ...over,
});
const positions = [
  row({
    symbol: "NVDA",
    display: "NVDA",
    plainName: "Shares · profits if NVDA rises",
    quantity: "130",
    costPerShare: "$223.98",
    price: "$232.10",
    costBasis: "$29,117",
    value: "$30,173",
    dayPl: "+$182",
    dayPct: "+0.61%",
    dayTone: "pos",
    totalPl: "+$1,056",
    totalPlRaw: 1056,
    returnPct: "+3.63%",
    totalTone: "pos",
    weightPct: 86.6,
    expiresIn: "no expiry",
    breakeven: "$223.98",
  }),
  row({
    symbol: "CRWV",
    display: "CRWV",
    plainName: "Shares · profits if CRWV rises",
    quantity: "55",
    costPerShare: "$90.09",
    price: "$82.60",
    costBasis: "$4,955",
    value: "$4,543",
    dayPl: "-$61",
    dayPct: "-1.33%",
    dayTone: "neg",
    totalPl: "-$412",
    totalPlRaw: -412,
    returnPct: "-8.31%",
    totalTone: "neg",
    weightPct: 13.4,
    expiresIn: "no expiry",
    breakeven: "$90.09",
  }),
  row({
    symbol: PUT,
    display: "CRWV $80 PUT · 6 NOV 26",
    detail: "1 ct",
    isOption: true,
    plainName: "Sold put · profits if CRWV stays above $80.00",
    quantity: "-1",
    costPerShare: "$255.00",
    price: "$550.00",
    costBasis: "-$255",
    value: "-$550",
    dayPl: "-$40",
    dayTone: "neg",
    totalPl: "-$295",
    totalPlRaw: -295,
    returnPct: "-116%",
    totalTone: "neg",
    expiresIn: "28 days",
    expiresInDays: 28,
    breakeven: "$77.45",
    best: "+$255",
    worst: "−$7,745",
    // What the server sends the owner when CRWV-WHEEL's orders account for the whole position.
    playbookId: "CRWV-WHEEL",
    playbookMode: "aggressive",
  }),
];
const sauron = stubs["/api/desk/bot-sauron"];
const desk = {
  ...sauron,
  desk: { ...sauron.desk, decisions: [], considerations: [], positions },
};

// The opened card reads the Store (its rule, its say-so): the server's own builder, as the
// landing shoot does — never hand-written copy.
const AT = "2026-10-01T14:00:00.000Z";
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

const { page, origin, shoot, close } = await openShell({
  name: "playbook-position",
  viewport: { width: 390, height: 1000 },
  quality: 58,
  stubs: { ...stubs, "/api/desk/bot-sauron": desk, "/api/playbook-store": store },
});
await page.clock.setFixedTime(new Date(NOW));
await page.emulateMedia({ reducedMotion: "reduce" });

const TAG = /Opened by CRWV-WHEEL/;

/** Bring an element just under the sticky head. */
const under = (selector) =>
  page.evaluate((sel) => {
    const el = [...document.querySelectorAll(sel)].find((e) => e.getClientRects().length > 0);
    const sticky = document.querySelector(".cockpit-head")?.getBoundingClientRect().bottom ?? 0;
    if (el) window.scrollBy(0, el.getBoundingClientRect().top - sticky - 8);
  }, selector);

await page.goto(`${origin}/app/accounts?account=bot-sauron`);
await page.getByRole("link", { name: TAG }).first().waitFor({ state: "attached" });
await page.waitForTimeout(500);
await under(".pos-cards");
await shoot("playbook-position-rows-phone");

await page.locator(".pos-cards").getByRole("link", { name: TAG }).click();
await page.locator(".pbb-card[data-landed]").waitFor();
await page.waitForTimeout(800);
await shoot("playbook-position-card-phone");

await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(`${origin}/app/accounts?account=bot-sauron`);
await page.locator(".blotter").getByRole("link", { name: TAG }).waitFor();
await page.waitForTimeout(500);
await under(".blotter");
await shoot("playbook-position-rows-desktop");

await close();
