// Visual harness for /app/trade (#1461) — the milestone rail over the ticket, from the REAL built
// shell over stub APIs, as a member one fill in sees it: 101 earned, 102 next up, 201+ locked with
// the rung that opens each named. Two frames, PHONE FIRST (docs/PICTURES.md → "Trading surfaces
// shoot the phone frame first"): the 390px frame proves the curation, the desktop frame proves it
// expanded instead of floating. JPEG ≤100KB.
// Usage: npm run build --prefix app && npm run shoot:trade [outdir]
import { openShell } from "./shell.mjs";

const play = (code, name, tldr, kind, side, optionType, state, opensAfter) => ({
  code,
  id: code,
  name,
  tldr,
  kind,
  side,
  ...(optionType ? { optionType } : {}),
  gloss: "",
  locked: state === "locked",
  earned: state === "earned",
  ...(opensAfter ? { opensAfter } : {}),
});
const plays = {
  linked: true,
  wheels: true,
  nextUp: "102",
  plays: [
    play("101", "Buy stock", "own the shares", "stock", "buy", undefined, "earned"),
    play("102", "Sell stock", "take profit or cut a loss", "stock", "sell", undefined, "open"),
    play(
      "201",
      "Sell a cash-secured put",
      "get paid to buy stock at a discount",
      "option",
      "sell",
      "put",
      "locked",
      { code: "102", name: "Sell stock" },
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

const { page, origin, shoot, close } = await openShell({
  name: "trade",
  viewport: { width: 390, height: 844 },
  stubs: { "/api/trade/plays": plays, "/api/settings": settings, "/api/desk/*": desk },
});

await page.goto(`${origin}/app/trade?play=102`);
await page.getByText("Milestone · Trading ladder").waitFor();
await shoot("trade-phone");

await page.setViewportSize({ width: 1280, height: 900 });
await shoot("trade-desktop");

// A locked preset (#1461 slice 2): the rail can point at 301, the nav shows "Buy to open" disabled
// with the rung that opens it, and the ticket shows its locked panel. Visible, disabled, explained.
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${origin}/app/trade?play=301`);
await page.getByText("Buy to open: opens after 202 fills").waitFor();
await shoot("trade-locked-phone");

await close();
