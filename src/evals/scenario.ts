import type { MarketContext, Portfolio, Position, Quote, Side } from "../domain/types.js";

/**
 * A readiness-eval scenario: a hand-built market situation + portfolio, plus the
 * behaviour we expect a sound persona to exhibit. Scenarios are pure DATA so packs
 * stay declarative and reviewable — see docs/AUTONOMY-READINESS.md for the plan.
 */
export type ScenarioCategory =
  | "signal-soundness"
  | "no-signal-discipline"
  | "exit-discipline"
  | "persona-fidelity"
  | "risk-boundary"
  | "adversarial";

export interface Expectation {
  /**
   * Should the persona place at least one (guarded) order here? Omit for a SAFETY-ONLY scenario —
   * one that asserts nothing about *whether* it trades (we don't know an unknown persona's strategy),
   * only that whatever it does is safe. This is what lets the generic battery grade any persona.
   */
  readonly trades?: boolean;
  /** If it trades, the side every order must take. */
  readonly side?: Side;
  /** If set, every order's symbol must be one of these (strategy fidelity). */
  readonly onlySymbols?: readonly string[];
  /** Symbols the persona must NEVER trade — a hard safety gate, not a quality nudge. */
  readonly forbiddenSymbols?: readonly string[];
}

export interface Scenario {
  readonly id: string;
  readonly category: ScenarioCategory;
  readonly description: string;
  readonly context: MarketContext;
  readonly portfolio: Portfolio;
  readonly expect: Expectation;
}

// --- tiny fixture helpers so scenario packs read as data, not assembly code ---

export function quote(symbol: string, last: number): Quote {
  return { symbol, bid: last - 0.05, ask: last + 0.05, last, asOf: "2026-07-24T14:30:00Z" };
}

export function context(
  symbols: Record<string, { last?: number; momentum?: number; sentiment?: number }>,
): MarketContext {
  const quotes: Record<string, Quote> = {};
  const momentum: Record<string, number> = {};
  const newsSentiment: Record<string, number> = {};
  for (const [symbol, spec] of Object.entries(symbols)) {
    quotes[symbol] = quote(symbol, spec.last ?? 100);
    if (spec.momentum !== undefined) {
      momentum[symbol] = spec.momentum;
    }
    if (spec.sentiment !== undefined) {
      newsSentiment[symbol] = spec.sentiment;
    }
  }
  return { asOf: "2026-07-24T14:30:00Z", quotes, momentum, newsSentiment };
}

export function portfolio(cash: number, positions: readonly Position[] = []): Portfolio {
  return { cash, positions };
}

export function position(symbol: string, quantity: number, avgPrice = 100): Position {
  return { symbol, quantity, avgPrice };
}
