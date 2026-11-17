// Visual harness for a suggestion link of Moneypenny's landing on /app/trade (#7547; Eric,
// 2026-11-13: "Stage a trade for nvda… links to the trade section that updates state in a way that
// fills in form variables"). From the REAL built shell over the trade stubs: the standard tier's link
// opens the cash-secured put ticket with the strike, expiry, contracts and limit filled, and the line
// that says whose numbers they are. PHONE FIRST, then desktop.
// Usage: npm run build --prefix app && npm run shoot:trade-suggestion [outdir]

import { openShell } from "./shell.mjs";
import { desk, noOrders } from "./trade-account-fixture.mjs";
import { deliveryOff, noAlerts } from "./trade-alerts-fixture.mjs";
import { bars, chain, quote } from "./trade-chart-fixture.mjs";
import { draftScript, draftSent, noLifecycle } from "./trade-draft-fixture.mjs";
import { settings, throughLongs } from "./trade-plays-fixture.mjs";
import { tradeStubs } from "./trade-stubs.mjs";

const { page, origin, shoot, close } = await openShell({
  name: "trade-suggestion",
  viewport: { width: 390, height: 844 },
  stubs: tradeStubs({
    plays: () => throughLongs,
    settings: () => settings,
    desk: () => desk,
    quote: () => quote,
    chain: () => chain,
    bars: () => bars,
    orders: () => noOrders,
    lifecycle: () => noLifecycle,
    alerts: () => noAlerts,
    delivery: () => deliveryOff,
    watchlist: () => ({ ok: true, available: true, limit: 20, watching: [] }),
    draftScript: () => draftScript,
    draftFallback: () => draftSent,
  }),
});

// The link the tool builds (`suggestionLink`, src/companion/suggest-trades-tool.ts), as she gives it.
const LINK =
  "/app/trade?play=201&symbol=NVDA&strike=177.5&exp=2026-09-09&qty=2&limit=1.40&tier=standard";

await page.goto(`${origin}${LINK}`);
const note = page.getByText(/^Standard option from Moneypenny \(SIM\)/);
await note.waitFor();
await page.waitForTimeout(800);
await shoot("trade-suggestion-phone");

await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(`${origin}${LINK}`);
const desktopNote = page.getByText(/^Standard option from Moneypenny \(SIM\)/);
await desktopNote.waitFor();
// the ticket scrolls itself into view when a suggestion link stages it; let the scroll settle
await page.waitForTimeout(800);
await shoot("trade-suggestion-desktop");

await close();
