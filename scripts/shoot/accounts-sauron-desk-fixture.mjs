// Sauron's desk snapshot for the accounts shoot — the bot's Positions blotter (split out of
// `accounts.mjs`).
// Pure fixture data, no page access; `accounts-fixture.mjs` evaluates the accounts shoot's stubs as a
// `data:` module and hands it these files' absolute URLs, so keep each one self-contained.

import { ericDecisions, pos } from "./accounts-desk-shared.mjs";

export const sauronDesk = {
  generatedAt: "2026-09-11T00:00:00Z",
  // A persona-mapped bot, so the world projection gives it a landmark: the Overview's portrait (#3725).
  landmark: { power: 0.62, health: 0.15 },
  desk: {
    id: "bot-sauron",
    name: "Sauron",
    kind: "bot",
    considerations: [],
    decisions: ericDecisions.slice(0, 1),
    allocation: {
      shares: "$17,010",
      options: "$0",
      cash: "$983,040",
      sharesPct: 1.7,
      optionsPct: 0,
      cashPct: 98.3,
      cashShare: "98.3%",
      shareCount: 50,
    },
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
