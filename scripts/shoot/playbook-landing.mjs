// Visual harness for an order's way in to its playbook (#5073 slice 4a; #5037 round 2, R2-act): an
// opened Activity order names the playbook that placed it as a link, and the link lands on that
// playbook's card on Playbooks — open, the order's mark ringed on its lane, one way back. Sauron in
// the round-2 study's world, Fri Oct 9 2026, 3:00 PM ET: CRWV-WHEEL sold its $80 put Tue 10:31,
// Sauron bought NVDA Mon 11:20. The week, lanes and trades are the lanes shoot's (illustrative, as
// the drawn frames were); the two orders are the same two trades, as the ledger would carry them.
// Frames: the opened order at 390, the card it lands on at 390, the same landing at 1280.
// Usage: npm run build --prefix app && npx tsx scripts/shoot/playbook-landing.mjs [outdir]

import { playbookStoreView } from "../../src/observatory/playbook-store-json-view.ts";
import { accountsFixture } from "./accounts-fixture.mjs";
import { openShell } from "./shell.mjs";

const stubs = await accountsFixture();
const NOW = Date.parse("2026-10-09T19:00:00Z"); // Fri 3:00 PM New York
const DAYS = ["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09"];
const BUCKET = 30 * 60_000;
const sessions = DAYS.map((date) => ({
  date,
  openAt: Date.parse(`${date}T13:30:00Z`),
  closeAt: Date.parse(`${date}T20:00:00Z`),
}));
const begun = (d, b) => sessions[d].openAt + b * BUCKET <= NOW;
const lane = (pick) =>
  DAYS.map((_, d) => Array.from({ length: 13 }, (_, b) => (begun(d, b) ? pick(d, b) : null)));

const base = (
  typeof stubs["/api/desk/bot-sauron/heartbeat"] === "function"
    ? stubs["/api/desk/bot-sauron/heartbeat"]()
    : stubs["/api/desk/bot-sauron/heartbeat"]
).heartbeat;
const today = "2026-10-09T13:30:00Z";
const playbooks = base.playbooks.map((v) => (v.since > "2026-10-09" ? { ...v, since: today } : v));
const slot = (id) => playbooks.findIndex((v) => v.playbookId === id);
const lanes = [
  { playbookId: "SAURON", mode: "aggressive", states: lane(() => "tactical") },
  {
    playbookId: "CRWV-WHEEL",
    mode: "aggressive",
    states: lane((d, b) => (d === 0 || (d === 1 && b <= 1) ? "long" : "no-window")),
  },
  { playbookId: "S1-NVDA", mode: "standard", states: lane(() => "no-window") },
  { playbookId: "NVDA-CALL-SPREAD", mode: "aggressive", states: lane(() => "no-window") },
  { playbookId: "G1-GOOG", mode: "standard", states: lane(() => "no-window") },
  { playbookId: "HC-SAURON", mode: "standard", states: lane(() => "tactical") },
].map((l) => ({ ...l, slot: slot(l.playbookId) }));

const NVDA_CHECK = "2026-10-05T15:20:00.000Z";
const PUT_CHECK = "2026-10-06T14:31:00.000Z";
const trades = [
  {
    at: Date.parse(NVDA_CHECK),
    symbol: "NVDA",
    side: "buy",
    playbookId: "SAURON",
    mode: "aggressive",
  },
  {
    at: Date.parse(PUT_CHECK),
    symbol: "CRWV",
    side: "sell",
    playbookId: "CRWV-WHEEL",
    mode: "aggressive",
  },
];
const heartbeat = () => ({
  available: true,
  heartbeat: {
    ...base,
    state: "beating",
    marketOpen: true,
    lastPassAt: new Date(NOW - 20_000).toISOString(),
    sinceLastPassMs: 20_000,
    playbooks,
    week: {
      bucketMs: BUCKET,
      now: NOW,
      sessions,
      checks: DAYS.map((_, d) => Array.from({ length: 13 }, (_, b) => (begun(d, b) ? 120 : null))),
      gaps: [],
      lanes,
      trades,
    },
  },
});

// The opened card reads the Store (its rule, its say-so): the server's own builder over Sauron's
// subscriptions, as the open-card shoot does — never hand-written copy.
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

/** The two orders the week's two marks stand for, as the ledger carries them. */
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
          "Run on its owner's conviction — CRWV's premium pays to wait for a lower entry. Sold the $80 put, 28 days out.",
        personaId: "sauron",
        playbookId: "CRWV-WHEEL",
        playbookMode: "aggressive",
        strategy: "wheel",
        cycleAt: PUT_CHECK,
        rawCount: 2,
        guardedCount: 1,
        contract: "Sell 1 CRWV $80 put, Nov 6",
        cost: "$255.00 received — 1 contract × 100 × $2.55",
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
        cycleAt: NVDA_CHECK,
        rawCount: 1,
        guardedCount: 1,
      },
    },
  ],
};

const { page, origin, shoot, close } = await openShell({
  name: "playbook-landing",
  viewport: { width: 390, height: 1000 },
  quality: 58,
  stubs: {
    ...stubs,
    "/api/desk/bot-sauron/heartbeat": heartbeat,
    "/api/desk/bot-sauron/activity": activity,
    "/api/playbook-store": store,
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

/** Open the put's order on Activity, then follow its playbook link to the card. */
async function landFromActivity(opened) {
  await page.goto(`${origin}/app/accounts?account=bot-sauron&section=activity`);
  await page.locator("#act-put-1").waitFor();
  await page.locator(opened).click();
  await page.getByRole("link", { name: /CRWV-WHEEL · aggressive — open its card/ }).waitFor();
}

await landFromActivity("#act-put-1 .act-card-head");
await under("#act-put-1");
await shoot("playbook-landing-activity-phone");

await page.getByRole("link", { name: /CRWV-WHEEL · aggressive — open its card/ }).click();
// Where the landing itself puts the card — no scroll of ours — while its mark still shows.
await page.locator(".pbb-card[data-landed] .wk-mark[data-ringed]").waitFor();
await page.waitForTimeout(800);
await shoot("playbook-landing-card-phone");

await page.setViewportSize({ width: 1280, height: 900 });
await landFromActivity("#act-put-1 .expand-btn");
await page.getByRole("link", { name: /CRWV-WHEEL · aggressive — open its card/ }).click();
await page.locator(".pbb-card[data-landed] .wk-mark[data-ringed]").waitFor();
await page.waitForTimeout(800);
await shoot("playbook-landing-card-desktop");

await close();
