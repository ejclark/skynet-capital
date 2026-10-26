// Visual harness for /app/accounts (#2321) — the Cockpit: sticky net-worth header + horizontal
// section switch + scrollable section detail. PHONE FIRST (docs/PICTURES.md → "Trading surfaces
// shoot the phone frame first"): the 390px frame proves the curation, the desktop frame proves it
// expanded. JPEG ≤100KB. The `accounts-head-*` frames (#3807 slice 2·1) are the cockpit head —
// no calendar in it since #5074 — with the next date on what the book holds under the net-worth
// card; the run also prints the stuck chrome at 390. The `events-*` frames (slice 2c, #5074) are
// the Events section, its range as its head over the lanes: a book with a held event, one with
// nothing dated on it, and (#5045) an empty default week naming the next event on the book, then
// the range that one tap lands on. `events-calendar.mjs` shoots the round-2 study's book.
// Usage: npm run build --prefix app && npm run shoot:accounts [outdir]

import { join } from "node:path";
import { ericDesk, sauronDesk } from "./accounts-desk-fixture.mjs";
import {
  sauronAllPasses,
  sauronNoTrades,
  sauronProbes,
  sauronRollCall,
  sauronVerdict,
} from "./accounts-heartbeat-fixture.mjs";
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
  value: "$1,047,832",
  valueKnown: true,
  dayChange: "+$2,419 · +0.23%",
  dayTone: "pos",
  dayKnown: true,
  cash: "$847,200",
  cashKnown: true,
  bookedPl: "+$12,480",
  bookedTone: "pos",
  bookedKnown: true,
  onPaper: "+$47,832",
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
  value: "$512,407",
  valueKnown: true,
  dayChange: "-$1,102 · -0.21%",
  dayTone: "neg",
  dayKnown: true,
  cash: "$201,400",
  cashKnown: true,
  positionCount: 3,
  bookedPl: "—",
  bookedTone: "flat",
  bookedKnown: false,
  onPaper: "+$22,106",
  onPaperTone: "pos",
  onPaperKnown: true,
  windows: [
    win("7D", "+0.8%", "pos", "last week"),
    win("1M", "-1.1%", "neg", "last month"),
    win("3M", "+4.2%", "pos", "last quarter"),
    win("1Y", "+22.3%", "pos", "last year"),
  ],
};

const totalStats = {
  value: "$1,560,239",
  valueKnown: true,
  dayChange: "+$1,316 · +0.08%",
  dayTone: "pos",
  dayKnown: true,
  cash: "$1,048,600",
  cashKnown: true,
  positionCount: 9,
  bookedPl: "—",
  bookedTone: "flat",
  bookedKnown: false,
  onPaper: "+$22,106",
  onPaperTone: "pos",
  onPaperKnown: true,
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
    {
      id: "human-eric",
      name: "Eric",
      kind: "human",
      ...ericStats,
      idle: "81% idle",
      invested: "$200,632",
      idlePct: 80.9,
    },
    {
      id: "bot-sauron",
      name: "Sauron",
      kind: "bot",
      ...sauronStats,
      idle: "39% idle",
      invested: "$311,007",
      idlePct: 39.3,
    },
  ],
  total: { ...totalStats, idle: "67% idle", idlePct: 67.2, invested: "$511,639" },
};

// The same book at a new all-time high (#3689 slice 10): the ceremony's frame swaps this in.
const networthAtHigh = {
  ...networth,
  accounts: [
    {
      ...networth.accounts[0],
      value: "$1,051,200",
      allTimeHigh: { value: "$1,051,200", at: "9/23", aboveNow: 0 },
      toNewHigh: undefined,
    },
    networth.accounts[1],
  ],
};
let atHigh = false;

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

// Beta-scout's forced picks as they read live (#3687 slice 4): placed on Sauron's broker, decided
// under "beta-scout" — the row opens to that decision, reason verbatim from the production trail.
const scoutReason = (sentiment, strength) =>
  `BETA-PHASE FORCED PICK — no organic trade fired today, so this was chosen from whatever signal already existed, not a conviction call: sentiment=${sentiment} momentum=-0.001 (combined strength ${strength}, ranked among 2 forced picks). Do not read this as playbook-evidence performance.`;
const scoutFill = (orderId, symbol, quantity, price, sentiment, strength) => ({
  orderId,
  symbol,
  display: symbol,
  side: "buy",
  quantity,
  filled: quantity,
  price,
  status: "filled",
  at: "2026-09-23T19:02:00Z",
  backfilled: false,
  origin: "unknown",
  reasoning: {
    reason: scoutReason(sentiment, strength),
    personaId: "beta-scout",
    playbookId: "BETA-SCOUT",
    playbookMode: "conservative",
    // The round this fill came out of, and its funnel (#3961) — what lets the why name how much
    // the pass weighed and link to the whole thing on Heartbeat.
    cycleAt: "2026-09-23T19:02:00.000Z",
    rawCount: 3,
    guardedCount: 2,
  },
});
const sauronActivity = {
  available: true,
  activity: [
    scoutFill("ord-s3", "MSFT", 9, "$428.10", "0.60", "0.601"),
    scoutFill("ord-s2", "AMZN", 18, "$231.44", "0.50", "0.501"),
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

// The Pulse payload the net-worth card's standing line reads (#3964). Only the three headline tiles
// matter to the card, but the shape is the server's whole `DeskPulseView` so the frame proves the
// selection, not a trimmed stub.
//
// The record counts `ericActivity`'s own seven closes, so the numbers agree with the Form strip
// squares directly above them in the same frame: 5W · 2L → 71.4%, and $3,105 won ÷ $765 lost →
// 4.06×. The drawdown is NOT derived — `equityDrawdown` measures the deepest dip from a running
// peak, and `ericCurve` (a 23-day rise with 0.4% noise) barely dips at all, so a figure taken from
// it would be too small to prove the row renders a real percentage. 0.32% is the gap to the same
// $1,051,200 all-time high the card's meter draws beside it, which is a different measure but not
// a contradictory one at this scale — a stand-in, not a claim about the curve.
//
const ericPulse = {
  pulse: {
    curve: null,
    weeks: [],
    race: null,
    streaks: [],
    tiles: [
      {
        key: "equity",
        label: "Equity",
        value: "$1,047,832.14",
        note: "cash $847,200.00",
        known: true,
      },
      {
        key: "netRealized",
        label: "Net realized",
        value: "+$2,340.00",
        note: "booked, not on paper",
        known: true,
        tone: "pos",
      },
      { key: "winRate", label: "Win rate", value: "71.4%", note: "5W · 2L", known: true },
      {
        key: "profitFactor",
        label: "Profit factor",
        value: "4.06×",
        note: "wins ÷ losses; above 1× is paying",
        known: true,
      },
      {
        key: "maxDrawdown",
        label: "Max drawdown",
        value: "0.32%",
        note: "from peak $1,051,200.00",
        known: true,
        tone: "neg",
      },
    ],
  },
};

// Sauron's card reads "locked in —" because nothing has closed on it (`sauronStats.bookedKnown` is
// false, and `sauronNoTrades` is the decisions payload), so its Pulse must say the same: no record
// yet. This is the fixture that proves the other half of the row — with every headline fact
// unknown, the standing line renders NOTHING rather than three bare dashes a member would read as
// a record. Two accounts on one page, both frames honest.
const sauronPulse = {
  pulse: {
    curve: null,
    weeks: [],
    race: null,
    streaks: [],
    tiles: [
      {
        key: "equity",
        label: "Equity",
        value: "$512,406.88",
        note: "cash $201,400.00",
        known: true,
      },
      {
        key: "netRealized",
        label: "Net realized",
        value: "+$0.00",
        note: "needs a closed trade",
        known: false,
      },
      {
        key: "winRate",
        label: "Win rate",
        value: "—",
        note: "needs a closed trade",
        known: false,
      },
      {
        key: "profitFactor",
        label: "Profit factor",
        value: "—",
        note: "nothing lost yet",
        known: false,
      },
      {
        key: "maxDrawdown",
        label: "Max drawdown",
        value: "—",
        note: "needs two equity samples",
        known: false,
      },
    ],
  },
};

const spyBars = {
  symbol: "SPY",
  bars: spyCurve.map((p) => {
    const close = 560 * (1 + p.value);
    return { t: p.day.toISOString(), o: close, h: close, l: close, c: close, v: 0 };
  }),
};

// The league (#3689 slice 4, 1M since its follow-up): a 9-entry field ranked by this month's return,
// where Eric owns himself (#3) and Sauron (#9). The card highlights both, ⋯-skips to Sauron, and
// shows Eric's gap to Futurist just above him in points. Sauron's month hasn't synced yet, so it
// ranks last and reads "—" (the server's UNKNOWN_RANK), never a false 0%. The stub answers by path
// alone, so this is the board the card's default "1M" asks for.
const boardRow = (key, name, kind, value, sortValue) => ({
  key,
  name,
  kind,
  value,
  tone: sortValue < -1e8 || sortValue === 0 ? "flat" : sortValue > 0 ? "pos" : "neg",
  bar: 0,
  sortValue,
});
const board = {
  seq: 1,
  generatedAt: "2026-09-23T20:00:00Z",
  metric: "month",
  view: {
    blocks: {},
    rows: [
      boardRow("bot-apex", "Apex", "bot", "+6.84%", 6.84),
      boardRow("bot-futurist", "Futurist", "bot", "+5.12%", 5.12),
      boardRow("human-eric", "Eric", "human", "+4.37%", 4.37),
      boardRow("human-maya", "Maya", "human", "+2.90%", 2.9),
      boardRow("bot-atlas", "Atlas", "bot", "+1.05%", 1.05),
      boardRow("human-sam", "Sam", "human", "-0.62%", -0.62),
      boardRow("bot-nova", "Nova", "bot", "-1.48%", -1.48),
      boardRow("human-lee", "Lee", "human", "-3.10%", -3.1),
      boardRow("bot-sauron", "Sauron", "bot", "—", -1e9),
    ],
  },
};

// The bot heartbeat (#3687 slice 3). The topbar market clock reads the real time, so the fixture
// follows it: a live loop mid-session when the market is open, an idle one otherwise — a frame
// saying "Running" beside "Opens in 2h" would picture a state the server can never return.
const etNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
const etMinutes = etNow.getHours() * 60 + etNow.getMinutes();
const sessionOpen = etNow.getDay() % 6 !== 0 && etMinutes >= 570 && etMinutes < 960;
// `stubBody` sees only the pathname, so the trades filter can't be read off the query string here:
// the frame that pictures the toggle on flips this immediately before ticking the box, and the
// component's own refetch (a new react-query key) picks up the wider payload.
let tradedPassesIncluded = false;

// A bot that sat out the whole last session (#4949) — the closed-market stale the server returns
// once the newest pass predates that session's open. Its own frames, then back to the live loop.
let sauronSatOut = false;
const sauronHeartbeat = () => {
  const lastAgo = sauronSatOut ? 3 * 86_400_000 : sessionOpen ? 20_000 : 16 * 3_600_000;
  const today = new Date(Date.now() - lastAgo - 5 * 3_600_000).toISOString();
  return {
    available: true,
    heartbeat: {
      state: sauronSatOut ? "stale" : sessionOpen ? "beating" : "market-closed",
      marketOpen: sauronSatOut ? false : sessionOpen,
      lastPassAt: new Date(Date.now() - lastAgo).toISOString(),
      sinceLastPassMs: lastAgo,
      cadenceMs: 15_000,
      staleAfterMs: 120_000,
      playbooks: [
        sauronVerdict("SAURON", "aggressive", "tactical", today),
        sauronVerdict("CRWV-WHEEL", "aggressive", "no-window", today),
        sauronVerdict("S1-NVDA", "standard", "no-window", "2026-09-22T13:30:00Z", true),
        sauronVerdict("NVDA-CALL-SPREAD", "aggressive", "no-window", "2026-10-05T13:30:00Z"),
        sauronVerdict("G1-GOOG", "standard", "no-window", "2026-09-29T13:30:00Z"),
        sauronVerdict("TACO-DJT", "standard", "no-window", today),
      ],
      rollCall: sauronRollCall,
    },
  };
};

// The research calendar the Events section joins to the book (#3807 slice 2c) — October 2026 as
// the checked-in corpus has it (`src/domain/market-events/*.json`, `earnings-calendar.ts`): the
// three headline macro prints, AAPL's print and launch (Eric holds AAPL), and two rows that must
// NOT appear on either book (MRVL is not held; a Treasury auction is not a headline print).
const researchEvent = (id, title, date, symbols = [], kind = "macro-print") => ({
  id,
  title,
  date,
  kind,
  impact: "high",
  symbols,
  researched: false,
});
const research = {
  events: [
    researchEvent("jobs-2026-10-02", "Employment Situation (Sep 2026 data)", "2026-10-02"),
    researchEvent("mrvl-investor-day-2026-10-06", "MRVL Investor Day (NYC)", "2026-10-06", [
      "MRVL",
    ]),
    researchEvent("cpi-2026-10-14", "CPI release (Sep 2026 data)", "2026-10-14"),
    researchEvent(
      "treasury-20y-bond-2026-10-21",
      "20-Year Treasury Bond auction (reopening)",
      "2026-10-21",
      [],
      "rates",
    ),
    researchEvent(
      "aapl-iphone-duo-launch-2026-10-23",
      "iPhone Duo goes on sale — Apple's first foldable",
      "2026-10-23",
      ["AAPL"],
      "product-launch",
    ),
    researchEvent("fomc-2026-10-28", "FOMC decision (meeting Oct 27–28)", "2026-10-28"),
    researchEvent(
      "aapl-2026-10-29-print",
      "AAPL earnings print",
      "2026-10-29",
      ["AAPL"],
      "earnings",
    ),
  ],
  closures: [],
  calls: [],
  symbols: [],
  studies: [],
  ledgers: [],
};

const { page, origin, out, close } = await openShell({
  name: "accounts",
  stubs: {
    "/api/settings": settings,
    "/api/board": board,
    "/api/research": research,
    // The calendar-only slice (#4204) the Events section and the cockpit head now read.
    "/api/research/calendar": research,
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
    "/api/accounts/networth": () => (atHigh ? networthAtHigh : networth),
    "/api/desk/human-eric": ericDesk,
    "/api/desk/bot-sauron": sauronDesk,
    "/api/desk/human-eric/activity": ericActivity,
    "/api/desk/human-eric/pulse": ericPulse,
    "/api/desk/bot-sauron/pulse": sauronPulse,
    "/api/desk/bot-sauron/activity": sauronActivity,
    "/api/desk/bot-sauron/heartbeat": sauronHeartbeat,
    "/api/desk/bot-sauron/probes": sauronProbes,
    "/api/desk/bot-sauron/decisions": () =>
      tradedPassesIncluded ? sauronAllPasses : sauronNoTrades,
    "/api/accounts/human-eric/equity-curve": ericEquityCurve,
    "/api/accounts/bot-sauron/equity-curve": ericEquityCurve,
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
await page.locator(".hero-chart-legend").waitFor({ state: "attached" });
await shootCockpit("accounts-summary-phone");

// The head, Level 2 (#5072): Sauron's Overview at landing — the account row with the bot's status
// as a plain link, one vitals line (net worth · today · cash), the switch with "More ▾" — then the
// menu under the name, then More opened. (Milestones taking More's slot is `shoot:milestones`'s:
// this harness stubs no milestones.)
await page.goto(`${origin}/app/accounts?account=bot-sauron`);
await page.locator(".head-vitals .head-worth").waitFor();
await page.locator(".head-account .hb-line").waitFor();
await page.waitForLoadState("networkidle");
await shootCockpit("head-bot-phone");
await page.getByRole("button", { name: /^Account: / }).click();
await page.getByRole("navigation", { name: "Account menu" }).waitFor();
await shootCockpit("head-menu-phone");
await page.keyboard.press("Escape");
await page.getByRole("button", { name: "More sections" }).click();
await page.locator(".cockpit-nav-more-list").waitFor();
await shootCockpit("head-more-phone");
await page.goto(`${origin}/app/accounts`);
await page.getByText("Net worth · Eric").waitFor();
await page.locator(".hero-chart-legend").waitFor({ state: "attached" });

// The standing line (#3964): the member's own record inside the net-worth card — win rate, profit
// factor, max drawdown, then the link to the rest of this account's Pulse. Its own frame at 390
// because unlike the card's footer this row does NOT hide at phone width, and that is the claim
// worth proving by eye.
await page.locator(".standing-line").scrollIntoViewIfNeeded();
await page.waitForTimeout(150);
await shootCockpit("accounts-standing-phone");
await page.evaluate(() => window.scrollTo(0, 0));

// The cockpit head with no calendar in it (#5074) and, under the net-worth card, the next date on
// what this book holds — it reads no range, so the week in the URL changes nothing here. The stuck
// chrome is measured because the head's height is judged by a number: the topbar plus the sticky
// head, once the page has scrolled.
await page.goto(`${origin}/app/accounts?on=2026-10-26&span=week`);
await page.getByText("Net worth · Eric").waitFor();
await page.locator(".held-next").waitFor();
await shootCockpit("accounts-head-phone");
await page.evaluate(() => window.scrollTo(0, 900));
await page.waitForTimeout(150);
const stuck = await page.evaluate(() =>
  Math.round(
    Math.max(
      0,
      ...[".topbar", ".cockpit-head"].map(
        (s) => document.querySelector(s)?.getBoundingClientRect().bottom ?? 0,
      ),
    ),
  ),
);
console.log(`stuck chrome at 390 (topbar + cockpit head, scrolled): ${stuck}px`);
// The next-date line under the net-worth card, scrolled into the frame's lower third.
await page.locator(".held-next").scrollIntoViewIfNeeded();
await page.evaluate(() => window.scrollBy(0, 200));
await page.waitForTimeout(150);
await shootCockpit("accounts-held-phone");
await page.evaluate(() => window.scrollTo(0, 0));

// The whole phone Overview in one tall frame (#3689 slice 8, handoff 3b): value and one line,
// the league as a line, the money card, one decision card, then positions as cards.
await page.locator(".pos-cards").waitFor();
await page.screenshot({
  path: join(out, "accounts-phone-full.jpg"),
  type: "jpeg",
  quality: 50,
  fullPage: true,
});
console.log(`shot ${join(out, "accounts-phone-full.jpg")}`);

// The guidance line on every row (#5070; the "Needs a decision" pager it replaced retired): the
// first card's guidance opened in place, with Not now and its return condition.
await page.locator(".pos-cards .pos-guide-call").first().scrollIntoViewIfNeeded();
await page.locator(".pos-cards .pos-guide-call").first().click();
await shootCockpit("accounts-guidance-phone");

// Positions at phone width (#3689 slice 8): one card per position, not the wide table. The lot
// breakdown lives in the wide table, so its frame moved to the desktop pass below.
await page.goto(`${origin}/app/accounts?section=positions`);
await page.locator(".pos-card").first().scrollIntoViewIfNeeded();
await shootCockpit("accounts-positions-phone");

// Activity section — the order timeline below the sticky header. Waits on the Symbol column
// (always visible) rather than Status, which lives in a `col-detail` cell hidden at phone width.
await page.goto(`${origin}/app/accounts?section=ledger`);
await page.getByText("AAPL").first().waitFor();
await shootCockpit("accounts-activity-phone");

// All accounts — the aggregate view with the roster table in the Summary section.
await page.goto(`${origin}/app/accounts?account=all`);
await page.getByText("Net worth · all accounts").waitFor();
await shootCockpit("accounts-all-summary-phone");

// Events (#3807 slice 2c), phone first: October on Eric's book — AAPL's launch and print held,
// the three headline prints market-wide — then Sauron's, where TSLA and SPY have nothing dated,
// so the held line says so in words and the market-wide prints still show.
await page.goto(`${origin}/app/accounts?section=events&on=2026-10-15&span=month`);
await page.getByText("AAPL earnings print").waitFor();
// The lanes' ▲ on the day AAPL's decision is due (#3977 slice 4, drawn as lanes by #5074).
await page.locator(".lanes-key").evaluate((el) => el.scrollIntoView({ block: "end" }));
await shootCockpit("events-marks-phone");
// At 390 the agenda sits beneath the grid: the frame ends on its footer so the rows are the picture.
await page.locator(".agenda-foot").evaluate((el) => el.scrollIntoView({ block: "end" }));
await shootCockpit("events-held-phone");
await page.goto(
  `${origin}/app/accounts?section=events&account=bot-sauron&on=2026-10-15&span=month`,
);
await page.getByText("Nothing dated on what you hold").waitFor();
await page.locator(".agenda-foot").evaluate((el) => el.scrollIntoView({ block: "end" }));
await shootCockpit("events-empty-phone");
// #5045: the default week (no `span`) of Oct 5 holds nothing on Eric's book, so the section names
// the next event on what he holds — AAPL's launch day, Oct 23 — and one tap moves the range there.
await page.goto(`${origin}/app/accounts?section=events&on=2026-10-05`);
await page.locator(".book-next-jump").waitFor();
await page.locator(".agenda-foot").evaluate((el) => el.scrollIntoView({ block: "end" }));
await shootCockpit("events-next-phone");
await page.locator(".book-next-jump").click();
await page.locator(".agenda-row[data-tier='held']").first().waitFor();
await page.locator(".agenda-foot").evaluate((el) => el.scrollIntoView({ block: "end" }));
await shootCockpit("events-next-landed-phone");

// --- DESKTOP (1280px) ---
await page.setViewportSize({ width: 1280, height: 900 });

await page.goto(`${origin}/app/accounts?section=events&on=2026-10-15&span=month`);
await page.getByText("AAPL earnings print").waitFor();
await shootCockpit("events-held-desktop");
await page.goto(
  `${origin}/app/accounts?section=events&account=bot-sauron&on=2026-10-15&span=month`,
);
await page.getByText("Nothing dated on what you hold").waitFor();
await shootCockpit("events-empty-desktop");

await page.goto(`${origin}/app/accounts`);
await page.getByText("Net worth · Eric").waitFor();
await page.locator(".hero-chart-legend").waitFor({ state: "attached" });
await page.locator(".blotter .row-guide").first().waitFor();
await page.locator(".standing-line").waitFor();
await shootCockpit("accounts-summary-desktop");

// The head at 1280 (#5072): every section fits, your own after a hairline; the room adds the bot's
// last check, today's percent and the cash amount — never a new concept.
await page.goto(`${origin}/app/accounts?account=bot-sauron`);
await page.locator(".head-account .hb-line").waitFor();
await shootCockpit("head-bot-desktop");

// The cockpit head at 1280 with no calendar in it (#5074), the next date on what this book holds
// under the net-worth card.
await page.goto(`${origin}/app/accounts?on=2026-10-26&span=week`);
await page.getByText("Net worth · Eric").waitFor();
await page.locator(".held-next").waitFor();
await shootCockpit("accounts-head-desktop");

// Lot breakdown (#3186 slice 1) in the wide table: the NVDA call's two buys, each with its own
// Close this buy / Roll actions — in the row's opened detail since the ranked columns (#5071).
await page.getByRole("button", { name: "Detail for NVDA Sep 18 180 Call" }).click();
await page.getByText("$1,484").waitFor();
await shootCockpit("accounts-positions-lots-desktop");

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

// The All-accounts roster (#3689 slice 10, handoff 2b): sparkline, month vs S&P, deployed · idle.
await page.locator(".networth-roster").scrollIntoViewIfNeeded();
await shootCockpit("accounts-roster-desktop");

// Wide (1600px, #3689 slice 4): net worth and league side by side, the design's hero row.
await page.mouse.move(0, 0);
await page.setViewportSize({ width: 1600, height: 1000 });
await page.goto(`${origin}/app/accounts`);
await page.locator(".league-card").waitFor();
await page.locator(".hero-chart-legend").waitFor({ state: "attached" });
await shootCockpit("accounts-wide-desktop");

// The guidance line at 1600 (#5070): a full-width row under each position in the table.
await page.locator(".blotter .row-guide").first().scrollIntoViewIfNeeded();
await page.mouse.move(0, 0);
await shootCockpit("accounts-guidance-desktop");

// Map lens (#3689 slice 9, handoff 3c): the treemap with the options strip and the stacked
// decisions column; then the Runway (slice 10's lens, built alongside).
await page.goto(`${origin}/app/accounts?lens=map`);
await page.locator(".map-tree").scrollIntoViewIfNeeded();
await page.mouse.move(0, 0);
// The hatched cash tile is detail-heavy for JPEG; a lower quality keeps this frame under 100KB.
await page.screenshot({ path: join(out, "accounts-map-desktop.jpg"), type: "jpeg", quality: 45 });
console.log(`shot ${join(out, "accounts-map-desktop.jpg")}`);
await page.goto(`${origin}/app/accounts?lens=runway`);
await page.locator(".runway").scrollIntoViewIfNeeded();
await shootCockpit("accounts-runway-desktop");
await page.goto(`${origin}/app/accounts`);
await page.locator(".blotter .row-guide").first().waitFor();

// The positions table at 1600 (#3689 slice 6; ranked columns #5071): the row spec's two-line
// cells, θ · Δ, Model projects, next event and best / worst case, with the Model projects glossary
// open (breakeven moved into the Position cell, so its header glossary is gone).
await page.locator(".blotter-card").first().scrollIntoViewIfNeeded();
await page.getByRole("button", { name: "Model projects" }).hover();
await page.getByRole("tooltip").waitFor();
await shootCockpit("accounts-table-desktop");

// The new-high ceremony (#3689 slice 10, handoff 2c): the same page, the book at a new high.
atHigh = true;
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${origin}/app/accounts`);
await page.getByRole("dialog").waitFor();
await page.waitForTimeout(400);
await shootCockpit("accounts-new-high-desktop");
atHigh = false;

// A bot's Playbooks (#5073 — Heartbeat merged in as its top strip): the bot's checks, the counted
// line, then one card per playbook — phone first. Then one card opened in place, the check log
// unfolded from the strip, the same log with the traded rounds included (#3961), COND-SCOUT's
// shadow probes, the head line on another section, a bot that sat out a session, and the bench.
// The stage fades in on every navigation (`motion.css`, stage-enter): a frame taken the moment its
// element attaches pictures the page half-dimmed. And the cockpit head is sticky at 390 too, so a
// scrolled frame puts its subject just under the head, never behind it.
const settle = () => page.waitForTimeout(450);
const underHead = (selector, gap = 8) =>
  page.evaluate(
    ([sel, pad]) => {
      const el = document.querySelector(sel);
      const sticky = document.querySelector(".cockpit-head")?.getBoundingClientRect().bottom ?? 0;
      if (el) window.scrollBy(0, el.getBoundingClientRect().top - sticky - pad);
    },
    [selector, gap],
  );
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${origin}/app/accounts?account=bot-sauron&section=playbooks`);
await page.locator(".pbb-cards").waitFor();
await settle();
await shootCockpit("accounts-playbooks-phone");
// One card opened in place: the rest of its reason, its mode and since, the way to change it.
await page.getByText("S1-NVDA", { exact: true }).click();
await page.locator(".pbb-card details[open] .pbb-open").waitFor();
await underHead(".pbb-card:has(details[open])", 150);
await settle();
await shootCockpit("accounts-playbooks-open-phone");
// The footer: the playbook that is off, opened to why, beside the way to change it.
await page.getByText("S1-NVDA", { exact: true }).click();
await page.locator(".pbb-off summary").click();
await underHead(".pbb-foot", 260);
await settle();
await shootCockpit("accounts-playbooks-off-phone");
// COND-SCOUT's shadow probes (#3651 slice 7b), scrolled so the card's title and its "Simulated"
// banner clear the sticky header — the banner is the claim this frame has to prove.
await underHead(".sp-card");
await shootCockpit("accounts-playbooks-probes-phone");
// The check log, unfolded from the strip — what an old `?section=heartbeat` link lands on.
await page.goto(`${origin}/app/accounts?account=bot-sauron&section=heartbeat`);
await page.locator(".pbb-log .cycles").waitFor();
await underHead(".pbb-strip");
await settle();
await shootCockpit("accounts-playbooks-log-phone");
// The same log with the traded rounds included (#3961) — the check behind a fill, opened: its
// placed and rejected orders, the idea the guards refused, and the ideas → past-the-guards count.
tradedPassesIncluded = true;
await page.getByRole("checkbox", { name: /Include the checks that placed a trade/ }).check();
await page.locator(".cycle-placed").waitFor();
await page.locator(".cycle-placed .cycle-row").click();
await page.locator(".cycle-placed .cycle-body").waitFor();
await underHead(".cycle-placed");
await shootCockpit("accounts-playbooks-traded-round-phone");
tradedPassesIncluded = false;
// The head line on another section — "● Running · 7 playbooks ›", the way in from anywhere.
await page.goto(`${origin}/app/accounts?account=bot-sauron&section=ledger`);
await page.locator(".hb-line").waitFor();
await settle();
await shootCockpit("accounts-head-line-phone");
// A bot that made no check all last session (#4949): "Not checking · no check last session",
// never "idle" — the strip's heavier border and its plain-words definition.
sauronSatOut = true;
await page.goto(`${origin}/app/accounts?account=bot-sauron&section=playbooks`);
await page.locator(".pbb-strip[data-state='stale']").waitFor();
await settle();
await shootCockpit("accounts-playbooks-stale-phone");
sauronSatOut = false;
// The bench: the fact takes its own column and the mode rides beside the state word.
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(`${origin}/app/accounts?account=bot-sauron&section=playbooks`);
await page.locator(".pbb-cards").waitFor();
await settle();
await shootCockpit("accounts-playbooks-desktop");
await page.getByRole("button", { name: /Every check/ }).click();
await page.locator(".pbb-log .cycles").waitFor();
await settle();
await shootCockpit("accounts-playbooks-log-desktop");
await page.locator(".sp-card").scrollIntoViewIfNeeded();
await shootCockpit("accounts-playbooks-probes-desktop");

// Decisions folded into Activity (#3687 slice 4): a beta-scout trade opened to its decision.
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${origin}/app/accounts?account=bot-sauron&section=ledger`);
await page.getByRole("button", { name: "Why MSFT was bought" }).click();
await page.locator(".row-why").waitFor();
await shootCockpit("accounts-activity-why-phone");
// The round behind that fill (#3961), at the foot of the same why: how many ideas the pass raised,
// how many cleared the guards, and the link to the whole pass on Heartbeat.
await page.locator(".why-round").scrollIntoViewIfNeeded();
// Scrolling the row into view also scrolls the blotter sideways at 390 — put the columns back so
// the frame pictures the why, not a mid-scroll table.
await page.locator(".blotter-scroll").evaluate((el) => {
  el.scrollLeft = 0;
});
await shootCockpit("accounts-activity-round-phone");
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(`${origin}/app/accounts?account=bot-sauron&section=ledger`);
await page.getByRole("button", { name: "Why MSFT was bought" }).click();
await page.locator(".row-why").waitFor();
await shootCockpit("accounts-activity-why-desktop");

// Sauron's character card (#3727, handoff 6a): the tower over the league. Phone first (the card
// follows the decision, full ladder kept), then the wide page — the tower in the frame's own
// column (#3977) — then the same page mid-glance after a range chip is clicked.
// From the bench width the tower is the page frame's one frame over its column (#3977,
// `iframe.vantage`); below it, the boxed card's own (`.char-art iframe`).
const cardReady = async (frame = ".char-art iframe") => {
  await page.locator(frame).waitFor();
  await page.waitForFunction(
    (sel) => document.querySelector(sel)?.contentWindow?.__ready === true,
    frame,
    { timeout: 60000 },
  );
  await page.waitForTimeout(1200);
};
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${origin}/app/accounts?account=bot-sauron`);
// No WebGL on a phone (#4190): the card at 390 is the league under its mist, no tower frame.
await page.locator(".char-card").waitFor();
// Element shots are taken after scrolling, so the sticky top bar and cockpit head would paint over
// the card's top. Unstick them for this one frame.
await page.addStyleTag({ content: ".topbar, .cockpit-head { position: static !important; }" });
await page.locator(".char-card").screenshot({
  path: join(out, "accounts-card-phone.jpg"),
  type: "jpeg",
  quality: 62,
});
console.log(`shot ${join(out, "accounts-card-phone.jpg")}`);
await page.setViewportSize({ width: 1650, height: 1100 });
await page.goto(`${origin}/app/accounts?account=bot-sauron`);
await cardReady("iframe.vantage");
await shootCockpit("accounts-card-desktop");
await page.getByRole("button", { name: "3M", exact: true }).click();
await page.waitForTimeout(900);
await shootCockpit("accounts-card-glance-desktop");

await close();
