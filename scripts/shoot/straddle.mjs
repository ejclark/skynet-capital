// Visual harness for the straddle view (#1481 slice 1) — the options chain as the entry instrument,
// from the REAL built shell over stub APIs: a member one round-trip in opens rung 201, types NVDA,
// and gets one expiration's chain with the strike down the centre, calls left, puts right, the
// current-price divider and the in-the-money rails. PHONE FIRST (docs/PICTURES.md → "Trading
// surfaces shoot the phone frame first"). JPEG ≤100KB.
// Usage: npm run build --prefix app && npm run shoot:straddle [outdir]
import { openShell } from "./shell.mjs";

const play = (code, name, tldr, kind, side, optionType, state, opensAfter) => ({
  code,
  id: code,
  name,
  tldr,
  kind,
  side,
  ...(optionType ? { optionType } : {}),
  gloss: "get paid a premium now for promising to buy 100 shares at your strike.",
  locked: state === "locked",
  earned: state === "earned",
  ...(opensAfter ? { opensAfter } : {}),
});
const plays = {
  linked: true,
  wheels: true,
  nextUp: "201",
  plays: [
    play("101", "Buy stock", "own the shares", "stock", "buy", undefined, "earned"),
    play("102", "Sell stock", "take profit or cut a loss", "stock", "sell", undefined, "earned"),
    play(
      "201",
      "Sell a cash-secured put",
      "get paid to buy stock at a discount",
      "option",
      "sell",
      "put",
      "open",
    ),
    play(
      "202",
      "Sell a covered call",
      "get paid to cap your upside",
      "option",
      "sell",
      "call",
      "locked",
      { code: "201", name: "Sell a cash-secured put" },
    ),
    play("301", "Buy a long put", "profit when a stock falls", "option", "buy", "put", "locked", {
      code: "202",
      name: "Sell a covered call",
    }),
    play("302", "Buy a long call", "profit when a stock rises", "option", "buy", "call", "locked", {
      code: "301",
      name: "Buy a long put",
    }),
  ],
};
const settings = {
  authConfigured: true,
  adminWired: false,
  fleetSuspended: false,
  timezones: [],
  accounts: [
    { id: "human-eric", name: "Eric", kind: "human", hostConfigured: false, profile: null },
  ],
};
const desk = {
  generatedAt: "2026-09-05T00:00:00Z",
  desk: {
    id: "human-eric",
    name: "Eric",
    kind: "human",
    positions: [],
    tiles: {
      openPositions: 0,
      invested: "$0.00",
      dayPl: "$0.00",
      dayTone: "flat",
      unrealized: "$0.00",
      unrealizedNote: "no positions",
      unrealizedTone: "flat",
      cash: "$1,000,000.00",
    },
  },
};

// One expiration around a $230.36 spot; calls fall and puts rise with the strike, the shape a
// real chain has near the money. Both sides answer from the query string's `type`.
const strikes = [220, 222.5, 225, 227.5, 230, 232.5, 235, 237.5, 240, 242.5, 245];
const rows = (type) =>
  strikes.map((strike, i) => {
    const mid = type === "call" ? Math.max(0.1, 10.5 - i * 1.15) : Math.max(0.1, 0.3 + i * 1.2);
    return {
      strike,
      occSymbol: `NVDA260909${type === "call" ? "C" : "P"}${String(strike * 1000).padStart(8, "0")}`,
      premium: Number(mid.toFixed(2)),
      bid: Number((mid - 0.08).toFixed(2)),
      ask: Number((mid + 0.08).toFixed(2)),
      openInterest: 1000 + i * 137,
    };
  });
const chain = (type) => ({
  symbol: "NVDA",
  optionType: type,
  expirations: ["2026-09-09", "2026-09-11", "2026-09-16"],
  expiration: "2026-09-09",
  spot: 230.36,
  rows: rows(type),
});

const { page, origin, shoot, close } = await openShell({
  name: "straddle",
  viewport: { width: 390, height: 844 },
  stubs: { "/api/trade/plays": plays, "/api/settings": settings, "/api/desk/*": desk },
});
// The chain answers by `type`, which lives in the query string the shell's pathname stubs drop.
await page.route("**/api/trade/chain*", (route) =>
  route.fulfill({
    json: chain(new URL(route.request().url()).searchParams.get("type") ?? "call"),
  }),
);

// A silent blank frame is the worst failure a shoot can have — surface the page's own errors.
page.on("pageerror", (error) => console.error(`straddle: page error — ${error.message}`));
page.on("console", (msg) => {
  if (msg.type() === "error") console.error(`straddle: console — ${msg.text()}`);
});

await page.goto(`${origin}/app/trade?play=201`);
// Scoped to the ticket's own region: the multi-leg builder further down has an Underlying field
// too, and a bare label lookup reached that one first.
const ticket = page.getByRole("region", { name: "Sell a cash-secured put" });
await ticket.getByLabel("Underlying").fill("NVDA");
await ticket.getByLabel("Underlying").press("Enter");
try {
  await page.getByText("Current price ·").waitFor();
} catch (error) {
  await shoot("straddle-debug");
  throw error;
}
await page.getByText("Chain · NVDA").scrollIntoViewIfNeeded();
await shoot("straddle-phone");

await page.setViewportSize({ width: 1280, height: 900 });
await page.getByText("Chain · NVDA").scrollIntoViewIfNeeded();
await shoot("straddle-desktop");

await close();
