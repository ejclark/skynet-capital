/**
 * The persona BEHAVIOUR PROBE — a hand-built tape, run through a real persona, recording what it
 * actually did.
 *
 * Why probe rather than tag: a hand-maintained "risk posture" table beside the registry drifts the
 * first time someone retunes a threshold, and then the browse surface lies about the bot. A persona
 * is already a pure function of (context, portfolio) — so the honest way to ask "is this one a
 * contrarian?" is to show it a panic and watch. The answer can never disagree with the code,
 * because the answer IS the code running.
 *
 * The probe is a stimulus/response harness, not a backtest: the book does NOT update between
 * frames (no fills are simulated), so each frame asks "given this book, what would you do on this
 * tape right now?". Multiple frames exist only so stateful personas (the Prospector tracks a peak)
 * see a run of prices rather than a single instant.
 */
import type { MarketContext, OrderIntent, Portfolio, Position, Quote } from "../domain/types.js";
import type { Persona } from "../personas/persona.js";

/** One symbol's state on one frame of the probe tape. */
export interface TapeQuote {
  readonly symbol: string;
  readonly price: number;
  /** Short-window price change as a fraction, exactly as `MarketContext.momentum` carries it. */
  readonly momentum: number;
  /** News sentiment in [-1, 1], exactly as `MarketContext.newsSentiment` carries it. */
  readonly sentiment: number;
}

/** One decision cycle's worth of tape. */
export interface TapeFrame {
  readonly asOf: string;
  readonly quotes: readonly TapeQuote[];
}

/** A scenario: the frames, plus the book the persona is holding while it watches them. */
export interface Tape {
  readonly frames: readonly TapeFrame[];
  readonly cash: number;
  readonly positions: readonly Position[];
}

/**
 * Which input a CONTROL tape neutralises. A control is what separates "reacted to the signal" from
 * "was going to do that anyway" — the Prospector stakes its claims on any tape at all, so without a
 * control it would land in every collection and misdescribe itself in all of them.
 *
 *  - `sentiment` / `momentum` — that channel is flattened to neutral, prices untouched.
 *  - `pnl` — every held symbol is re-priced to its own entry, so the book shows no gain or loss.
 */
export type MutedChannel = "sentiment" | "momentum" | "pnl";

/** One thing a persona did on the tape, with the conditions it did it under. */
export interface TapeAction {
  readonly symbol: string;
  readonly side: OrderIntent["side"];
  /** The persona's own words — carried through to the browse surface as the membership receipt. */
  readonly reason: string;
  /** That symbol's sentiment on the frame the action happened. */
  readonly sentiment: number;
  /** That symbol's momentum on the frame the action happened. */
  readonly momentum: number;
  /** Mean sentiment across the whole frame — "while the rest of the tape was hated" questions. */
  readonly tapeSentiment: number;
}

/** Stable identity of an action, for comparing a signal run against its control run. */
export const actionKey = (action: TapeAction): string => `${action.symbol}|${action.side}`;

function quoteOf(q: TapeQuote, asOf: string): Quote {
  return { symbol: q.symbol, bid: q.price, ask: q.price, last: q.price, asOf };
}

function contextOf(frame: TapeFrame): MarketContext {
  const quotes: Record<string, Quote> = {};
  const momentum: Record<string, number> = {};
  const newsSentiment: Record<string, number> = {};
  for (const q of frame.quotes) {
    quotes[q.symbol] = quoteOf(q, frame.asOf);
    momentum[q.symbol] = q.momentum;
    newsSentiment[q.symbol] = q.sentiment;
  }
  return { asOf: frame.asOf, quotes, momentum, newsSentiment };
}

/** Mean sentiment across a frame; 0 for an empty frame (no symbols is no mood, not a bad mood). */
function meanSentiment(frame: TapeFrame): number {
  if (frame.quotes.length === 0) {
    return 0;
  }
  return frame.quotes.reduce((sum, q) => sum + q.sentiment, 0) / frame.quotes.length;
}

/**
 * Run one persona through a tape and record everything it did. The persona instance is used for
 * every frame in order, so per-persona memory (the Prospector's high-water mark) behaves as it does
 * in the engine; callers hand in a FRESH instance per tape so one probe can never colour another.
 */
export function runTape(persona: Persona, tape: Tape): TapeAction[] {
  const portfolio: Portfolio = { cash: tape.cash, positions: tape.positions };
  const actions: TapeAction[] = [];
  for (const frame of tape.frames) {
    const bySymbol = new Map(frame.quotes.map((q) => [q.symbol, q]));
    const tapeSentiment = meanSentiment(frame);
    for (const intent of persona.decide(contextOf(frame), portfolio)) {
      const q = bySymbol.get(intent.symbol);
      if (!q) {
        continue; // a persona cannot trade what the tape never quoted — nothing honest to record
      }
      actions.push({
        symbol: intent.symbol,
        side: intent.side,
        reason: intent.reason,
        sentiment: q.sentiment,
        momentum: q.momentum,
        tapeSentiment,
      });
    }
  }
  return actions;
}

/** The control tape: the same prices and the same book, with one input neutralised. */
export function mute(tape: Tape, channel: MutedChannel): Tape {
  const entry = new Map(tape.positions.map((p) => [p.symbol, p.avgPrice]));
  return {
    cash: tape.cash,
    positions: tape.positions,
    frames: tape.frames.map((frame) => ({
      asOf: frame.asOf,
      quotes: frame.quotes.map((q) => ({
        symbol: q.symbol,
        price: channel === "pnl" ? (entry.get(q.symbol) ?? q.price) : q.price,
        momentum: channel === "momentum" ? 0 : q.momentum,
        sentiment: channel === "sentiment" ? 0 : q.sentiment,
      })),
    })),
  };
}
