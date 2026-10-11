// Visual harness for `/app/saved-positions` (#3968, first frames for #5179) — two saved cards with
// live guidance under them, from the REAL built shell over stub APIs. The market is the position
// guidance specs' own frozen CRWV world (spot $80, every contract priced by our Black-Scholes), so
// each card's calls are the engine's real answer, not a typed-in mock. Phone first
// (docs/PICTURES.md), then desktop; full-page so both cards are in frame. JPEG ≤100KB.
// Usage: npm run build --prefix app && npx tsx scripts/shoot/saved-positions.mjs [outdir]
import { inputs } from "../../tests/options/position-guidance-fixture.ts";
import { shooter } from "./lib.mjs";
import { openShell } from "./shell.mjs";

const { stake: _fixtureStake, ...market } = inputs();

const saved = (id, name, stake) => ({
  id,
  symbol: "CRWV",
  name,
  stake,
  createdAt: "2026-10-10T14:00:00.000Z",
  updatedAt: "2026-10-10T14:00:00.000Z",
});

const { page, origin, out, close } = await openShell({
  name: "saved-positions",
  viewport: { width: 390, height: 844 },
  stubs: {
    "/api/saved-positions": {
      positions: [
        saved("pos-1", "My Fidelity shares", { shares: 400, costBasis: 70, goal: "income" }),
        saved("pos-2", "CRWV (Joe's desk)", { shares: 150, costBasis: 62.1, goal: "keep-shares" }),
      ],
    },
    "/api/settings": {
      accounts: [
        { id: "acct-1", name: "acct-1", kind: "human", hostConfigured: false, profile: null },
      ],
    },
    "/api/trade/guidance": { market },
  },
});
const shoot = shooter(page, out, { quality: 62, fullPage: true });

await page.goto(`${origin}/app/saved-positions`);
await page.locator(".saved-position-calls").nth(1).waitFor();
// #5179's bar at 390: nothing wider than the phone.
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
);
if (overflow > 0) console.warn(`shoot/saved-positions: ${overflow}px sideways scroll at 390`);
await shoot("saved-positions-phone");

await page.setViewportSize({ width: 1280, height: 900 });
await page.locator(".saved-position-calls").nth(1).waitFor();
await shoot("saved-positions-desktop");

await close();
