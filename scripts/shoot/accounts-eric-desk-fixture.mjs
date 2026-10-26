// Eric's desk snapshot for the accounts shoot — his Positions blotter and the considerations rail
// (split out of `accounts.mjs`).
// Pure fixture data, no page access; `accounts-fixture.mjs` evaluates the accounts shoot's stubs as a
// `data:` module and hands it these files' absolute URLs, so keep each one self-contained.

import { ericDecisions, pos } from "./accounts-desk-shared.mjs";

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
    action: { label: "View playbook", href: "/app/research?section=playbooks&account=human-eric" },
  },
];

export const ericDesk = {
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
    // NVDA's Aug 26 print is behind the fixture's date, so the next headline macro print stands in
    // (`src/domain/market-events/fomc-2026-10-28.json`).
    nextEvent: {
      label: "Fed meeting Oct 28",
      at: "2026-10-28",
      beforeExpiry: false,
      scope: "market",
    },
  },
  AAPL: {
    plainName: "Shares · profits if AAPL rises",
    expiresIn: "no expiry",
    breakeven: "$198.50",
    best: "unlimited",
    worst: "−$39,700",
    // AAPL's Oct 29 print (`src/domain/earnings-calendar.ts`) is inside the 60-day share horizon.
    nextEvent: { label: "Earnings Oct 29", at: "2026-10-29", beforeExpiry: false, scope: "stock" },
    nextPrint: { status: "estimate", at: "2026-10-29", label: "Earnings Oct 29 (estimated)" },
  },
  NVDA260918C00180000: {
    plainName: "Call option · profits if NVDA rises",
    expiresIn: "25 days",
    expiresInDays: 25,
    breakeven: "$185.10",
    best: "unlimited",
    worst: "−$1,530",
    nextEvent: { label: "Earnings Aug 26", at: "2026-08-26", beforeExpiry: true, scope: "stock" },
    // NVDA's Aug 26 print is behind the fixture's date and the table has no next one yet.
    nextPrint: { status: "unknown", label: "Next earnings date not known yet" },
  },
};
ericDesk.desk.positions = ericDesk.desk.positions.map((p) => ({ ...p, ...PLAIN[p.symbol] }));
