// Visual harness for the Ledger as a receipt (#5317; #5160 rounds 9–15): day dividers, an entry is
// its legs, a round trip ends on a total. Sauron's account in the round-15 world — META bought Tue
// Sep 22 at $742.00 and sold Thu Oct 1 at $761.00 (+$285), a CRWV put written Oct 6, NVDA bought
// Oct 5 — over the real built shell. PHONE FIRST (docs/PICTURES.md): the 390 frame lands on Oct 1's
// META round trip; the 1280 frame is the desk table from the top.
// Usage: npm run build --prefix app && npx tsx scripts/shoot/ledger.mjs [outdir]

import { accountsFixture } from "./accounts-fixture.mjs";
import { openShell } from "./shell.mjs";

const stubs = await accountsFixture();
const NOW = Date.parse("2026-10-09T19:00:00Z"); // Fri 3:00 PM New York

const line = (over) => ({
  quantity: 1,
  filled: 1,
  status: "filled",
  backfilled: false,
  origin: "app",
  ...over,
});
const why = (playbookId, reason) => ({ reason, personaId: "sauron", playbookId });

const metaBuy = line({
  orderId: "meta-buy",
  symbol: "META",
  display: "META",
  side: "buy",
  quantity: 15,
  filled: 15,
  price: "$742.00",
  at: "2026-09-22T14:02:11Z",
});

const activity = {
  available: true,
  playbooks: ["CRWV-WHEEL", "SAURON"],
  activity: [
    line({
      orderId: "put-1",
      symbol: "CRWV261106P00080000",
      display: "CRWV $80 PUT · 6 NOV 26",
      side: "sell",
      price: "$2.55",
      at: "2026-10-06T14:31:04Z",
      reasoning: why("CRWV-WHEEL", "Puts priced CRWV's next month calmer than its own history."),
    }),
    line({
      orderId: "nvda-1",
      symbol: "NVDA",
      display: "NVDA",
      side: "buy",
      quantity: 14,
      filled: 14,
      price: "$226.10",
      at: "2026-10-05T15:20:03Z",
      reasoning: why("SAURON", "Fear on NVDA ran past its buy line while the tape held its range."),
    }),
    line({
      orderId: "amd-1",
      symbol: "AMD",
      display: "AMD",
      side: "buy",
      quantity: 20,
      filled: 0,
      price: "—",
      status: "canceled",
      at: "2026-10-05T14:45:00Z",
      reasoning: why("SAURON", "AMD's dip never reached the buy line before the close."),
    }),
    line({
      orderId: "meta-sell",
      symbol: "META",
      display: "META",
      side: "sell",
      quantity: 15,
      filled: 15,
      price: "$761.00",
      at: "2026-10-01T19:30:40Z",
      realizedPl: "+$285",
      returnPct: "+2.56%",
      realizedTone: "pos",
      reasoning: why("SAURON", "META reached its take-profit line."),
      opened: [{ ...metaBuy, matched: 15 }],
    }),
    {
      ...metaBuy,
      closedOn: "2026-10-01T19:30:40Z",
      reasoning: why("SAURON", "Greed on META cooled under its buy line."),
    },
  ],
};

const { page, origin, shoot, close } = await openShell({
  name: "ledger",
  viewport: { width: 390, height: 844 },
  quality: 60,
  stubs: { ...stubs, "/api/desk/bot-sauron/activity": activity },
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

await page.goto(`${origin}/app/accounts?account=bot-sauron&section=activity`);
await page.locator("#act-meta-sell").waitFor();
await under("#ledger-day-2026-10-01");
await shoot("ledger-phone");

await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(`${origin}/app/accounts?account=bot-sauron&section=activity`);
await page.locator("#act-meta-sell").waitFor();
await shoot("ledger-desktop");

await close();
