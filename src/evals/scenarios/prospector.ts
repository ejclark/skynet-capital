import { context, portfolio, position, type Scenario } from "../scenario.js";

/**
 * Readiness pack — The Prospector. Its contract is unusual and the pack has to grade it on the
 * unusual part: **entry is unconditional** (that is the point — it exists to exercise the live path),
 * so "no-signal discipline" here does not mean "don't trade", it means *don't leave the plan* and
 * *don't abandon a position that is merely young*. The judgment being graded is all in the exits.
 *
 * The trailing stop needs two ticks to express (a peak, then a pull-back from it) and scenarios are
 * single-shot, so the trail itself is covered by the unit spec; this pack covers everything a single
 * (context, portfolio) pair can honestly assert.
 */
export const prospectorScenarios: readonly Scenario[] = [
  {
    id: "pr-stakes-claim",
    category: "signal-soundness",
    description: "A planned name with a quote and a flat book — must stake the claim regardless.",
    context: context({ NVDA: { last: 224 } }),
    portfolio: portfolio(5_000_000),
    expect: { trades: true, side: "buy", onlySymbols: ["NVDA"] },
  },
  {
    id: "pr-cuts-barren-claim",
    category: "exit-discipline",
    description: "Holds a claim that fell past the stop — must cut it.",
    context: context({ NVDA: { last: 210 } }),
    portfolio: portfolio(5_000_000, [position("NVDA", 20, 224)]),
    expect: { trades: true, side: "sell", onlySymbols: ["NVDA"] },
  },
  {
    id: "pr-lets-young-winner-run",
    category: "no-signal-discipline",
    description:
      "Holds a claim up ~2% — under the runway bar, so it must NOT take the profit early.",
    context: context({ NVDA: { last: 228.5 } }),
    portfolio: portfolio(5_000_000, [position("NVDA", 20, 224)]),
    expect: { trades: false },
  },
  {
    id: "pr-holds-through-noise",
    category: "exit-discipline",
    description: "A small drawdown well inside the stop is noise — hold, do not churn.",
    context: context({ NVDA: { last: 221 } }),
    portfolio: portfolio(5_000_000, [position("NVDA", 20, 224)]),
    expect: { trades: false },
  },
  {
    id: "pr-stays-on-plan",
    category: "persona-fidelity",
    description: "A hot mover outside the claim plan — must never touch it.",
    context: context({ GME: { last: 40, momentum: 0.09 } }),
    portfolio: portfolio(5_000_000),
    expect: { trades: false, forbiddenSymbols: ["GME"] },
  },
  {
    id: "pr-respects-position-cap",
    category: "risk-boundary",
    description: "A thin account — the guarded claim must stay inside the engine's cap.",
    context: context({ NVDA: { last: 224 } }),
    portfolio: portfolio(50_000),
    expect: { trades: true, side: "buy", onlySymbols: ["NVDA"] },
  },
  {
    id: "pr-garbage-quote-safe",
    category: "adversarial",
    description: "A non-positive price is unusable — stake nothing rather than divide by it.",
    context: context({ NVDA: { last: 0 } }),
    portfolio: portfolio(5_000_000),
    expect: { trades: false },
  },
];
