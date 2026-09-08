// Visual harness for /app/trade (#1461) — the milestone rail over the ticket, from the REAL built
// shell over stub APIs. PHONE FIRST (docs/PICTURES.md → "Trading surfaces shoot the phone frame
// first"): the 390px frame proves the curation, the desktop frame proves it expanded instead of
// floating. JPEG ≤100KB.
// Usage: npm run build --prefix app && npm run shoot:trade [outdir]
import { resolve } from "node:path";
import { shooter } from "./lib.mjs";
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
    // The ladder extension (#1671): 401 and 501 name their own predecessor exactly like every
    // other rung — the eight-node rail this fixture now proves at phone width.
    play(
      "401",
      "Vertical spread",
      "defined risk, two legs",
      "multi-leg",
      undefined,
      undefined,
      "locked",
      {
        code: "302",
        name: "Buy a long call",
      },
    ),
    play("501", "Zero-DTE", "the fastest clock", "option", undefined, undefined, "locked", {
      code: "401",
      name: "Vertical spread",
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

// Every rung through 302 earned: 401 OPENS for practice (its predecessor is earned) even though
// nothing can execute yet — the rung nobody can fill still stays locked (#1671's own doctrine),
// but the rung itself is open, exactly like any other. 501 stays shut behind it.
const throughLongs = {
  ...freshPlays,
  nextUp: "401",
  plays: freshPlays.plays.map((p) =>
    ["101", "102", "201", "202", "301", "302"].includes(p.code)
      ? { ...p, locked: false, earned: true, opensAfter: undefined }
      : p.code === "401"
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

const quote = { symbol: "NVDA", last: 181.32, change: 2.14, changePct: 1.19, tone: "pos" };

// The empty Wire feed used by every earlier shot that happens to land on a committed symbol
// (`WireRow` mounts under the chain on any of them) — #2017 Phase 1 slice 12's own fixture,
// swapped for a populated one only in that shot's own scene below.
const emptyWire = { wire: { trades: [], pnl: [], feedbackEnabled: false, feedback: [] } };

// Who-else-traded fills for NVDA (#2017 Phase 1 slice 12) — a human buy and a bot sell, newest
// first, real names per the consent doctrine (no anonymizing to prove here).
const nvdaWire = {
  wire: {
    trades: [
      {
        key: "sauron-1",
        side: "sell",
        symbol: "NVDA260918C00180000",
        quantity: 3,
        price: "5.10",
        who: "Sauron",
        whoId: "bot-sauron",
        kind: "bot",
        reconstructed: false,
        when: "2:41p",
      },
      {
        key: "ann-1",
        side: "buy",
        symbol: "NVDA",
        quantity: 100,
        price: "181.02",
        who: "Ann",
        whoId: "human-ann",
        kind: "human",
        reconstructed: false,
        when: "1:58p",
      },
    ],
    pnl: [],
    feedbackEnabled: false,
    feedback: [],
  },
};

// One expiration's put chain around the quote's spot, the same shape `straddle.mjs` uses — needed
// only by the options-ticket quote shot below (#2017 Phase 0.9 review, item 5): with no stub the
// endpoint falls through to `stubBody`'s `{}` default, which `OptionGate` reads as a present-but-
// empty `ChainData` rather than a `chainNote` degrade, and the straddle view crashes on it.
const chain = {
  symbol: "NVDA",
  optionType: "put",
  // 13 sequential Friday-ish weeklies-plus-monthlies (#2017 Phase 0 task 4c) — enough to prove the
  // expiration tab strip actually needs a horizontal swipe at 390px, not just render the 2-3 dates
  // that would have fit in the old <select> just as well.
  expirations: [
    "2026-09-09",
    "2026-09-11",
    "2026-09-16",
    "2026-09-18",
    "2026-09-25",
    "2026-10-02",
    "2026-10-09",
    "2026-10-16",
    "2026-10-23",
    "2026-10-30",
    "2026-11-20",
    "2026-12-18",
    "2027-01-15",
  ],
  expiration: "2026-09-09",
  spot: 181.32,
  rows: [175, 177.5, 180, 182.5, 185].map((strike, i) => ({
    strike,
    occSymbol: `NVDA260909P${String(strike * 1000).padStart(8, "0")}`,
    premium: Number((0.4 + i * 1.1).toFixed(2)),
    bid: Number((0.32 + i * 1.1).toFixed(2)),
    ask: Number((0.48 + i * 1.1).toFixed(2)),
    openInterest: 900 + i * 120,
  })),
};

let currentPlays = freshPlays;
// Mutable so the earnings-badge scenario below can swap in an MU chain/quote without disturbing
// every earlier shot's fixed NVDA fixtures (mirrors `currentPlays`'s own pattern).
let currentChain = chain;
let currentQuote = quote;
// `/api/wire` matches by pathname alone (the shoot harness's stub matcher strips the query
// string before looking a stub up — `lib.mjs`'s `stubBody`), so one exact key covers every
// `?symbol=` this script commits, same as `/api/trade/chain` above.
let currentWire = emptyWire;
const { page, origin, shoot, close } = await openShell({
  name: "trade",
  viewport: { width: 390, height: 844 },
  stubs: {
    "/api/trade/plays": () => currentPlays,
    "/api/settings": settings,
    "/api/desk/*": desk,
    "/api/trade/quote": () => currentQuote,
    "/api/trade/chain": () => currentChain,
    "/api/wire": () => currentWire,
  },
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

// The quote header (#2017 Phase 0.9): last price, day $ change and % change, with a glyph + sign
// carrying tone alongside colour (a standing reader is red/green colourblind — hue never carries
// meaning alone).
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${origin}/app/trade?play=101&symbol=NVDA`);
await page.getByText("▲").waitFor();
await shoot("trade-quote-phone");

await page.setViewportSize({ width: 1280, height: 900 });
await shoot("trade-quote-desktop");

// The options ticket's own quote header (#2017 Phase 0.9 review, item 5) — the same header, on
// an unlocked option play (201 needs the ladder through 102 earned, so `throughLongs` here).
currentPlays = throughLongs;
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${origin}/app/trade?play=201&symbol=NVDA`);
await page.getByText("▲").waitFor();
await shoot("trade-quote-options-phone");

// The expiration field's horizontal tab strip (#2017 Phase 0 task 4c) — 13 expirations, more than
// fit in the old 8-row-capped <select>, prove the strip needs a real horizontal swipe at 390px.
await page.getByRole("button", { name: "2026-09-09" }).waitFor();
await shoot("trade-exp-tabs-phone");

// The chain table above the fields it drives (#2017 Phase 0 task 4e) — same navigation as the
// quote-header/exp-tabs shots above (still `?play=201&symbol=NVDA`), proving the chain now renders
// directly under Expiration, above Strike/Contracts/Order/Limit, with a real loaded chain.
await page.getByText(/^Chain ·/).waitFor();
await shoot("trade-chain-above-fields-phone");

// Review fix (2026-09-08): the chain used to sit INSIDE the .gate-fields grid as a spanning item,
// which inherited the grid's own overflow from the (non-wrapping) expiration tab strip and clipped
// off the phone frame. It's now an ordinary block sibling between two separate grids instead — this
// desktop shot proves the second grid (Strike/Contracts/Order/Limit) still lays out as a sane
// 3-column grid, with the chain sitting as a full-width block above it, not a mid-grid gap.
await page.setViewportSize({ width: 1280, height: 900 });
await shoot("trade-chain-above-fields-desktop");
await page.setViewportSize({ width: 390, height: 844 });

// The who-else-traded row (#2017 Phase 1 slice 12) — a human buy and a bot sell on NVDA, real
// names, under the chain and above the review/submit action. Same navigation as the shots above
// (still `?play=201&symbol=NVDA`); only the Wire fixture changes for this one scene. Its own
// output directory, same pattern as the earnings-badge scene below (`shootEarningsBadge`).
currentWire = nvdaWire;
await page.goto(`${origin}/app/trade?play=201&symbol=NVDA`);
await page.getByText("Also trading NVDA").waitFor();
await page.getByText("Also trading NVDA").scrollIntoViewIfNeeded();
const shootWireRow = shooter(page, resolve("docs/shots/wire-row"));
await shootWireRow("wire-row-phone");
currentWire = emptyWire;

// Progressive disclosure (#2017 Phase 0 task 4d): with no `?symbol=` committed yet, the five
// chain-gated fields (Expiration/Strike/Contracts/Order/Limit) are withheld entirely — the panel
// title is the only stable marker to wait on, since the idle state renders nothing else.
await page.goto(`${origin}/app/trade?play=201`);
await page.getByRole("heading", { name: "Sell a cash-secured put" }).waitFor();
await shoot("progressive-disclosure-idle-phone");

currentPlays = plays;

// A locked preset (#1461 slice 2): the rail can point at 301, the nav shows "Buy to open" disabled
// with the rung that opens it, and the ticket shows its locked panel. Visible, disabled, explained.
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${origin}/app/trade?play=301`);
await page.getByText("Buy to open: opens after 202 fills").waitFor();
await shoot("trade-locked-phone");

// The ladder extension (#1671): Spread is a THIRD instrument, not a fourth side/type combo — the
// eight-node rail at phone width, and a locked 401 shows the same shared panel every other locked
// rung does, naming 302 as the rung that opens it.
await page.goto(`${origin}/app/trade?play=401`);
await page.getByText("Spread: opens after 302 fills").waitFor();
await shoot("trade-spread-locked-phone");

// Once 302 is earned, 401 OPENS for practice even though nothing can execute yet (#1671: "a rung
// nobody can fill yet stays locked" is about the ✓, not the door) — the multi-leg builder becomes
// the Spread instrument's own ticket body instead of a panel under every ticket.
currentPlays = throughLongs;
await page.goto(`${origin}/app/trade?play=401`);
await page.getByText("Multi-leg builder").waitFor();
await shoot("trade-spread-open-phone");

// The earnings badge + ⚡ print marks (#2017 Phase 1 slice 11) — MU's confirmed print is
// 2026-09-30 (`src/domain/earnings-calendar.ts`). The harness's real wall clock is nowhere near
// that date, and neither `EarningsBadge` nor `ExpirationField` take an injectable "now" (by
// design — they read the same `new Date()` the rest of the ticket does, so the badge and the DTE
// line can never disagree), so the clock itself is faked via Playwright's own `page.clock`
// (https://playwright.dev/docs/clock) rather than bending the fixture dates to match real time,
// which would need re-editing every time this script is next run. `setFixedTime` two days before
// the print lands the badge in the flat zone (`entryFlatDays: 2`); the 2026-09-29 expiration
// (before the print) stays unmarked, and the 2026-09-30/2026-10-16 expirations (on/after it) carry
// the ⚡ — 2026-09-29 is also chosen to sit AFTER "now" so it doesn't also trip the unrelated
// zero-DTE lock, which floors any already-past expiration's DTE to 0 (`daysToExpiry`, `straddle.ts`).
currentPlays = throughLongs;
currentChain = {
  symbol: "MU",
  optionType: "put",
  expirations: ["2026-09-29", "2026-09-30", "2026-10-16"],
  expiration: "2026-09-30",
  spot: 118.4,
  rows: [110, 115, 118, 120, 125].map((strike, i) => ({
    strike,
    occSymbol: `MU260930P${String(strike * 1000).padStart(8, "0")}`,
    premium: Number((0.6 + i * 0.9).toFixed(2)),
    bid: Number((0.5 + i * 0.9).toFixed(2)),
    ask: Number((0.7 + i * 0.9).toFixed(2)),
    openInterest: 400 + i * 80,
  })),
};
currentQuote = { symbol: "MU", last: 118.4, change: 1.05, changePct: 0.89, tone: "pos" };
await page.clock.setFixedTime(new Date("2026-09-28T14:00:00Z"));
await page.goto(`${origin}/app/trade?play=201&symbol=MU`);
await page.getByText(/^Chain ·/).waitFor();
await page.getByText("⚡").first().waitFor();
const shootEarningsBadge = shooter(page, resolve("docs/shots/earnings-badge"));
await shootEarningsBadge("earnings-badge-phone");

await close();
