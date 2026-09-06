// Visual harness for /app/trade (#1461) — the milestone rail over the ticket, from the REAL built
// shell over stub APIs. PHONE FIRST (docs/PICTURES.md → "Trading surfaces shoot the phone frame
// first"): the 390px frame proves the curation, the desktop frame proves it expanded instead of
// floating. JPEG ≤100KB.
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

// Day one: nothing filled. 102 is LOCKED here — an exit is exempt from the feedback wall, never
// from the per-rung ladder lock (`unlockedCodes`) — which is the fact the 2026-09-06 fix restores.
const freshPlays = {
  linked: true,
  wheels: true,
  nextUp: "101",
  plays: [
    play("101", "Buy stock", "own the shares", "stock", "buy", undefined, "open"),
    play("102", "Sell stock", "take profit or cut a loss", "stock", "sell", undefined, "locked", {
      code: "101",
      name: "Buy stock",
    }),
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

// One fill in: 101 earned, 102 the next-up frontier and correctly open.
const plays = {
  ...freshPlays,
  nextUp: "102",
  plays: freshPlays.plays.map((p) =>
    p.code === "101"
      ? { ...p, locked: false, earned: true }
      : p.code === "102"
        ? { ...p, locked: false, opensAfter: undefined }
        : p,
  ),
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

let currentPlays = freshPlays;
const { page, origin, shoot, close } = await openShell({
  name: "trade",
  viewport: { width: 390, height: 844 },
  stubs: { "/api/trade/plays": () => currentPlays, "/api/settings": settings, "/api/desk/*": desk },
});

// THE BUG THIS FIXES (2026-09-06): a fresh account, nothing earned. 102 (Sell stock) used to open
// a fully working, submittable ticket here — `trade-gate.tsx` never checked `play.locked` at all,
// even though `unlockedCodes` already said 102 stays shut until 101 is earned. Proof it's fixed:
// the same locked panel a locked OPTION rung has always shown now shows for 102 too.
await page.goto(`${origin}/app/trade?play=102`);
await page.getByText("hasn't been unlocked yet").waitFor();
await shoot("trade-102-locked-phone");

currentPlays = plays;
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
