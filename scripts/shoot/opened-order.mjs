// Visual harness for an opened Activity order (#5262; #5160 round 16, "divider"): the pivots on top,
// the price line, the outcome at expiry split by the strike, then Placed by and Why. Sauron's CRWV
// $80 put in the round-16 world — sold Tue Oct 6 10:31 AM ET at $2.55, CRWV at $82.60 now — over the
// real built shell. PHONE FIRST (docs/PICTURES.md): the 390 frame is the card opened in place; the
// 1280 frame is the desk table's row opened, the picture left and the table right.
// The why is the CRWV wheel's #5326 sentence (the registry's words, as the server sends them).
// Usage: npm run build --prefix app && npx tsx scripts/shoot/opened-order.mjs [outdir]

import { accountsFixture } from "./accounts-fixture.mjs";
import { openShell } from "./shell.mjs";

const stubs = await accountsFixture();
const NOW = Date.parse("2026-10-09T19:00:00Z"); // Fri 3:00 PM New York
const PUT_CHECK = "2026-10-06T14:31:00.000Z";

const activity = {
  available: true,
  playbooks: ["CRWV-WHEEL", "SAURON"],
  activity: [
    {
      orderId: "put-1",
      symbol: "CRWV261106P00080000",
      display: "CRWV $80 PUT · 6 NOV 26",
      side: "sell",
      quantity: 1,
      filled: 1,
      price: "$2.55",
      status: "filled",
      at: "2026-10-06T14:31:04Z",
      backfilled: false,
      origin: "app",
      reasoning: {
        reason:
          "Our study of CRWV: options price its next month to swing at a 69.9%-a-year pace, but in the past year its typical month swung at 88.7%. Puts priced at a 19% chance of being assigned would have been assigned 33% of the time in CRWV's own price history. So the study finds the market under-estimates how far CRWV moves, and says stand aside. Its owner runs this against the study, betting the market has CRWV about right: that its swings calm to the pace options price.",
        personaId: "sauron",
        playbookId: "CRWV-WHEEL",
        playbookMode: "aggressive",
        strategy: "wheel",
        cycleAt: PUT_CHECK,
        rawCount: 2,
        guardedCount: 1,
        contract: "Sell 1 CRWV $80 put, Nov 6",
        cost: "$255.00 received — 1 contract × 100 × $2.55",
        invalidator: "CRWV settles below $80 on 2026-11-06 — the bot buys 100 shares at $80",
        retireRule: "The playbook retires if its net P/L is below 0 on 2027-01-29.",
      },
    },
    {
      orderId: "nvda-1",
      symbol: "NVDA",
      display: "NVDA",
      side: "buy",
      quantity: 14,
      filled: 14,
      price: "$226.10",
      status: "filled",
      at: "2026-10-05T15:20:03Z",
      backfilled: false,
      origin: "app",
      reasoning: {
        reason: "Fear on NVDA ran past its buy line while the tape held its range.",
        personaId: "sauron",
        playbookId: "SAURON",
        playbookMode: "aggressive",
        rawCount: 1,
        guardedCount: 1,
      },
    },
  ],
};

// The harness hands a stub its pathname only, and only the put is opened: CRWV's quote it is.
const quote = { symbol: "CRWV", last: 82.6, change: 0.84, changePct: 1.03, tone: "pos" };

const { page, origin, shoot, close } = await openShell({
  name: "opened-order",
  viewport: { width: 390, height: 844 },
  quality: 60,
  stubs: {
    ...stubs,
    "/api/desk/bot-sauron/activity": activity,
    "/api/trade/quote": quote,
  },
});
await page.clock.setFixedTime(new Date(NOW));
await page.emulateMedia({ reducedMotion: "reduce" });
const cdp = await page.context().newCDPSession(page);
await cdp.send("Emulation.setTimezoneOverride", { timezoneId: "America/New_York" });

/** Bring an element just under the sticky head. */
const under = (selector) =>
  page.evaluate((sel) => {
    const el = document.querySelector(sel);
    const sticky = document.querySelector(".cockpit-head")?.getBoundingClientRect().bottom ?? 0;
    if (el) window.scrollBy(0, el.getBoundingClientRect().top - sticky - 8);
  }, selector);

await page.goto(`${origin}/app/accounts?account=bot-sauron&section=ledger`);
await page.locator("#act-put-1").waitFor();
await page.locator("#act-put-1 .act-card-head").click();
await page.locator("#act-put-1 .pv-pivot", { hasText: "now" }).waitFor();
await under("#act-put-1");
await shoot("opened-order-phone");

await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(`${origin}/app/accounts?account=bot-sauron&section=ledger`);
await page.locator("#act-put-1").waitFor();
await page.locator("#act-put-1 .expand-btn").click();
await page.locator(".row-why .pv-pivot", { hasText: "now" }).waitFor();
await under("#act-put-1");
await shoot("opened-order-desktop");

await close();
