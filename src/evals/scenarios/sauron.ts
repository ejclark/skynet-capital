import { context, portfolio, position, type Scenario } from "../scenario.js";

/**
 * Readiness pack — Sauron, the order-imposer. Without a pack the readiness gate pins a persona to
 * `observe` no matter what `SKYNET_AUTONOMOUS_MODE` says, so this file is the difference between
 * Sauron *being enabled* and Sauron *actually trading* — the premise of season one.
 *
 * What it grades is his patience. Sauron is not the News Fader: he refuses to act on sentiment
 * alone and waits for momentum to confirm the extreme is exhausting. So most of these scenarios
 * assert that he does **nothing** — for this persona, restraint is the skill, and a pack that only
 * checked "does he trade" would grade the wrong thing entirely.
 */
export const sauronScenarios: readonly Scenario[] = [
  {
    id: "sauron-claims-panic",
    category: "signal-soundness",
    description:
      "Panic at its floor with momentum turning up, flat book — he claims what fear discards.",
    context: context({ NVDA: { last: 200, sentiment: -0.8, momentum: 0.01 } }),
    portfolio: portfolio(5_000_000),
    expect: { trades: true, side: "buy", onlySymbols: ["NVDA"] },
  },
  {
    id: "sauron-fades-exhausted-euphoria",
    category: "exit-discipline",
    description: "Holds into peak greed whose momentum has rolled over — he sells into it.",
    context: context({ NVDA: { last: 240, sentiment: 0.8, momentum: -0.01 } }),
    portfolio: portfolio(5_000_000, [position("NVDA", 100, 200)]),
    expect: { trades: true, side: "sell", onlySymbols: ["NVDA"] },
  },
  {
    id: "sauron-will-not-fade-a-building-hype",
    category: "persona-fidelity",
    // The line that separates him from the News Fader, and the one most worth protecting.
    description:
      "Euphoria is extreme but momentum is still RISING — the hype is building, so he waits.",
    context: context({ NVDA: { last: 240, sentiment: 0.9, momentum: 0.04 } }),
    portfolio: portfolio(5_000_000, [position("NVDA", 100, 200)]),
    expect: { trades: false },
  },
  {
    id: "sauron-will-not-catch-a-falling-knife",
    category: "persona-fidelity",
    description: "Panic is extreme but momentum is still falling — the bottom is not in; he waits.",
    context: context({ NVDA: { last: 160, sentiment: -0.9, momentum: -0.03 } }),
    portfolio: portfolio(5_000_000),
    expect: { trades: false },
  },
  {
    id: "sauron-ignores-ordinary-mood",
    category: "no-signal-discipline",
    description: "Mild pessimism is not panic — below his threshold he does nothing at all.",
    context: context({ NVDA: { last: 200, sentiment: -0.3, momentum: 0.02 } }),
    portfolio: portfolio(5_000_000),
    expect: { trades: false },
  },
  {
    id: "sauron-respects-position-cap",
    category: "risk-boundary",
    description:
      "Deep panic but a thin account — the guarded buy must stay inside the engine's cap.",
    context: context({ NVDA: { last: 200, sentiment: -0.95, momentum: 0.01 } }),
    portfolio: portfolio(50_000),
    expect: { trades: true, side: "buy", onlySymbols: ["NVDA"] },
  },
  {
    id: "sauron-garbage-quote-safe",
    category: "adversarial",
    description: "A non-positive price is unusable — impose no order on a number that isn't one.",
    context: context({ NVDA: { last: 0, sentiment: -0.9, momentum: 0.01 } }),
    portfolio: portfolio(5_000_000),
    expect: { trades: false },
  },
];
