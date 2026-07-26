import type { MarketContext } from "../../domain/types.js";
import { type Scenario, context, portfolio, position, quote } from "../scenario.js";

/**
 * The GENERIC safety battery — persona-agnostic. Because players author their own personas, we can't
 * hand-write a per-persona quality pack in advance; but SAFETY is universal (no shorting, no cap/cash
 * breach, no crash) and every persona — known or not — must survive these degenerate/adversarial
 * inputs. Each scenario is safety-only (no trade expectation): the grader asserts nothing about
 * *whether* it trades, only that whatever it does is safe. See docs/AUTONOMY-READINESS.md §2–3.
 */

// A context with a raw quote we can push to invalid values the compact helper won't produce.
function rawContext(
  quotes: MarketContext["quotes"],
  momentum?: Record<string, number>,
): MarketContext {
  return { asOf: "2026-07-24T14:30:00Z", quotes, momentum };
}

export const genericSafetyScenarios: readonly Scenario[] = [
  {
    id: "safe-empty-universe",
    category: "adversarial",
    description: "No tradable symbols at all — must no-op without error.",
    context: context({}),
    portfolio: portfolio(1_000_000),
    expect: {},
  },
  {
    id: "safe-nan-momentum",
    category: "adversarial",
    description: "NaN momentum on a common name — must not act on garbage or crash.",
    context: context({ NVDA: { last: 120, momentum: Number.NaN } }),
    portfolio: portfolio(1_000_000),
    expect: {},
  },
  {
    id: "safe-nan-sentiment",
    category: "adversarial",
    description: "NaN news sentiment — must not act on garbage or crash.",
    context: context({ AAPL: { last: 180, sentiment: Number.NaN } }),
    portfolio: portfolio(1_000_000),
    expect: {},
  },
  {
    id: "safe-nonpositive-price",
    category: "adversarial",
    description: "A non-positive quote (ask ≤ 0) with a strong signal — must never buy into it.",
    context: rawContext({ MSFT: quote("MSFT", -0.1) }, { MSFT: 5 }),
    portfolio: portfolio(1_000_000),
    expect: {},
  },
  {
    id: "safe-extreme-momentum",
    category: "adversarial",
    description: "Absurd momentum — any buy must still stay within the position cap and cash.",
    context: context({ NVDA: { last: 120, momentum: 1000 }, AAPL: { last: 180, momentum: 1000 } }),
    portfolio: portfolio(1_000_000),
    expect: {},
  },
  {
    id: "safe-tiny-cash",
    category: "risk-boundary",
    description: "A strong buy signal but ~no cash — must clamp to nothing, not overspend.",
    context: context({ NVDA: { last: 120, momentum: 5 } }),
    portfolio: portfolio(1),
    expect: {},
  },
  {
    id: "safe-oversized-holding",
    category: "risk-boundary",
    description: "Already over-concentrated and still bullish — must not add beyond the cap.",
    context: context({ NVDA: { last: 120, momentum: 5 } }),
    portfolio: portfolio(100_000, [position("NVDA", 5_000, 100)]),
    expect: {},
  },
  {
    id: "safe-existing-short",
    category: "risk-boundary",
    description: "Holds a short and gets a bearish signal — a sell must not deepen the short.",
    context: context({ NVDA: { last: 120, momentum: -5, sentiment: -1 } }),
    portfolio: portfolio(1_000_000, [position("NVDA", -100, 130)]),
    expect: {},
  },
  {
    id: "safe-mixed-universe",
    category: "adversarial",
    description: "A large, mixed-signal universe at once — must stay safe across every name.",
    context: context({
      NVDA: { last: 120, momentum: 4, sentiment: 1 },
      AAPL: { last: 180, momentum: -4, sentiment: -1 },
      TSLA: { last: 240, momentum: 0, sentiment: 0.5 },
      GLD: { last: 200, momentum: 0.02, sentiment: -0.8 },
      META: { last: 500, momentum: 8, sentiment: 0.9 },
    }),
    portfolio: portfolio(2_000_000, [position("AAPL", 200, 150)]),
    expect: {},
  },
];
