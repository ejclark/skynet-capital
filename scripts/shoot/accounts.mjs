// Visual harness for /app/accounts (#2321) — the Cockpit: sticky net-worth header + horizontal
// section switch + scrollable section detail. PHONE FIRST (docs/PICTURES.md → "Trading surfaces
// shoot the phone frame first"): the 390px frame proves the curation, the desktop frame proves it
// expanded. JPEG ≤100KB.
// Usage: npm run build --prefix app && npm run shoot:accounts [outdir]
import { resolve } from "node:path";
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
const win = (label, value, tone, note, partial = false) => ({
  label,
  value,
  tone,
  note,
  known: true,
  ...(partial ? { partial: true } : {}),
});

const ericStats = {
  value: "$1,047,832.14",
  valueKnown: true,
  dayChange: "+$2,418.67",
  dayTone: "pos",
  dayKnown: true,
  cash: "$847,200.00",
  cashKnown: true,
  positionCount: 6,
  windows: [
    win("7D", "+1.2%", "pos", "last week"),
    win("1M", "+3.4%", "pos", "last month"),
    win("3M", "+8.1%", "pos", "last quarter"),
    win("1Y", "+12.7%", "pos", "last year"),
  ],
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
});

const ericDesk = {
  generatedAt: "2026-09-11T00:00:00Z",
  desk: {
    id: "human-eric",
    name: "Eric",
    kind: "human",
    positions: [
      pos(
        "NVDA",
        "NVDA",
        "Nvidia",
        false,
        "100",
        "$172.40",
        "$181.32",
        "$17,240.00",
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
        "$39,700.00",
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
        "$1,530.00",
        "$2,226.00",
        "+$696.00",
        "+45.5%",
        "pos",
        "+$696.00",
        696.0,
        "+45.49%",
        "pos",
        0.2,
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

const sauronDesk = {
  generatedAt: "2026-09-11T00:00:00Z",
  desk: {
    id: "bot-sauron",
    name: "Sauron",
    kind: "bot",
    positions: [
      pos(
        "TSLA",
        "TSLA",
        "Tesla",
        false,
        "50",
        "$340.20",
        "$338.00",
        "$17,010.00",
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
        "$51,030.00",
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

const { page, origin, close } = await openShell({
  name: "accounts",
  stubs: {
    "/api/settings": settings,
    "/api/accounts/networth": networth,
    "/api/desk/human-eric": ericDesk,
    "/api/desk/bot-sauron": sauronDesk,
    "/api/desk/human-eric/activity": ericActivity,
    "/api/desk/bot-sauron/activity": sauronActivity,
  },
});

const out = resolve("docs/shots/pr-2321");
const shootCockpit = shooter(page, out);

// --- PHONE FIRST (390px) ---
await page.setViewportSize({ width: 390, height: 844 });

// Summary section (default) — the sticky header with net-worth at-a-glance + section switch,
// and the cash/position detail below. Single account (Eric) first.
await page.goto(`${origin}/app/accounts`);
await page.getByText("Net worth · Eric").waitFor();
await shootCockpit("accounts-summary-phone");

// Positions section — the blotter below the sticky header.
await page.goto(`${origin}/app/accounts?section=positions`);
await page.getByText("Nvidia").first().waitFor();
await shootCockpit("accounts-positions-phone");

// Activity section — the order timeline below the sticky header.
await page.goto(`${origin}/app/accounts?section=activity`);
await page.getByText("filled").first().waitFor();
await shootCockpit("accounts-activity-phone");

// All accounts — the aggregate view with the roster table in the Summary section.
await page.goto(`${origin}/app/accounts?account=all`);
await page.getByText("Net worth · all accounts").waitFor();
await shootCockpit("accounts-all-summary-phone");

// --- DESKTOP (1280px) ---
await page.setViewportSize({ width: 1280, height: 900 });

await page.goto(`${origin}/app/accounts`);
await page.getByText("Net worth · Eric").waitFor();
await shootCockpit("accounts-summary-desktop");

await page.goto(`${origin}/app/accounts?account=all`);
await page.getByText("Net worth · all accounts").waitFor();
await shootCockpit("accounts-all-summary-desktop");

await close();
