// Visual harness for /app/accounts (#2321) — the Cockpit: sticky net-worth header + horizontal
// section switch + scrollable section detail. PHONE FIRST (docs/PICTURES.md → "Trading surfaces
// shoot the phone frame first"): the 390px frame proves the curation, the desktop frame proves it
// expanded. JPEG ≤100KB.
// Usage: npm run build --prefix app && npm run shoot:accounts [outdir]
import { shooter } from "./lib.mjs";
import { openShell } from "./shell.mjs";

// Two accounts — a human and a bot — so the "All accounts" aggregate and roster are meaningful,
// and the single-account view proves the per-account path. Real tickers, strategy-accurate
// underlyings, honest SIM labels (CLAUDE.md → Domain accuracy & honesty).
const settings = {
  authConfigured: true,
  adminWired: false,
  fleetSuspended: false,
  timezones: [],
  accounts: [
    { id: "human-eric", name: "Eric", kind: "human", hostConfigured: true, profile: null },
    { id: "bot-sauron", name: "Sauron", kind: "bot", hostConfigured: true, profile: null },
  ],
};

// Net-worth payload — one fetch carries every account plus the aggregate, so the switcher never
// re-fetches. Windows come from Alpaca's portfolio history (flow-adjusted); the aggregate per
// window is `Σend / Σbase − 1`. Values are server-formatted strings the browser places as-is.
// `vs` is the "vs S&P" column (#3689 slice 3): the window's return minus SPY's, in points.
const win = (label, value, tone, note, partial = false, vs = undefined) => ({
  label,
  value,
  tone,
  note,
  known: true,
  ...(partial ? { partial: true } : {}),
  ...(vs
    ? { vsBenchmark: `${vs} pts vs S&P`, vsBenchmarkTone: vs.startsWith("-") ? "neg" : "pos" }
    : {}),
});

const ericStats = {
  value: "$1,047,832.14",
  valueKnown: true,
  dayChange: "+$2,418.67",
  dayTone: "pos",
  dayKnown: true,
  cash: "$847,200.00",
  cashKnown: true,
  bookedPl: "+$12,480.00",
  bookedTone: "pos",
  bookedKnown: true,
  onPaper: "+$47,832.14",
  onPaperTone: "pos",
  onPaperKnown: true,
  positionCount: 6,
  windows: [
    win("7D", "+1.2%", "pos", "last week", false, "+0.4"),
    win("1M", "+3.4%", "pos", "last month", false, "+1.9"),
    win("3M", "+8.1%", "pos", "last quarter", false, "+2.6"),
    win("1Y", "+12.7%", "pos", "last year", false, "-1.8"),
  ],
  // The high was set 9/19, $3,368 above today — the dashed line on the chart and the meter.
  allTimeHigh: { value: "$1,051,200", at: "9/19", aboveNow: 3368 / 1047832 },
  toNewHigh: "$3,368",
};

const sauronStats = {
  value: "$512,406.88",
  valueKnown: true,
  dayChange: "-$1,102.33",
  dayTone: "neg",
  dayKnown: true,
  cash: "$201,400.00",
  cashKnown: true,
  positionCount: 3,
  windows: [
    win("7D", "+0.8%", "pos", "last week"),
    win("1M", "-1.1%", "neg", "last month"),
    win("3M", "+4.2%", "pos", "last quarter"),
    win("1Y", "+22.3%", "pos", "last year"),
  ],
};

const totalStats = {
  value: "$1,560,239.02",
  valueKnown: true,
  dayChange: "+$1,316.34",
  dayTone: "pos",
  dayKnown: true,
  cash: "$1,048,600.00",
  cashKnown: true,
  positionCount: 9,
  windows: [
    win("7D", "+1.1%", "pos", "last week"),
    win("1M", "+2.3%", "pos", "last month"),
    win("3M", "+6.7%", "pos", "last quarter"),
    win("1Y", "+15.9%", "pos", "last year", true),
  ],
};

const networth = {
  generatedAt: "2026-09-11T00:00:00Z",
  accounts: [
    { id: "human-eric", name: "Eric", kind: "human", ...ericStats },
    { id: "bot-sauron", name: "Sauron", kind: "bot", ...sauronStats },
  ],
  total: totalStats,
};

// Desk snapshots — the Positions section's blotter. Real tickers, honest P/L tones.
const pos = (
  symbol,
  display,
  detail,
  isOption,
  quantity,
  costPerShare,
  price,
  costBasis,
  value,
  dayPl,
  dayPct,
  dayTone,
  totalPl,
  totalPlRaw,
  returnPct,
  totalTone,
  weightPct,
  lots,
) => ({
  symbol,
  display,
  detail,
  isOption,
  quantity,
  costPerShare,
  price,
  costBasis,
  value,
  dayPl,
  dayPct,
  dayTone,
  totalPl,
  totalPlRaw,
  returnPct,
  totalTone,
  weightPct,
  ...(lots ? { lots } : {}),
});

// Considerations rail (#3186 slice 3) — one at-risk chip (a losing options lot) and one
// opportunity chip (a house play matching a held symbol), so the screenshot proves both kinds.
// Needs a decision (#3689 slice 7), as decisions-view.ts writes them: most money at stake first.
const ericDecisions = [
  {
    id: "at-risk-NVDA260918C00180000",
    kind: "at-risk",
    symbol: "NVDA260918C00180000",
    display: "NVDA Sep 18 180 Call",
    plainName: "Call option · profits if NVDA rises",
    pl: "-$310 · −12.2%",
    plTone: "neg",
    title: "Down 12% with 25 days left",
    captionShort: "Needs NVDA above $185.10 by Sep 18 to profit.",
    caption:
      "NVDA Sep 18 180 Call has lost $310 of the $2,540 it cost. Worst case from here: −$2,540.",
    why: "✦ time is working against this one. an option loses value fastest in its last three weeks, even if the stock doesn't move.",
    clocks: ["Expires in 25 days", "3 contracts · worth $2,226"],
    primary: {
      label: "Review on Trade ↗",
      href: "/app/trade?desk=human-eric&symbol=NVDA&strike=180&exp=2026-09-18",
    },
    secondary: { label: "Show in table", href: "#pos-NVDA260918C00180000" },
    stakeRaw: 2226,
    range: { type: "call", side: "long", strike: 180, breakeven: 185.1 },
  },
  {
    id: "lock-in-AAPL",
    kind: "lock-in",
    symbol: "AAPL",
    display: "AAPL",
    plainName: "Shares · profits if AAPL rises",
    pl: "+$10,520 · +26.5%",
    plTone: "pos",
    title: "Up 27%: consider locking some of it in",
    captionShort: "Bought at $198.50; now $251.10.",
    caption: "AAPL has made $10,520 on $39,700. Closing some of it now locks that part in.",
    why: "✦ winners can give it back. closing part turns what's on paper into what's locked in, and the rest keeps running.",
    clocks: ["200 shares · worth $50,220"],
    primary: { label: "Review on Trade ↗", href: "/app/trade?desk=human-eric&symbol=AAPL" },
    secondary: { label: "Show in table", href: "#pos-AAPL" },
    stakeRaw: 50220,
  },
];

const ericConsiderations = [
  {
    id: "at-risk-NVDA260918C00180000",
    kind: "at-risk",
    symbol: "NVDA260918C00180000",
    display: "NVDA Sep 18 180 Call",
    notional: "$2,226",
    delta: "-$310",
    deltaTone: "neg",
    reason: "NVDA Sep 18 180 Call is down 12.2% from cost.",
    action: { label: "View position", href: "?section=positions#pos-NVDA260918C00180000" },
  },
  {
    id: "opportunity-aapl-earnings",
    kind: "opportunity",
    symbol: "AAPL",
    display: "AAPL",
    notional: "—",
    delta: "D-20 to D-6",
    deltaTone: "flat",
    reason: "Long AAPL into the earnings print — out of the market by the time the number lands.",
    action: { label: "View playbook", href: "/app/research?section=playbooks" },
  },
];

const ericDesk = {
  generatedAt: "2026-09-11T00:00:00Z",
  desk: {
    id: "human-eric",
    name: "Eric",
    kind: "human",
    considerations: ericConsiderations,
    decisions: ericDecisions,
    // Where the money is (#3689 slice 5): long shares, long options, cash — adding to 100%.
    allocation: {
      shares: "$198,386",
      options: "$2,226",
      cash: "$847,200",
      sharesPct: 18.93,
      optionsPct: 0.21,
      cashPct: 80.86,
      cashShare: "80.9%",
      shareCount: 300,
    },
    positions: [
      pos(
        "NVDA",
        "NVDA",
        "Nvidia",
        false,
        "100",
        "$172.40",
        "$181.32",
        "$17,240",
        "$18,132.00",
        "+$892.00",
        "+5.2%",
        "pos",
        "+$892.00",
        892.0,
        "+5.17%",
        "pos",
        1.7,
      ),
      pos(
        "AAPL",
        "AAPL",
        "Apple",
        false,
        "200",
        "$198.50",
        "$201.10",
        "$39,700",
        "$40,220.00",
        "+$520.00",
        "+1.3%",
        "pos",
        "+$520.00",
        520.0,
        "+1.31%",
        "pos",
        3.8,
      ),
      pos(
        "NVDA260918C00180000",
        "NVDA Sep 18 180 Call",
        "Nvidia",
        true,
        "3",
        "$5.10",
        "$7.42",
        "$1,530",
        "$2,226.00",
        "+$696.00",
        "+45.5%",
        "pos",
        "+$696.00",
        696.0,
        "+45.49%",
        "pos",
        0.2,
        // Two lots (#3186 slice 1) summing exactly to the parent: 2 @ $5.00 + 1 @ $5.30 = $1,530.
        [
          {
            lotId: "NVDA260918C00180000-0-a",
            openedAt: "2026-09-08 14:12 UTC",
            quantity: "2",
            costPerShare: "$5.00",
            price: "$7.42",
            costBasis: "$1,000",
            value: "$1,484",
            dayPl: "+$34",
            dayTone: "pos",
            totalPl: "+$484",
            returnPct: "+48.40%",
            totalTone: "pos",
          },
          {
            lotId: "NVDA260918C00180000-1-b",
            openedAt: "2026-09-10 18:41 UTC",
            quantity: "1",
            costPerShare: "$5.30",
            price: "$7.42",
            costBasis: "$530",
            value: "$742",
            dayPl: "+$17",
            dayTone: "pos",
            totalPl: "+$212",
            returnPct: "+40.00%",
            totalTone: "pos",
          },
        ],
      ),
    ],
    tiles: {
      openPositions: 6,
      invested: "$200,612.14",
      investedRaw: 200612.14,
      dayPl: "+$2,418.67",
      dayTone: "pos",
      dayPlRaw: 2418.67,
      unrealized: "+$47,832.14",
      unrealizedNote: "6 open positions",
      unrealizedTone: "pos",
      unrealizedRaw: 47832.14,
      cash: "$847,200.00",
      cashRaw: 847200.0,
    },
  },
};

// Plain words per position (#3689 slice 6), as the server's position-plain.ts writes them.
const PLAIN = {
  NVDA: {
    plainName: "Shares · profits if NVDA rises",
    expiresIn: "no expiry",
    breakeven: "$172.40",
    best: "unlimited",
    worst: "−$17,240",
  },
  AAPL: {
    plainName: "Shares · profits if AAPL rises",
    expiresIn: "no expiry",
    breakeven: "$198.50",
    best: "unlimited",
    worst: "−$39,700",
  },
  NVDA260918C00180000: {
    plainName: "Call option · profits if NVDA rises",
    expiresIn: "25 days",
    expiresInDays: 25,
    breakeven: "$185.10",
    best: "unlimited",
    worst: "−$1,530",
  },
};
ericDesk.desk.positions = ericDesk.desk.positions.map((p) => ({ ...p, ...PLAIN[p.symbol] }));

const sauronDesk = {
  generatedAt: "2026-09-11T00:00:00Z",
  desk: {
    id: "bot-sauron",
    name: "Sauron",
    kind: "bot",
    considerations: [],
    positions: [
      pos(
        "TSLA",
        "TSLA",
        "Tesla",
        false,
        "50",
        "$340.20",
        "$338.00",
        "$17,010",
        "$16,900.00",
        "-$110.00",
        "-0.6%",
        "neg",
        "-$110.00",
        -110.0,
        "-0.65%",
        "neg",
        3.3,
      ),
      pos(
        "SPY",
        "SPY",
        "S&P 500 ETF",
        false,
        "100",
        "$510.30",
        "$514.80",
        "$51,030",
        "$51,480.00",
        "+$450.00",
        "+0.9%",
        "pos",
        "+$450.00",
        450.0,
        "+0.88%",
        "pos",
        10.0,
      ),
    ],
    tiles: {
      openPositions: 3,
      invested: "$310,940.88",
      investedRaw: 310940.88,
      dayPl: "-$1,102.33",
      dayTone: "neg",
      dayPlRaw: -1102.33,
      unrealized: "+$12,406.88",
      unrealizedNote: "3 open positions",
      unrealizedTone: "pos",
      unrealizedRaw: 12406.88,
      cash: "$201,400.00",
      cashRaw: 201400.0,
    },
  },
};

// Activity ledger — the Activity section's timeline. Two events, newest first.
const ericActivity = {
  available: true,
  activity: [
    // A closing fill (#3689 Form strip): the round-trip matcher's realized P/L rides on it.
    {
      orderId: "ord-c7",
      symbol: "MSFT",
      display: "MSFT",
      side: "sell",
      quantity: 1,
      filled: 1,
      price: "$1.00",
      status: "filled",
      at: "2026-09-22T19:10:00Z",
      backfilled: false,
      origin: "desk",
      realizedPl: "+$1,240",
      returnPct: "+6.2%",
      realizedTone: "pos",
    },
    // A closing fill (#3689 Form strip): the round-trip matcher's realized P/L rides on it.
    {
      orderId: "ord-c6",
      symbol: "AMD260918C00150000",
      display: "AMD Sep 18 150 Call",
      side: "sell",
      quantity: 1,
      filled: 1,
      price: "$1.00",
      status: "filled",
      at: "2026-09-19T17:02:00Z",
      backfilled: false,
      origin: "desk",
      realizedPl: "+$410",
      returnPct: "+18.3%",
      realizedTone: "pos",
    },
    // A closing fill (#3689 Form strip): the round-trip matcher's realized P/L rides on it.
    {
      orderId: "ord-c5",
      symbol: "GOOGL",
      display: "GOOGL",
      side: "sell",
      quantity: 1,
      filled: 1,
      price: "$1.00",
      status: "filled",
      at: "2026-09-17T14:45:00Z",
      backfilled: false,
      origin: "desk",
      realizedPl: "+$365",
      returnPct: "+2.1%",
      realizedTone: "pos",
    },
    // A closing fill (#3689 Form strip): the round-trip matcher's realized P/L rides on it.
    {
      orderId: "ord-c4",
      symbol: "META",
      display: "META",
      side: "sell",
      quantity: 1,
      filled: 1,
      price: "$1.00",
      status: "filled",
      at: "2026-09-15T15:30:00Z",
      backfilled: false,
      origin: "desk",
      realizedPl: "+$880",
      returnPct: "+4.4%",
      realizedTone: "pos",
    },
    // A closing fill (#3689 Form strip): the round-trip matcher's realized P/L rides on it.
    {
      orderId: "ord-c3",
      symbol: "TSLA260912P00380000",
      display: "TSLA Sep 12 380 Put",
      side: "sell",
      quantity: 1,
      filled: 1,
      price: "$1.00",
      status: "filled",
      at: "2026-09-12T16:20:00Z",
      backfilled: false,
      origin: "desk",
      realizedPl: "-$620",
      returnPct: "-41.0%",
      realizedTone: "neg",
    },
    // A closing fill (#3689 Form strip): the round-trip matcher's realized P/L rides on it.
    {
      orderId: "ord-c2",
      symbol: "AMZN",
      display: "AMZN",
      side: "sell",
      quantity: 1,
      filled: 1,
      price: "$1.00",
      status: "filled",
      at: "2026-09-08T18:05:00Z",
      backfilled: false,
      origin: "desk",
      realizedPl: "+$210",
      returnPct: "+1.3%",
      realizedTone: "pos",
    },
    // A closing fill (#3689 Form strip): the round-trip matcher's realized P/L rides on it.
    {
      orderId: "ord-c1",
      symbol: "NFLX",
      display: "NFLX",
      side: "sell",
      quantity: 1,
      filled: 1,
      price: "$1.00",
      status: "filled",
      at: "2026-09-04T19:40:00Z",
      backfilled: false,
      origin: "desk",
      realizedPl: "-$145",
      returnPct: "-0.9%",
      realizedTone: "neg",
    },
    {
      orderId: "ord-001",
      symbol: "NVDA260918C00180000",
      display: "NVDA Sep 18 180 Call",
      side: "buy",
      quantity: 3,
      filled: 3,
      price: "$5.10",
      status: "filled",
      at: "2026-09-10T18:41:00Z",
      backfilled: false,
      origin: "desk",
    },
    {
      orderId: "ord-002",
      symbol: "AAPL",
      display: "AAPL",
      side: "buy",
      quantity: 200,
      filled: 200,
      price: "$198.50",
      status: "filled",
      at: "2026-09-09T15:20:00Z",
      backfilled: false,
      origin: "desk",
    },
  ],
};

const sauronActivity = {
  available: true,
  activity: [
    {
      orderId: "ord-s1",
      symbol: "TSLA",
      display: "TSLA",
      side: "buy",
      quantity: 50,
      filled: 50,
      price: "$340.20",
      status: "filled",
      at: "2026-09-10T16:05:00Z",
      backfilled: false,
      origin: "alpaca-direct",
    },
  ],
};

// Hero chart (#3186 slice 2) — a month of Eric's equity curve ending near the "1M +3.4%" window
// pill above, and SPY's own daily closes over the same span for the benchmark overlay. Both are
// deterministic (no randomness) so the screenshot is reproducible.
function dailyPoints(days, endReturn, jitter) {
  return Array.from({ length: days }, (_, i) => {
    const t = i / (days - 1);
    const value = endReturn * t + Math.sin(i / 2) * jitter;
    const day = new Date(Date.UTC(2026, 7, 12 + i));
    return { day, value };
  });
}
const ericCurve = dailyPoints(23, 0.034, 0.004);
const spyCurve = dailyPoints(23, 0.018, 0.003);

const ericEquityCurve = {
  range: "1M",
  points: ericCurve.map((p) => ({ t: p.day.toISOString(), value: p.value })),
};
const spyBars = {
  symbol: "SPY",
  bars: spyCurve.map((p) => {
    const close = 560 * (1 + p.value);
    return { t: p.day.toISOString(), o: close, h: close, l: close, c: close, v: 0 };
  }),
};

// The league (#3689 slice 4): a 9-entry field where Eric owns himself (#3) and Sauron (#9). The
// card highlights both, ⋯-skips to Sauron, and shows Eric's gap to Futurist just above him.
const boardRow = (key, name, kind, value, sortValue) => ({
  key,
  name,
  kind,
  value,
  tone: "pos",
  bar: 0,
  sortValue,
});
const board = {
  seq: 1,
  generatedAt: "2026-09-23T20:00:00Z",
  metric: "equity",
  view: {
    blocks: {},
    rows: [
      boardRow("bot-apex", "Apex", "bot", "$1,112,400", 1112400),
      boardRow("bot-futurist", "Futurist", "bot", "$1,051,832", 1051832),
      boardRow("human-eric", "Eric", "human", "$1,047,832", 1047832),
      boardRow("human-maya", "Maya", "human", "$1,020,115", 1020115),
      boardRow("bot-atlas", "Atlas", "bot", "$998,040", 998040),
      boardRow("human-sam", "Sam", "human", "$975,300", 975300),
      boardRow("bot-nova", "Nova", "bot", "$950,210", 950210),
      boardRow("human-lee", "Lee", "human", "$902,660", 902660),
      boardRow("bot-sauron", "Sauron", "bot", "$512,407", 512407),
    ],
  },
};

const { page, origin, out, close } = await openShell({
  name: "accounts",
  stubs: {
    "/api/settings": settings,
    "/api/board": board,
    // The netted option book the Money strip reads its plain greeks from: the NVDA call, 3 contracts.
    "/api/trade/option-positions": {
      available: true,
      asOf: "2026-09-23T20:00:00Z",
      rows: [
        {
          symbol: "NVDA260918C00180000",
          spot: 181.32,
          positionGreeks: { delta: 186, gamma: 4.2, theta: -38.4, vega: 21.6 },
        },
      ],
      book: {
        delta: 186,
        gamma: 4.2,
        theta: -38.4,
        vega: 21.6,
        covered: 1,
        total: 1,
        uncovered: [],
      },
      representative: true,
    },
    "/api/accounts/networth": networth,
    "/api/desk/human-eric": ericDesk,
    "/api/desk/bot-sauron": sauronDesk,
    "/api/desk/human-eric/activity": ericActivity,
    "/api/desk/bot-sauron/activity": sauronActivity,
    "/api/accounts/human-eric/equity-curve": ericEquityCurve,
    "/api/trade/bars": spyBars,
  },
});

// Frames go where the caller says (argv[2]) — never over a committed docs/shots/ directory, which a
// hard-coded path here once silently overwrote on every run.
const shootCockpit = shooter(page, out);

// --- PHONE FIRST (390px) ---
await page.setViewportSize({ width: 390, height: 844 });

// Summary section (default) — the sticky header with net-worth at-a-glance + section switch,
// the cash/position detail, and the hero chart (#3186 slice 2). Single account (Eric) first.
await page.goto(`${origin}/app/accounts`);
await page.getByText("Net worth · Eric").waitFor();
await page.locator(".hero-chart-legend").waitFor();
await shootCockpit("accounts-summary-phone");

// Needs a decision (#3689 slice 7): the card with its details open, scrolled into view.
await page.locator(".decisions").scrollIntoViewIfNeeded();
await page.getByRole("button", { name: /Why, and details/ }).click();
await shootCockpit("accounts-decision-phone");

// Positions section — the blotter below the sticky header.
await page.goto(`${origin}/app/accounts?section=positions`);
await page.getByText("Nvidia").first().waitFor();
await shootCockpit("accounts-positions-phone");

// Lot breakdown (#3186 slice 1) — expand the NVDA call's lot accordion: two lots sharing the
// parent row's exact columns, each with its own Close this buy / Roll actions.
await page.getByRole("button", { name: /buys for NVDA Sep 18 180 Call/ }).click();
await page.getByText("$1,484").waitFor();
await shootCockpit("accounts-positions-lots-phone");

// Activity section — the order timeline below the sticky header. Waits on the Symbol column
// (always visible) rather than Status, which lives in a `col-detail` cell hidden at phone width.
await page.goto(`${origin}/app/accounts?section=activity`);
await page.getByText("AAPL").first().waitFor();
await shootCockpit("accounts-activity-phone");

// All accounts — the aggregate view with the roster table in the Summary section.
await page.goto(`${origin}/app/accounts?account=all`);
await page.getByText("Net worth · all accounts").waitFor();
await shootCockpit("accounts-all-summary-phone");

// --- DESKTOP (1280px) ---
await page.setViewportSize({ width: 1280, height: 900 });

await page.goto(`${origin}/app/accounts`);
await page.getByText("Net worth · Eric").waitFor();
await page.locator(".hero-chart-legend").waitFor();
await page.locator(".decisions").waitFor();
await shootCockpit("accounts-summary-desktop");

// Glossary (#3689 slice 2): the plain label "Locked in" with its explanation opened by focus.
await page.getByRole("button", { name: "Locked in" }).focus();
await page.getByRole("tooltip").waitFor();
await shootCockpit("accounts-glossary-desktop");

// Form strip (#3689 slice 3b): hover the newest close to open its popover.
await page.keyboard.press("Escape");
await page.getByRole("link", { name: /^Closed .*: MSFT,/ }).hover();
await page.locator(".form-pop").first().waitFor({ state: "attached" });
await shootCockpit("accounts-form-desktop");

await page.goto(`${origin}/app/accounts?account=all`);
await page.getByText("Net worth · all accounts").waitFor();
await shootCockpit("accounts-all-summary-desktop");

// Wide (1600px, #3689 slice 4): net worth and league side by side, the design's hero row.
await page.mouse.move(0, 0);
await page.setViewportSize({ width: 1600, height: 1000 });
await page.goto(`${origin}/app/accounts`);
await page.locator(".league-card").waitFor();
await page.locator(".hero-chart-legend").waitFor();
await shootCockpit("accounts-wide-desktop");

// Needs a decision at 1600 (#3689 slice 7): the at-risk card, details open, range bar with "now".
await page.locator(".decisions").scrollIntoViewIfNeeded();
await page.getByRole("button", { name: /Why, and details/ }).click();
await page.mouse.move(0, 0);
await shootCockpit("accounts-decision-desktop");

// The positions table at 1600 (#3689 slice 6): plain names, expiry in days, decay, breakeven,
// best / worst case, with the Breakeven glossary open.
await page.locator(".blotter-card").first().scrollIntoViewIfNeeded();
await page.getByRole("button", { name: "Breakeven" }).hover();
await page.getByRole("tooltip").waitFor();
await shootCockpit("accounts-table-desktop");

await close();
