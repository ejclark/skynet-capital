/**
 * TACTICAL PLAYBOOKS (issue #3527, slice 1 of the Sauron-as-configuration plan) — a second,
 * richer decision surface alongside `Playbook.desiredState`'s long/flat/no-window state machine.
 *
 * `desiredState` answers "what should my book look like right now?" with one of three states —
 * exactly right for a play with a single entry/exit window (a print, a TACO event). Some plays
 * (Sauron's hardcore research mode, `src/personas/sauron-hardcore.ts`) instead run a PRIORITIZED
 * RULE CHAIN every cycle: a universal stop, a partial-exit fade, a tranched entry, and a
 * momentum-scalp entry, each firing on its own sentiment/momentum thresholds, evaluated in order,
 * at most one intent per symbol per cycle. Forcing that onto `desiredState`'s three-state enum
 * would either lose behavior or bolt persona-specific code into the engine — so this is a second,
 * declarative shape: a `TacticalRule` is pure CONFIGURATION (thresholds + sizing), and
 * `tacticalIntentForSymbol` evaluates a rule list the exact same way `decideSymbol` already does
 * today, generalized so any future playbook can instantiate the same four rule kinds with its own
 * numbers, not just Sauron.
 *
 * SCOPE OF THIS SLICE: purely additive. Nothing here is wired into `playbookIntents` or
 * `withPlaybooks` yet — that's slice 2. No existing playbook, persona, or runtime path reads this
 * module, so every current behavior is byte-for-byte unchanged by its existence.
 *
 * ONE INTENT PER SYMBOL PER CYCLE, first-match-wins: this preserves the existing
 * one-playbook-owns-a-symbol rule (`playbook.ts`'s module doc) — a tactical playbook is still ONE
 * playbook per symbol, just with an internal priority chain instead of a single condition, exactly
 * matching `SauronHardcorePersona.decideSymbol`'s own exit-before-entry ordering.
 */
import { heldQuantity } from "../domain/portfolio.js";
import type { MarketContext, OrderIntent, PlaybookMode, Portfolio } from "../domain/types.js";
import { momentumOf, sentimentOf, sharesForNotional } from "../personas/persona.js";

/**
 * Universal exit: the thesis behind ANY held quantity is broken, regardless of which tactic
 * opened it — withdraw entirely. Mirrors hardcore Sauron's momentum stop exactly.
 */
export interface MomentumStopTactic {
  readonly kind: "momentum-stop";
  /** Fires when momentum falls to or below this. */
  readonly momentumAtOrBelow: number;
}

/**
 * Partial exit into exhausted sentiment: take a configured fraction off, closing the whole
 * position instead when the remainder would be dust. Mirrors hardcore Sauron's euphoria fade.
 */
export interface SentimentFadeTactic {
  readonly kind: "sentiment-fade";
  /** Fires when sentiment is at or above this (euphoria)… */
  readonly sentimentAtOrAbove: number;
  /** …AND momentum has rolled to at or below this (the extreme is exhausting). */
  readonly momentumAtOrBelow: number;
  /** Fraction of the held quantity to sell, in (0, 1]. */
  readonly exitFraction: number;
  /** Below this remaining notional value, close the whole position instead — no dust tails. */
  readonly dustNotional: number;
}

/**
 * Tranched entry into exhausted sentiment the other direction: a small, conviction-scaled buy
 * each time the signal re-fires, capped by total value already committed. Mirrors hardcore
 * Sauron's panic claim, including its continuous conviction scaling.
 */
export interface SentimentClaimTactic {
  readonly kind: "sentiment-claim";
  /** Fires when sentiment is at or below this (panic)… */
  readonly sentimentAtOrBelow: number;
  /** …AND momentum is at or above this (the extreme is turning). */
  readonly momentumAtOrAbove: number;
  /** Dollar size of one base tranche, before the conviction multiplier. */
  readonly trancheNotional: number;
  /** Conviction multiplier cap — scales linearly with how far past the threshold sentiment ran. */
  readonly maxConviction: number;
  /** No further entries (by this tactic OR a sibling entry tactic sharing the same cap) once the
   *  symbol's held value reaches this — the shared tranche budget hardcore Sauron enforces once
   *  for both its entry plays. Set the same value on every entry tactic for one symbol to
   *  reproduce that shared cap. */
  readonly maxTrancheValue: number;
}

/**
 * Entry on an ordinary (non-extreme) momentum run — the play that keeps the dataset flowing when
 * sentiment never visits an extreme. Mirrors hardcore Sauron's momentum scalp.
 */
export interface MomentumScalpTactic {
  readonly kind: "momentum-scalp";
  /** Fires when momentum is at or above this… */
  readonly momentumAtOrAbove: number;
  /** …AND sentiment sits in the unremarkable band strictly between these two (neither panic nor
   *  euphoria — the extremes have their own tactics). */
  readonly sentimentAbove: number;
  readonly sentimentBelow: number;
  /** Dollar size of one scalp entry — flat, not conviction-scaled. */
  readonly notional: number;
  /** Same shared-budget cap as `SentimentClaimTactic.maxTrancheValue` — see its doc. */
  readonly maxTrancheValue: number;
}

export type TacticalRule =
  | MomentumStopTactic
  | SentimentFadeTactic
  | SentimentClaimTactic
  | MomentumScalpTactic;

function momentumStopIntent(
  rule: MomentumStopTactic,
  playbookId: string,
  mode: PlaybookMode,
  symbol: string,
  momentum: number,
  held: number,
): OrderIntent | null {
  if (held <= 0 || momentum > rule.momentumAtOrBelow) {
    return null;
  }
  return {
    symbol,
    side: "sell",
    quantity: held,
    type: "market",
    playbookId,
    playbookMode: mode,
    urgent: true,
    reason:
      `${playbookId} momentum stop (${mode}): momentum ${momentum.toFixed(3)} broke ` +
      `${rule.momentumAtOrBelow} — withdrawing the whole position`,
  };
}

function sentimentFadeIntent(
  rule: SentimentFadeTactic,
  playbookId: string,
  mode: PlaybookMode,
  symbol: string,
  sentiment: number,
  momentum: number,
  held: number,
  lastPrice: number,
): OrderIntent | null {
  if (held <= 0 || sentiment < rule.sentimentAtOrAbove || momentum > rule.momentumAtOrBelow) {
    return null;
  }
  const partial = Math.ceil(held * rule.exitFraction);
  const remainderValue = (held - partial) * lastPrice;
  const quantity = remainderValue < rule.dustNotional ? held : partial;
  if (quantity <= 0) {
    return null;
  }
  return {
    symbol,
    side: "sell",
    quantity,
    type: "market",
    playbookId,
    playbookMode: mode,
    reason:
      `${playbookId} sentiment fade (${mode}): sentiment ${sentiment.toFixed(2)} exhausting ` +
      `(momentum ${momentum.toFixed(3)}) — selling ${quantity === held ? "the position" : "a fraction"} into it`,
  };
}

function sentimentClaimIntent(
  rule: SentimentClaimTactic,
  playbookId: string,
  mode: PlaybookMode,
  symbol: string,
  sentiment: number,
  momentum: number,
  heldValue: number,
  askPrice: number,
): OrderIntent | null {
  if (
    heldValue >= rule.maxTrancheValue ||
    sentiment > rule.sentimentAtOrBelow ||
    momentum < rule.momentumAtOrAbove
  ) {
    return null;
  }
  const excess = rule.sentimentAtOrBelow - sentiment;
  const conviction = Math.min(rule.maxConviction, 1 + excess);
  const quantity = sharesForNotional(rule.trancheNotional * conviction, askPrice);
  if (quantity <= 0) {
    return null;
  }
  return {
    symbol,
    side: "buy",
    quantity,
    type: "market",
    playbookId,
    playbookMode: mode,
    urgent: true,
    reason:
      `${playbookId} sentiment claim (${mode}): sentiment ${sentiment.toFixed(2)} exhausting ` +
      `(momentum ${momentum.toFixed(3)}) — tranche ${conviction.toFixed(2)}x`,
  };
}

function momentumScalpIntent(
  rule: MomentumScalpTactic,
  playbookId: string,
  mode: PlaybookMode,
  symbol: string,
  sentiment: number,
  momentum: number,
  heldValue: number,
  askPrice: number,
): OrderIntent | null {
  if (
    heldValue >= rule.maxTrancheValue ||
    momentum < rule.momentumAtOrAbove ||
    sentiment <= rule.sentimentAbove ||
    sentiment >= rule.sentimentBelow
  ) {
    return null;
  }
  const quantity = sharesForNotional(rule.notional, askPrice);
  if (quantity <= 0) {
    return null;
  }
  return {
    symbol,
    side: "buy",
    quantity,
    type: "market",
    playbookId,
    playbookMode: mode,
    urgent: true,
    reason:
      `${playbookId} momentum scalp (${mode}): momentum ${momentum.toFixed(3)} running ` +
      `(sentiment ${sentiment.toFixed(2)} unremarkable)`,
  };
}

/**
 * Evaluate one symbol's tactic chain for one cycle: first rule to fire wins, at most one intent —
 * the exact priority-and-single-intent shape `SauronHardcorePersona.decideSymbol` already uses.
 * `rules` order IS the priority order; a caller reproducing hardcore Sauron lists momentum-stop
 * first, then sentiment-fade, then sentiment-claim, then momentum-scalp.
 */
export function tacticalIntentForSymbol(
  playbookId: string,
  mode: PlaybookMode,
  symbol: string,
  rules: readonly TacticalRule[],
  context: MarketContext,
  portfolio: Portfolio,
): OrderIntent | null {
  const quote = context.quotes[symbol];
  if (!quote || quote.last <= 0) {
    return null;
  }
  const sentiment = sentimentOf(context, symbol);
  const momentum = momentumOf(context, symbol);
  const held = heldQuantity(portfolio, symbol);
  const heldValue = held * quote.last;

  for (const rule of rules) {
    const intent = ((): OrderIntent | null => {
      switch (rule.kind) {
        case "momentum-stop":
          return momentumStopIntent(rule, playbookId, mode, symbol, momentum, held);
        case "sentiment-fade":
          return sentimentFadeIntent(
            rule,
            playbookId,
            mode,
            symbol,
            sentiment,
            momentum,
            held,
            quote.last,
          );
        case "sentiment-claim":
          return sentimentClaimIntent(
            rule,
            playbookId,
            mode,
            symbol,
            sentiment,
            momentum,
            heldValue,
            quote.ask,
          );
        case "momentum-scalp":
          return momentumScalpIntent(
            rule,
            playbookId,
            mode,
            symbol,
            sentiment,
            momentum,
            heldValue,
            quote.ask,
          );
      }
    })();
    if (intent) {
      return intent;
    }
  }
  return null;
}
