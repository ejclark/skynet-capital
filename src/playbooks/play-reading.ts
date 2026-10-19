/**
 * ONE READING OF A SUBSCRIBED PLAY AGAINST ITS TARGET (#5493 slice 4; #5483 slice 3). The observer
 * (`with-target-observation.ts`, on a live bot) and the book-health view (the Balance section's
 * imbalance findings) both ask the same question of a book: which target does this subscription
 * carry, what has the play deployed, and where does that sit against the band. This module is the
 * one place that answers it, so the two can never disagree about a level for the same book. The
 * band math itself is `play-target.ts`'s (the backtest's); this adds the three steps around it:
 * which target, which ceiling, which book.
 *
 * PURE: no I/O and no clock. Reading a play places nothing.
 */

import { bookNeeds } from "../domain/option-book.js";
import { positionFor, positionValue } from "../domain/portfolio.js";
import type { PlaybookSubscription, PlayTarget, Portfolio, Quote } from "../domain/types.js";
import { contractMultiplier, parseOccSymbol } from "../trading/option-symbols.js";
import {
  DEFAULT_PLAY_TARGET,
  HOUSE_PLAY_BOUNDS,
  type PlayBook,
  type PlayReading,
  type PlayTargetBounds,
  type PlayTargetResolution,
  type ResolvedPlayTarget,
  readPlayTarget,
  resolvePlayTarget,
} from "./play-target.js";

/** The plays observed with the default target when their subscription states none: one bot. */
export const FIRST_RUN_PLAY_TARGETS: readonly {
  readonly accountId: string;
  readonly playbookId: string;
  readonly target: PlayTarget;
}[] = [{ accountId: "sauron", playbookId: "CRWV-WHEEL", target: DEFAULT_PLAY_TARGET }];

/**
 * The target a subscription is read against, checked against its playbook's bounds: its own
 * `playTarget`, else the first-run table's for this account and play. `undefined` is "this play has
 * no target" (nothing to read, nothing to show); a refused one comes back `ok: false` with why.
 */
export function targetFor(
  accountId: string | undefined,
  sub: PlaybookSubscription,
  bounds: PlayTargetBounds = HOUSE_PLAY_BOUNDS,
  firstRun: typeof FIRST_RUN_PLAY_TARGETS = FIRST_RUN_PLAY_TARGETS,
): PlayTargetResolution | undefined {
  const own =
    sub.playTarget ??
    (accountId === undefined
      ? undefined
      : firstRun.find((f) => f.accountId === accountId && f.playbookId === sub.playbookId)?.target);
  return own ? resolvePlayTarget(own, bounds) : undefined;
}

/** A play's budget, the ceiling its share is a share of; `undefined` when it has none to read. */
export function ceilingOf(sub: PlaybookSubscription): number | undefined {
  return sub.capitalAllocated !== undefined && sub.capitalAllocated > 0
    ? sub.capitalAllocated
    : undefined;
}

/**
 * One play's book, off the portfolio. Long shares and long contracts count as deployed; a sold
 * put's collateral counts as deployed too (it is the play's commitment, #5483 amendment 6), at the
 * cash it sets aside. Shares are marked at `quotes`' last, falling back to the broker's own value.
 */
export function playBookOf(
  portfolio: Portfolio,
  quotes: Readonly<Record<string, Quote>>,
  symbols: readonly string[],
  ceiling: number,
): PlayBook {
  let active = 0;
  let deployedCost = 0;
  for (const symbol of symbols) {
    const held = positionFor(portfolio, symbol);
    if (held && held.quantity > 0) {
      active += positionValue(held, quotes[symbol]?.last);
      deployedCost += held.quantity * held.avgPrice;
    }
  }
  for (const position of portfolio.positions) {
    const parts = parseOccSymbol(position.symbol);
    if (parts && position.quantity > 0 && symbols.includes(parts.underlying)) {
      active += positionValue(position, undefined);
      deployedCost += position.quantity * position.avgPrice * contractMultiplier(position.symbol);
    }
  }
  const collateral = bookNeeds(portfolio).cashByUnderlying;
  for (const symbol of symbols) {
    const cash = collateral.get(symbol) ?? 0;
    active += cash;
    deployedCost += cash;
  }
  return { ceiling, active, deployedCost };
}

/** The whole reading: the play's book off the portfolio, against its resolved target. */
export function readPlay(
  target: ResolvedPlayTarget,
  portfolio: Portfolio,
  quotes: Readonly<Record<string, Quote>>,
  symbols: readonly string[],
  ceiling: number,
): PlayReading {
  return readPlayTarget(target, playBookOf(portfolio, quotes, symbols, ceiling));
}
