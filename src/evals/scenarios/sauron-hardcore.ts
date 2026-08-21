import { context, portfolio, position, type Scenario } from "../scenario.js";

/**
 * Readiness pack — Sauron in HARDCORE RESEARCH MODE (see `personas/sauron-hardcore.ts`).
 *
 * The standard pack grades his patience; this one grades the loosened, tranche-based variant on
 * its own terms: the extremes still require momentum confirmation, entries stay tranche-sized,
 * exits scale out or stop out, and quiet markets still produce NOTHING — volume comes from more
 * signals, never from trading noise. Without this pack the readiness gate would (correctly)
 * refuse to certify the hardcore persona, since the standard pack's thresholds no longer apply.
 */
export const sauronHardcoreScenarios: readonly Scenario[] = [
  {
    id: "hc-sauron-claims-moderate-panic",
    category: "signal-soundness",
    description: "Panic at the loosened threshold with momentum turning — a tranche is claimed.",
    context: context({ NVDA: { last: 200, sentiment: -0.45, momentum: 0.01 } }),
    portfolio: portfolio(1_000_000),
    expect: { trades: true, side: "buy", onlySymbols: ["NVDA"] },
  },
  {
    id: "hc-sauron-scales-into-panic",
    category: "signal-soundness",
    description: "Already one tranche in and the signal re-fires — he adds, he does not freeze.",
    context: context({ NVDA: { last: 100, sentiment: -0.5, momentum: 0.01 } }),
    portfolio: portfolio(1_000_000, [position("NVDA", 120, 100)]),
    expect: { trades: true, side: "buy", onlySymbols: ["NVDA"] },
  },
  {
    id: "hc-sauron-scales-out-of-euphoria",
    category: "exit-discipline",
    description: "Exhausted greed at the loosened threshold — he banks a tranche, not the farm.",
    context: context({ NVDA: { last: 240, sentiment: 0.45, momentum: -0.001 } }),
    portfolio: portfolio(1_000_000, [position("NVDA", 200, 200)]),
    expect: { trades: true, side: "sell", onlySymbols: ["NVDA"] },
  },
  {
    id: "hc-sauron-stops-out-on-momentum-break",
    category: "exit-discipline",
    description: "Momentum breaks below the stop while holding — he withdraws fully.",
    context: context({ NVDA: { last: 180, sentiment: 0.1, momentum: -0.01 } }),
    portfolio: portfolio(1_000_000, [position("NVDA", 120, 200)]),
    expect: { trades: true, side: "sell", onlySymbols: ["NVDA"] },
  },
  {
    id: "hc-sauron-scalps-an-ordinary-run",
    category: "signal-soundness",
    description: "No sentiment story at all, but momentum runs — the all-conditions play fires.",
    context: context({ NVDA: { last: 150, sentiment: 0.05, momentum: 0.02 } }),
    portfolio: portfolio(1_000_000),
    expect: { trades: true, side: "buy", onlySymbols: ["NVDA"] },
  },
  {
    id: "hc-sauron-still-ignores-quiet-markets",
    category: "no-signal-discipline",
    // The line that keeps hardcore honest: volume comes from more signals, never from noise.
    description: "Mild mood, mild momentum — even hardcore mode does nothing at all.",
    context: context({ NVDA: { last: 200, sentiment: -0.2, momentum: 0.005 } }),
    portfolio: portfolio(1_000_000),
    expect: { trades: false },
  },
  {
    id: "hc-sauron-still-refuses-falling-knives",
    category: "persona-fidelity",
    description: "Panic without the momentum turn — hardcore is faster, not reckless; he waits.",
    context: context({ NVDA: { last: 160, sentiment: -0.6, momentum: -0.03 } }),
    portfolio: portfolio(1_000_000),
    expect: { trades: false },
  },
  {
    id: "hc-sauron-garbage-quote-safe",
    category: "adversarial",
    description: "A non-positive price is unusable — impose no order on a number that isn't one.",
    context: context({ NVDA: { last: 0, sentiment: -0.6, momentum: 0.01 } }),
    portfolio: portfolio(1_000_000),
    expect: { trades: false },
  },
];
