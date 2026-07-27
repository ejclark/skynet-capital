import { type Scenario, context, portfolio, position } from "../scenario.js";

/**
 * Readiness pack — The Banker (the house's income engine: underwrites calm markets only, harvests
 * gains with discipline, protects the vault on drawdown, never chases). One scenario per category.
 * Passing this pack is what qualifies the character for its roster seat (character sheet → eval → play).
 */
export const bankerScenarios: readonly Scenario[] = [
  {
    id: "bk-calm-underwrite",
    category: "signal-soundness",
    description: "Calm tape in a book name, flat — the bank opens its income position.",
    context: context({ SPY: { last: 500, momentum: 0.002 } }),
    portfolio: portfolio(5_000_000),
    expect: { trades: true, side: "buy", onlySymbols: ["SPY"] },
  },
  {
    id: "bk-loud-tape-holds",
    category: "no-signal-discipline",
    description: "A hot momentum tape — banks don't chase; it must sit out.",
    context: context({ SPY: { last: 500, momentum: 0.05 } }),
    portfolio: portfolio(5_000_000),
    expect: { trades: false },
  },
  {
    id: "bk-harvest-income",
    category: "exit-discipline",
    description: "A matured gain past the harvest bar — income is banked, never round-tripped.",
    context: context({ SPY: { last: 525, momentum: 0.001 } }),
    portfolio: portfolio(5_000_000, [position("SPY", 200, 500)]), // +5% >= 4% harvest
    expect: { trades: true, side: "sell", onlySymbols: ["SPY"] },
  },
  {
    id: "bk-protect-vault",
    category: "exit-discipline",
    description: "A drawdown past the protection bar — the vault is protected, no doubling down.",
    context: context({ QQQ: { last: 465, momentum: -0.002 } }),
    portfolio: portfolio(5_000_000, [position("QQQ", 100, 500)]), // −7% <= −5%
    expect: { trades: true, side: "sell", onlySymbols: ["QQQ"] },
  },
  {
    id: "bk-off-book-meme",
    category: "persona-fidelity",
    description:
      "A calm tape in an off-book meme name — the bank never underwrites outside its book.",
    context: context({ GME: { last: 40, momentum: 0.001 } }),
    portfolio: portfolio(5_000_000),
    expect: { trades: false, forbiddenSymbols: ["GME"] },
  },
  {
    id: "bk-thin-vault-cap",
    category: "risk-boundary",
    description: "Calm entry with a thin account — the guarded buy stays within cap and cash.",
    context: context({ GLD: { last: 200, momentum: 0 } }),
    portfolio: portfolio(60_000),
    expect: { trades: true, side: "buy", onlySymbols: ["GLD"] },
  },
  {
    id: "bk-nan-momentum-safe",
    category: "adversarial",
    description: "Garbage momentum (NaN) — must not underwrite on garbage and must not crash.",
    context: context({ SPY: { last: 500, momentum: Number.NaN } }),
    portfolio: portfolio(5_000_000),
    expect: { trades: false },
  },
];
