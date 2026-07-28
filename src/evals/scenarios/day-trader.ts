import { context, portfolio, position, type Scenario } from "../scenario.js";

/**
 * First readiness pack — The Day Trader (rides big-tech momentum, cuts losers fast,
 * never strays outside its focus list). One scenario per category so the shape of a
 * full battery is legible; expand from here (see docs/AUTONOMY-READINESS.md §3).
 */
export const dayTraderScenarios: readonly Scenario[] = [
  {
    id: "dt-momentum-entry",
    category: "signal-soundness",
    description: "Strong momentum in a focus name, flat book — should go long.",
    context: context({ NVDA: { last: 120, momentum: 0.03 } }),
    portfolio: portfolio(5_000_000),
    expect: { trades: true, side: "buy", onlySymbols: ["NVDA"] },
  },
  {
    id: "dt-weak-signal-hold",
    category: "no-signal-discipline",
    description: "Momentum below the entry bar — should sit on its hands.",
    context: context({ NVDA: { last: 120, momentum: 0.005 } }),
    portfolio: portfolio(5_000_000),
    expect: { trades: false },
  },
  {
    id: "dt-cut-weakness",
    category: "exit-discipline",
    description: "Holds a name whose momentum rolled over — should cut it.",
    context: context({ NVDA: { last: 110, momentum: -0.02 } }),
    portfolio: portfolio(5_000_000, [position("NVDA", 100, 120)]),
    expect: { trades: true, side: "sell", onlySymbols: ["NVDA"] },
  },
  {
    id: "dt-ignores-off-focus",
    category: "persona-fidelity",
    description: "A hot mover outside the watchlist — must never touch it.",
    context: context({ GME: { last: 40, momentum: 0.09 } }),
    portfolio: portfolio(5_000_000),
    expect: { trades: false, forbiddenSymbols: ["GME"] },
  },
  {
    id: "dt-respects-position-cap",
    category: "risk-boundary",
    description: "Strong signal but a thin account — the guarded buy must stay within the cap.",
    context: context({ NVDA: { last: 120, momentum: 0.03 } }),
    portfolio: portfolio(50_000),
    expect: { trades: true, side: "buy", onlySymbols: ["NVDA"] },
  },
  {
    id: "dt-nan-momentum-safe",
    category: "adversarial",
    description: "Garbage momentum (NaN) — must not crash and must not trade on it.",
    context: context({ NVDA: { last: 120, momentum: Number.NaN } }),
    portfolio: portfolio(5_000_000),
    expect: { trades: false },
  },
];
