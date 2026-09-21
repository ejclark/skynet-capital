// Visual harness for /app/trade (#1461) — the milestone rail over the ticket, from the REAL built
// shell over stub APIs. PHONE FIRST (docs/PICTURES.md → "Trading surfaces shoot the phone frame
// first"): the 390px frame proves the curation, the desktop frame proves it expanded instead of
// floating. JPEG ≤100KB.
// Usage: npm run build --prefix app && npm run shoot:trade [outdir]
import { resolve } from "node:path";
import { shooter } from "./lib.mjs";
import { openShell } from "./shell.mjs";
import { recentOrdersActivity } from "./trade-recent-orders-fixture.mjs";

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

// The Symbol field's tier-2 live fallback (Phase 0.8b): "GATO" (Gatos Silver) is a genuine
// curated-directory miss — not in src/domain/ticker-directory/* — so typing it proves the debounced
// live Alpaca lookup, not the tier-1 static match every other scene in this file exercises.
const symbolSearch = { hits: [{ symbol: "GATO", name: "Gatos Silver" }] };

// Twenty daily bars for the chart section (#2017 Phase 1 chart build-out, the mount slice) —
// deterministic, hand-shaped rather than realistic finance: the closes walk up with real
// pullbacks and one sharp down day (bar 19) so the frame proves BOTH candle colours, and the
// volumes spike on the big moves so the histogram band shows real variation. Ends on the quote's
// own last (181.32) so the two fixtures agree. Business days only, counted back from 2026-09-08.
const barCloses = [
  172.4, 174.1, 173.2, 176.8, 178.9, 177.3, 175.6, 179.2, 181.0, 180.1, 183.4, 182.2, 185.7, 184.3,
  181.9, 183.8, 186.5, 185.2, 179.4, 181.32,
];
const barVolumesM = [
  31.2, 28.4, 25.9, 40.1, 44.6, 33.0, 30.8, 47.3, 51.9, 29.5, 55.2, 34.7, 60.8, 38.1, 42.4, 36.9,
  49.5, 33.3, 71.6, 45.0,
];
const barDays = [];
for (let d = new Date("2026-09-08T00:00:00Z"); barDays.length < barCloses.length; ) {
  const dow = d.getUTCDay();
  if (dow !== 0 && dow !== 6) barDays.unshift(d.toISOString());
  d = new Date(d.getTime() - 86_400_000);
}
const bars = {
  symbol: "NVDA",
  bars: barCloses.map((c, i) => {
    const o = i === 0 ? 171.5 : barCloses[i - 1];
    const hi = Math.max(o, c) + 0.6 + (i % 3) * 0.4;
    const lo = Math.min(o, c) - 0.5 - (i % 2) * 0.5;
    return {
      t: barDays[i],
      o,
      h: Number(hi.toFixed(2)),
      l: Number(lo.toFixed(2)),
      c,
      v: Math.round(barVolumesM[i] * 1e6),
    };
  }),
};

// Sixty bars for the STUDIES scene (#2017 Phase 1 chart build-out, the studies slice) — the base
// twenty above stay exactly as they are (the studies-off shots prove that view unchanged), but a
// 20-window SMA/Bollinger has ONE point on a twenty-bar series, which draws no line at all. Forty
// hand-shaped closes are prepended — a gentle drift with two real swings — and the walk lands
// near the base fixture's first open so the join reads as one continuous tape.
const studyPrefixCloses = Array.from({ length: 40 }, (_, i) =>
  Number((165 + 4 * Math.sin(i / 4) + i * 0.15).toFixed(2)),
);
const studyCloses = [...studyPrefixCloses, ...barCloses];
const studyDays = [];
for (let d = new Date("2026-09-08T00:00:00Z"); studyDays.length < studyCloses.length; ) {
  const dow = d.getUTCDay();
  if (dow !== 0 && dow !== 6) studyDays.unshift(d.toISOString());
  d = new Date(d.getTime() - 86_400_000);
}
const studyBars = {
  symbol: "NVDA",
  bars: studyCloses.map((c, i) => {
    const o = i === 0 ? 164.2 : studyCloses[i - 1];
    const hi = Math.max(o, c) + 0.6 + (i % 3) * 0.4;
    const lo = Math.min(o, c) - 0.5 - (i % 2) * 0.5;
    return {
      t: studyDays[i],
      o,
      h: Number(hi.toFixed(2)),
      l: Number(lo.toFixed(2)),
      c,
      v: Math.round((28 + 20 * Math.abs(Math.sin(i / 2.5))) * 1e6),
    };
  }),
};

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
  // Row 4 (the 185 strike) carries NO stats at all — the fixture proves both paths at once: the
  // "—" path for a stat-less row, and the happy path for the other four (#2017 Phase 1 slice 14,
  // reused by the chain-stats scene below rather than inventing a fourth chain fixture).
  rows: [175, 177.5, 180, 182.5, 185].map((strike, i) => {
    const base = {
      strike,
      occSymbol: `NVDA260909P${String(strike * 1000).padStart(8, "0")}`,
      premium: Number((0.4 + i * 1.1).toFixed(2)),
      bid: Number((0.32 + i * 1.1).toFixed(2)),
      ask: Number((0.48 + i * 1.1).toFixed(2)),
    };
    if (i === 4) return base;
    return {
      ...base,
      openInterest: 900 + i * 120,
      volume: 300 + i * 90,
      delta: Number((-0.15 - i * 0.18).toFixed(4)),
      gamma: Number((0.008 + i * 0.002).toFixed(4)),
      theta: Number((-0.05 - i * 0.03).toFixed(4)),
      vega: Number((0.12 + i * 0.04).toFixed(4)),
    };
  }),
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
// The base twenty bars for every chart shot but the studies scene, which swaps in `studyBars`.
let currentBars = bars;
// Working orders (#3407 P1 slice 2): the list a Limit was missing. Every scene but the one that
// proves it starts with nothing working — the honest empty line is itself part of every ticket
// frame now. The proving scene swaps in one GTC limit, one partial fill and two settled rows.
const noOrders = { available: true, asOf: "2026-09-21T14:00:00Z", working: [], recent: [] };
const workingOrders = {
  available: true,
  asOf: "2026-09-21T14:00:00Z",
  working: [
    {
      id: "wo-1",
      symbol: "NVDA",
      side: "buy",
      orderType: "limit",
      quantity: 5,
      filledQuantity: 0,
      limitPrice: 176.5,
      timeInForce: "gtc",
      submittedAt: "2026-09-21T13:58:00Z",
      state: "working",
      cancelable: true,
    },
    {
      id: "wo-2",
      symbol: "AAPL",
      side: "sell",
      orderType: "limit",
      quantity: 10,
      filledQuantity: 4,
      limitPrice: 231.1,
      timeInForce: "day",
      submittedAt: "2026-09-21T13:41:00Z",
      state: "partial",
      cancelable: true,
    },
  ],
  recent: [
    {
      id: "wo-3",
      symbol: "MU",
      side: "buy",
      orderType: "market",
      quantity: 20,
      filledQuantity: 20,
      avgFillPrice: 118.4,
      timeInForce: "day",
      submittedAt: "2026-09-21T13:20:00Z",
      settledAt: "2026-09-21T13:20:01Z",
      state: "filled",
      cancelable: false,
    },
    {
      id: "wo-4",
      symbol: "NVDA",
      side: "buy",
      orderType: "stop",
      quantity: 5,
      filledQuantity: 0,
      stopPrice: 190,
      timeInForce: "gtc",
      submittedAt: "2026-09-21T12:02:00Z",
      settledAt: "2026-09-21T13:05:00Z",
      state: "cancelled",
      cancelable: false,
    },
  ],
};
let currentOrders = noOrders;
const currentOptionReview = {
  preview: {
    code: "201",
    underlying: "NVDA",
    occSymbol: "NVDA261016P00175000",
    optionType: "put",
    side: "sell",
    positionIntent: "sell_to_open",
    contracts: 1,
    strike: 175,
    expiration: "2026-10-16",
    orderType: "limit",
    limitPrice: 1.5,
    timeInForce: "day",
    ok: true,
    estPremium: 1.5,
    estNotional: 150,
    collateral: 17_500,
    maxProfit: 150,
    maxLoss: 17_350,
    breakeven: 173.5,
    greeks: { delta: -0.31, gamma: 0.021, theta: -0.06, vega: 0.14 },
    impliedVol: 0.42,
    chanceOfProfit: 0.72,
    expectedValue: 18.4,
    refusals: [],
    warnings: [],
  },
};
// Limit close (#3407 P1 slice 3): one held long put so the option positions card renders with
// its Market / Limit choice. Every other scene keeps the empty desk.
const deskWithOption = {
  ...desk,
  desk: {
    ...desk.desk,
    positions: [
      {
        symbol: "MSFT260918P00420000",
        display: "MSFT $420 put · Sep 18",
        detail: "2 contracts",
        isOption: true,
        quantity: "2",
        costPerShare: "$10.70",
        price: "$12.00",
        costBasis: "$2,140.00",
        value: "$2,400.00",
        dayPl: "+$60.00",
        dayPct: "+2.5%",
        dayTone: "pos",
        totalPl: "+$260.00",
        totalPlRaw: 260,
        returnPct: "+12.1%",
        totalTone: "pos",
        weightPct: 3,
      },
    ],
  },
};
let currentDesk = desk;
const optionPositions = {
  available: true,
  asOf: "2026-09-21T14:00:00Z",
  representative: true,
  rows: [
    {
      symbol: "MSFT260918P00420000",
      display: "MSFT $420 put · Sep 18",
      underlying: "MSFT",
      type: "put",
      strike: 420,
      expiration: "2026-09-18",
      daysToExpiry: 17.25,
      contracts: 2,
      inTheMoney: true,
      spot: 410.2,
      greeks: { delta: -0.62, gamma: 0.018, theta: -0.21, vega: 0.34 },
      positionGreeks: { delta: -124, gamma: 3.6, theta: -42, vega: 68 },
      impliedVol: 0.29,
      bid: 11.9,
      ask: 12.1,
    },
  ],
  book: { delta: -124, gamma: 3.6, theta: -42, vega: 68, covered: 1, total: 1, uncovered: [] },
};
const currentOptionPositions = optionPositions;
// A 2-lot NVDA 180/200 call credit spread walked add → validate → review → confirm, exactly the
// states `draft-order.ts` produces; the confirm answer is the route's own shape with the
// broker's echo (`executed: true`, order id, status, the working-orders note).
const spreadLegs = [
  {
    id: "leg-1",
    underlying: "NVDA",
    optionType: "call",
    strike: 180,
    expiration: "2026-09-18",
    action: "sell",
    contracts: 2,
    limitPrice: 4.2,
  },
  {
    id: "leg-2",
    underlying: "NVDA",
    optionType: "call",
    strike: 200,
    expiration: "2026-09-18",
    action: "buy",
    contracts: 2,
    limitPrice: 1.1,
  },
];
const spreadPreview = {
  legCount: 2,
  pricedFully: true,
  netPremium: 620,
  maxGain: 620,
  maxLoss: 3380,
  unlimitedLoss: false,
  breakevens: [183.1],
  undefinedRiskLegIds: [],
};
const spreadVerdict = { ok: true, refusals: [], warnings: [] };
const spreadDraft = (phase, extra = {}) => ({
  draft: { phase, legs: spreadLegs, refusals: [], nextLegId: 3, ...extra },
  preview: spreadPreview,
});
const draftSent = {
  ...spreadDraft("submitted", { verdict: spreadVerdict }),
  executed: true,
  orderId: "7c1e2b9a-mleg",
  status: "accepted",
  timeInForce: "gtc",
  note: "Order 7c1e2b9a-mleg accepted — one net limit, filled together or not at all. Working orders picks it up on the next read.",
};
const draftScript = [
  spreadDraft("drafting"),
  spreadDraft("validated", { verdict: spreadVerdict }),
  spreadDraft("reviewed", { verdict: spreadVerdict }),
  draftSent,
];

const { page, origin, shoot, close } = await openShell({
  name: "trade",
  viewport: { width: 390, height: 844 },
  stubs: {
    "/api/trade/plays": () => currentPlays,
    "/api/settings": settings,
    "/api/desk/*": () => currentDesk,
    // Exact key beats the `/api/desk/*` prefix above (`lib.mjs`'s `stubBody`) — every fixture in
    // this script logs in as the same "human-eric" account (`settings.accounts[0].id`).
    "/api/desk/human-eric/activity": recentOrdersActivity,
    "/api/trade/quote": () => currentQuote,
    "/api/trade/chain": () => currentChain,
    // Matched by pathname alone (`lib.mjs`'s `stubBody`), so one key covers any `?symbol=&days=`.
    "/api/trade/bars": () => currentBars,
    "/api/wire": () => currentWire,
    // Matched by pathname alone too, so one key covers any `?q=`.
    "/api/symbols/search": () => symbolSearch,
    // Working orders (#3407 P1 slice 2) — pathname-matched, so one key covers `?participantId=`.
    "/api/trade/orders": () => currentOrders,
    // The reviewed option order (#3407 P2 slice 2): greeks, IV, chance of profit beside expected
    // value — every number the server's own rules would print, as one stub.
    "/api/trade/option/review": () => currentOptionReview,
    // Position Statement vocabulary on the positions card (#3407 P2 slice 3).
    "/api/trade/option-positions": () => currentOptionPositions,
    "/api/trade/cancel": { ok: true, orderId: "wo-1" },
    // The multi-leg builder's lifecycle (#3407 P3 slice 1) — one scripted answer per action, in
    // the order the scene clicks them; the last answer repeats so a stray re-read stays put.
    "/api/trade/draft": () => draftScript.shift() ?? draftSent,
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

// The chart section (#2017 Phase 1 chart build-out, the mount slice) — `?section=chart` swaps
// the ticket for daily candles + a volume band on the committed `?symbol=`, the legend above
// reading the latest bar as words (a standing reader is red/green colourblind — the candle hue
// is supplementary). PHONE FIRST: the 390px frame proves the 260px pane is readable; the desktop
// frame proves the same chart got vertical room, not a phone column floating in a wide stage.
// `lightweight-charts` paints to <canvas>, which no text locator can wait on, so the wait is a
// real non-blank check on the pane's pixels — the same idea as `tower.mjs`'s readiness gate.
const chartPainted = () =>
  page.waitForFunction(() => {
    const canvases = Array.from(document.querySelectorAll(".chart-canvas canvas"));
    return canvases.some((canvas) => {
      const ctx = canvas.getContext("2d");
      if (!ctx || canvas.width === 0 || canvas.height === 0) return false;
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 3; i < data.length; i += 4) if (data[i] !== 0) return true;
      return false;
    });
  });
const shootChartSection = shooter(page, resolve("docs/shots/chart-section"));
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${origin}/app/trade?section=chart&symbol=NVDA`);
await page.getByText("Vol").waitFor();
await chartPainted();
await shootChartSection("chart-section-phone");

await page.setViewportSize({ width: 1280, height: 900 });
// The ResizeObserver re-fits the chart to the wider, taller box; give it a frame to repaint.
await page.waitForTimeout(400);
await chartPainted();
await shootChartSection("chart-section-desktop");

// The canned studies (the studies slice) — SMA (solid) and EMA (dashed) over the candles in the
// one accent hue, and RSI in ITS OWN pane below, with the dashed 70/30 reference lines and the
// `.has-rsi` room the CSS adds for it; the legend grows a cell per study and the gloss lines
// print under the toggle row. Pressed via the real chips, the way a member does it. Phone frame
// only: the second pane at 390px is the layout this frame exists to prove. Studies are component
// state, so a fresh `goto` is the studies-off base again — no clean-up toggle needed.
currentBars = studyBars;
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${origin}/app/trade?section=chart&symbol=NVDA`);
await page.getByText("Vol").waitFor();
await chartPainted();
for (const name of ["SMA", "EMA", "RSI"]) {
  await page.getByRole("button", { name, exact: true }).click();
}
await page.locator(".chart-canvas.has-rsi").waitFor();
// The RSI click grew the canvas UNDER the pointer, which would park the crosshair mid-chart and
// its value label over the 70 reference label — so the pointer leaves the canvas first, and the
// legend falls back to the latest bar the way it does for a member who lifts a finger.
await page.mouse.move(8, 8);
// The toggle re-mounts the chart into the grown box; give it a frame to lay out both panes.
await page.waitForTimeout(400);
await chartPainted();
await shootChartSection("chart-section-studies-phone");
currentBars = bars;

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

// The scroll-out stat columns (#2017 Phase 1 slice 14) — OI/Vol/Δ/Γ/Θ/Vega past the base
// Bid/Ask/Strike/Bid/Ask five, in the SAME `.straddle-scroll` container (no new UI mechanism).
// FIX (review, this slice): the base five used to be first in DOM order, so the unscrolled shot
// showed them "for free" — but that was the bug (stats sat between Bid/Ask and Strike, so an
// unscrolled real chain showed calls' stats instead of Strike). Stats now sit on each side's OUTER
// edge and `StraddleView` opens with an initial `scrollLeft` offset onto the base five, so the
// unscrolled shot here is proving the FIX, not a DOM-order coincidence. Scrolled — via
// `scrollLeft = scrollWidth`, the standard way to reveal an overflow-x container's far edge
// (https://playwright.dev/docs/evaluating) — swipes RIGHT past puts' Bid/Ask to reveal puts' own
// OI/Vol/Δ/Γ/Θ/Vega, including the "—" path on the 185-strike row's stat-less fixture above.
const shootChainStats = shooter(page, resolve("docs/shots/chain-stats"));
await shootChainStats("trade-chain-stats-phone");
await page.evaluate(() => {
  const scroller = document.querySelector(".straddle-scroll");
  if (scroller) scroller.scrollLeft = scroller.scrollWidth;
});
await shootChainStats("trade-chain-stats-scrolled-phone");

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

// The recent-orders strip (#2017 Phase 1 slice 13, task 3a) — the viewer's OWN order history for
// the EXACT contract in front of them, self first then WireRow's "others" (the ordering decision
// from the plan's review pass), both in frame together at 390px since they fit naturally here. A
// strike has to actually resolve to a chain row before `RecentOrdersStrip` renders anything (it
// takes the matched row's real `occSymbol`, never a hand-assembled one), so this navigation commits
// `?strike=180` — the same row `trade-recent-orders-fixture.mjs`'s two events are keyed to.
await page.goto(`${origin}/app/trade?play=201&symbol=NVDA&strike=180`);
await page.getByText("Your recent orders").waitFor();
await page.getByText("Your recent orders").scrollIntoViewIfNeeded();
await shooter(page, resolve("docs/shots/recent-orders"))("recent-orders-phone");

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

// A spread SENT (#3407 P3 slice 1) — the builder walked to its review screen, Day / GTC beside
// Confirm (GTC pressed so the frame proves the pick), then the confirm answered by the broker's
// own echo: "Confirmed", the order id and status, and the note that hands off to Working
// orders. Before this slice the same click read "Reviewed — not sent" — the P0 honesty fix —
// because no execution path existed. PHONE FIRST.
// The stub answers the whole two-leg draft on the first add, so the typed leg only has to be
// addable: commit the symbol, wait for the chain to turn the strike into a <select>, pick one.
await page.getByLabel("Underlying").fill("NVDA");
await page.getByLabel("Underlying").press("Enter");
const strikePick = page.getByRole("combobox", { name: "Strike", exact: true });
await strikePick.waitFor();
await strikePick.selectOption({ index: 1 });
await page.getByRole("button", { name: "Add leg" }).click();
await page.getByRole("button", { name: "Validate against account" }).click();
await page.getByRole("button", { name: "Review order" }).click();
await page.getByText("Reviewed — ready to confirm").waitFor();
await page.getByRole("button", { name: "GTC" }).click();
await page.getByRole("button", { name: /Confirm order/ }).scrollIntoViewIfNeeded();
const shootSpreadSent = shooter(page, resolve("docs/shots/spread-sent"));
await shootSpreadSent("spread-confirm-phone");
await page.getByRole("button", { name: /Confirm order/ }).click();
await page.getByText("Confirmed").waitFor();
await page.getByText("Confirmed").scrollIntoViewIfNeeded();
await shootSpreadSent("spread-sent-phone");
await page.setViewportSize({ width: 1280, height: 900 });
await page.getByText("Confirmed").scrollIntoViewIfNeeded();
await shootSpreadSent("spread-sent-desktop");
await page.setViewportSize({ width: 390, height: 844 });

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

// The Symbol field's tier-2 live fallback (Phase 0.8b) — a curated-directory miss ("GATO" isn't
// in src/domain/ticker-directory/*) falls through, after the 300ms debounce, to a live Alpaca
// asset lookup instead of leaving the member with free text alone. Fresh nav (no `?symbol=`
// committed) so the field starts blank. The earnings-badge scene above installed a FIXED fake
// clock (`page.clock.setFixedTime`) — a fixed clock never advances, so the debounce's real
// `setTimeout` would never fire — `resume()` hands time back to the real clock first.
await page.clock.resume();
currentPlays = freshPlays;
currentChain = chain;
currentQuote = quote;
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${origin}/app/trade?play=101`);
await page.getByLabel("Symbol").waitFor();
await page.getByLabel("Symbol").fill("GATO");
// Real wait on the specific dropdown content the debounced fetch lands, never a fixed sleep —
// the default Playwright timeout is comfortably longer than the 300ms debounce window.
await page.getByText("GATO - Gatos Silver").waitFor();
const shootSymbolTier2 = shooter(page, resolve("docs/shots/symbol-tier2"));
await shootSymbolTier2("symbol-tier2-phone");

// Working orders (#3407 P1 slice 2) — one GTC limit and one partial fill under the ticket, two
// settled rows below them; the Day / GTC control on the ticket above. PHONE FIRST: 390px proves
// the row wraps its type line under the symbol instead of clipping; desktop proves it widened.
currentPlays = plays;
currentOrders = workingOrders;
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${origin}/app/trade?play=101&symbol=NVDA`);
await page.getByText("Working orders").waitFor();
await page.getByText("Settled today").waitFor();
await page.getByRole("heading", { name: "Working orders" }).scrollIntoViewIfNeeded();
const shootWorkingOrders = shooter(page, resolve("docs/shots/working-orders"));
await shootWorkingOrders("working-orders-phone");
await page.setViewportSize({ width: 1280, height: 900 });
await page.getByRole("heading", { name: "Working orders" }).scrollIntoViewIfNeeded();
await shootWorkingOrders("working-orders-desktop");
// The two-tap cancel, armed: the row's Cancel became its own Confirm / Keep pair.
await page.setViewportSize({ width: 390, height: 844 });
await page.getByRole("button", { name: "Cancel" }).first().click();
await page.getByRole("button", { name: "Confirm cancel" }).waitFor();
await page.getByRole("heading", { name: "Working orders" }).scrollIntoViewIfNeeded();
await shootWorkingOrders("working-orders-cancel-armed-phone");
currentOrders = noOrders;

// Limit close (#3407 P1 slice 3) — the option positions card under the ticket with Limit
// pressed and a premium typed, then the reviewed confirm line naming the limit. Phone first.
currentPlays = plays;
currentDesk = deskWithOption;
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${origin}/app/trade?play=101&symbol=NVDA`);
await page.getByRole("heading", { name: "Option positions" }).waitFor();
await page.getByRole("button", { name: "Limit" }).click();
await page.getByLabel("Limit price per share").fill("13.50");
await page.getByRole("heading", { name: "Option positions" }).scrollIntoViewIfNeeded();
const shootLimitClose = shooter(page, resolve("docs/shots/limit-close"));
await shootLimitClose("limit-close-phone");
// The same card with its Position Statement line and book foot (#3407 P2 slice 3).
await page.getByText(/DTE/).waitFor();
const shootOptionPositions = shooter(page, resolve("docs/shots/option-positions"));
await shootOptionPositions("option-positions-phone");
await page.setViewportSize({ width: 1280, height: 900 });
await page.getByRole("heading", { name: "Option positions" }).scrollIntoViewIfNeeded();
await shootLimitClose("limit-close-desktop");
currentDesk = desk;

// Day / GTC on the options ticket (#3407 P1 slice 4) — the same control the stock ticket got,
// under the chain on a 201 ticket; GTC pressed so the frame proves the pick, not the default.
currentPlays = throughLongs;
currentDesk = desk;
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${origin}/app/trade?play=201&symbol=NVDA`);
await page.getByText(/^Chain ·/).waitFor();
await page.getByRole("button", { name: "GTC" }).click();
await page.getByText("Time in force").scrollIntoViewIfNeeded();
// The straddle is wider than the phone; scrollIntoView can drag the page sideways — pin it back.
await page.evaluate(() => window.scrollTo({ left: 0 }));
const shootOptionsTif = shooter(page, resolve("docs/shots/options-tif"));
await shootOptionsTif("options-tif-phone");

// Quote coverage under the chain (#3407 P2 slice 1) — the one-line provenance that turns a "—"
// cell into "the feed didn't quote this strike": indicative feed, 4 of 5 strikes, an as-of.
currentPlays = throughLongs;
currentChain = {
  ...currentChain,
  quotes: { source: "indicative", quoted: 4, total: 5, asOf: "2026-09-21T14:05:00Z" },
};
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${origin}/app/trade?play=201&symbol=NVDA`);
await page.getByText(/strikes quoted/).waitFor();
await page.getByText(/strikes quoted/).scrollIntoViewIfNeeded();
await page.evaluate(() => window.scrollTo({ left: 0 }));
const shootChainCoverage = shooter(page, resolve("docs/shots/chain-coverage"));
await shootChainCoverage("chain-coverage-phone");

// Greeks, IV and the odds on the option order screen (#3407 P2 slice 2) — a reviewed 201 ticket:
// chance of profit never without expected value beside it, the four greeks as one line.
currentPlays = throughLongs;
await page.setViewportSize({ width: 390, height: 844 });
// Typed strike, then Review clicked straight away — the regression proof for the lost first
// click (`keepFocus`, gate-frame.tsx): before the fix this click landed on nothing.
await page.goto(`${origin}/app/trade?play=201&symbol=NVDA`);
await page.getByText(/^Chain ·/).waitFor();
await page.getByLabel("Strike", { exact: true }).fill("175");
await page.getByRole("button", { name: "Review order" }).click();
await page.getByText("Chance of profit").waitFor();
await page.getByText("Chance of profit").scrollIntoViewIfNeeded();
await page.evaluate(() => window.scrollTo({ left: 0 }));
const shootOrderOdds = shooter(page, resolve("docs/shots/order-odds"));
await shootOrderOdds("order-odds-phone");

// P0 template hygiene (#3407): content-sized fields (a 4-character strike no longer a third of
// the panel) and the two-column estimate. Phone first, then the desktop frame that proves the
// fields expanded instead of stretching.
currentPlays = throughLongs;
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${origin}/app/trade?play=201&symbol=NVDA&strike=175`);
await page.getByText(/^Chain ·/).waitFor();
await page.getByLabel("Strike", { exact: true }).scrollIntoViewIfNeeded();
await page.evaluate(() => window.scrollTo({ left: 0 }));
const shootTemplate = shooter(page, resolve("docs/shots/p0-template"));
await shootTemplate("ticket-fields-phone");
await page.setViewportSize({ width: 1280, height: 900 });
await page.getByLabel("Strike", { exact: true }).scrollIntoViewIfNeeded();
await shootTemplate("ticket-fields-desktop");
await page.getByRole("button", { name: "Review order" }).click();
await page.getByText("Chance of profit").waitFor();
await page.getByText("Chance of profit").scrollIntoViewIfNeeded();
await shootTemplate("estimate-desktop");

// An honest empty limit (#3407 P0): a strike the chain doesn't list gets no seeded premium, so
// Review stays disabled and the note says what is missing — the ticket no longer refuses itself.
currentPlays = throughLongs;
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${origin}/app/trade?play=201&symbol=NVDA&strike=190`);
await page.getByText(/needs a premium per share/).waitFor();
await page.getByText(/needs a premium per share/).scrollIntoViewIfNeeded();
await page.evaluate(() => window.scrollTo({ left: 0 }));
const shootHonest = shooter(page, resolve("docs/shots/p0-honest"));
await shootHonest("limit-note-phone");

// The in-the-money rail on the strike cell (#3407 P0): visible at 390px without scrolling —
// calls in the money above the divider carry the bar on the strike's left edge, puts below it on
// the right.
currentPlays = throughLongs;
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${origin}/app/trade?play=201&symbol=NVDA`);
await page.getByText(/^Chain ·/).waitFor();
// Bring the divider row (and the in-the-money rows around it) into the frame, not the page top.
await page.getByText(/^Current price ·/).scrollIntoViewIfNeeded();
await page.evaluate(() => window.scrollTo({ left: 0 }));
const shootRail = shooter(page, resolve("docs/shots/itm-rail"));
await shootRail("itm-rail-phone");

await close();
