// Visual harness for the ticket's receipt (Eric, 2026-11-06: a sent order's entries persisting
// "sends signals that the trade didn't execute"; an unfilled order should be one you can modify or
// cancel, a filled one one you can roll or close). The REAL built shell over stub APIs, PHONE FIRST
// (docs/PICTURES.md): a sold put is reviewed and sent, and the frames are the receipt that replaces
// the form — working (Modify · Cancel order), the change drawer open, filled (Close or roll), and the
// empty ticket "New ticket" hands back. JPEG ≤100KB.
// Usage: npm run build --prefix app && npx tsx scripts/shoot/trade-receipt.mjs [outdir]
import { resolve } from "node:path";
import { shooter } from "./lib.mjs";
import { openShell } from "./shell.mjs";
import { currentOptionReview, desk } from "./trade-account-fixture.mjs";
import { deliveryOff, noAlerts } from "./trade-alerts-fixture.mjs";
import { bars, chain, quote } from "./trade-chart-fixture.mjs";
import { draftSent, noLifecycle } from "./trade-draft-fixture.mjs";
import { settings, throughLongs } from "./trade-plays-fixture.mjs";
import { tradeStubs } from "./trade-stubs.mjs";

const OCC = "NVDA261016P00175000";
const ORDER_ID = "2ebcf855-387c-4d9f-9017-9d71571de193";
const CONTRACTS = 20;

/** The broker's list holding the sent order — working, or filled. */
const listed = (over) => ({
  available: true,
  asOf: "2026-09-21T14:00:00Z",
  working: [],
  recent: [],
  ...over,
});
const row = (over = {}) => ({
  id: ORDER_ID,
  symbol: OCC,
  display: "NVDA $175 PUT · 16 OCT 26",
  unit: "contracts",
  side: "sell",
  orderType: "limit",
  quantity: CONTRACTS,
  filledQuantity: 0,
  limitPrice: 1.5,
  timeInForce: "day",
  submittedAt: "2026-09-21T14:00:00Z",
  state: "working",
  cancelable: true,
  replaceable: true,
  ...over,
});
const working = listed({ working: [row()] });
const filled = listed({
  recent: [
    row({ state: "filled", filledQuantity: CONTRACTS, avgFillPrice: 1.52, cancelable: false }),
  ],
});
let currentOrders = working;

const review = {
  preview: {
    ...currentOptionReview.preview,
    contracts: CONTRACTS,
    estNotional: 3_000,
    collateral: 350_000,
    maxProfit: 3_000,
    maxLoss: 347_000,
  },
};

const out = resolve(process.argv[2] ?? "docs/shots/trade-receipt");
const { page, origin, close } = await openShell({
  name: "trade-receipt",
  viewport: { width: 390, height: 844 },
  stubs: {
    ...tradeStubs({
      plays: () => throughLongs,
      settings: () => settings,
      desk: () => desk,
      quote: () => quote,
      chain: () => chain,
      bars: () => bars,
      orders: () => currentOrders,
      lifecycle: () => noLifecycle,
      alerts: () => noAlerts,
      delivery: () => deliveryOff,
      watchlist: () => ({ ok: true, available: true, limit: 20, watching: [] }),
      draftScript: () => [],
      draftFallback: () => draftSent,
    }),
    "/api/trade/option/review": review,
    "/api/trade/option/submit": {
      ok: true,
      orderId: ORDER_ID,
      status: "pending_new",
      symbol: OCC,
      timeInForce: "day",
    },
  },
});
const shoot = shooter(page, out);

/** Review and send a 20-contract sold put, then frame the receipt from the panel's title down. */
async function send() {
  await page.goto(`${origin}/app/trade?play=201&symbol=NVDA&strike=175`);
  const contracts = page.getByLabel("Contracts (100 shares)");
  await contracts.waitFor();
  await contracts.fill(String(CONTRACTS));
  await page.getByRole("button", { name: "Review order" }).click();
  await page.getByRole("button", { name: /Submit order/ }).click();
  await page.getByRole("region", { name: "Order receipt" }).waitFor();
  await page.waitForTimeout(400);
  await frameReceipt();
}

/** The receipt at the frame's foot (it ends the page), the play name and quote above it. */
async function frameReceipt() {
  await page.locator(".gate-panel").evaluate((panel) => {
    const anchor = panel.querySelector(".receipt") ?? panel.querySelector(".gate-fields") ?? panel;
    anchor.scrollIntoView({ block: "end", behavior: "instant" });
    window.scrollBy({ top: 24, behavior: "instant" });
  });
  await page.waitForTimeout(600);
}

await send();
await page.getByRole("button", { name: "Cancel order" }).waitFor();
// The sent strike leaves the URL after the submit; frame again once that navigation has settled.
await page.waitForTimeout(300);
await frameReceipt();
await shoot("receipt-working-phone");

await page
  .getByRole("region", { name: "Order receipt" })
  .getByRole("button", { name: "Modify" })
  .click();
await page.locator(".wo-modify").waitFor();
await shoot("receipt-modify-phone");

// Docked at the bench width, the Orders pane below lists the same order — the receipt's own
// controls are the ones in its region.
await page.setViewportSize({ width: 1280, height: 900 });
const receipt = page.getByRole("region", { name: "Order receipt" });
await receipt.getByRole("button", { name: "Modify" }).click();
await receipt.scrollIntoViewIfNeeded();
await shoot("receipt-working-desktop");
await page.setViewportSize({ width: 390, height: 844 });

currentOrders = filled;
await send();
await page.getByRole("link", { name: "Close or roll this position →" }).waitFor();
await page.waitForTimeout(300);
await frameReceipt();
await shoot("receipt-filled-phone");

await page.getByRole("button", { name: "New ticket" }).click();
await page.getByLabel("Symbol").waitFor();
await page.waitForTimeout(300);
await frameReceipt();
await shoot("receipt-new-ticket-phone");

await close();
