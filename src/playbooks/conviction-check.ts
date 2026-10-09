import { type OptionBook, optionBook } from "../domain/option-book.js";
import type { PlaybookSubscription, Portfolio, Quote } from "../domain/types.js";
import { OPTION_MULTIPLIER } from "../trading/option-symbols.js";
import { findPair, type Pair, pairName } from "./pair-table.js";
import { wheelStrategyTag } from "./wheel.js";

/**
 * THE CONVICTION CHECK (#4469 criteria 11 and 12, slice 3c part 2) — what the bots do with an
 * owner's dated conviction on a pair the house never marked ✓.
 *
 * Eric's CRWV call (#4642: "CRWV runs as Eric's conviction, against the study's stand-aside") is the
 * template: the owner may run a pair the study did not clear, on a stated reason and a date the
 * book is read on. This file is the reading, PURE over a ledger the caller supplies, so the same
 * numbers decide on the live bots and in a spec.
 *
 *  - NOT STATED (criterion 11). A non-✓ pair whose subscription has no conviction keeps trading and
 *    says so ("conviction not stated"). Never a stop: the owner's pair was running before this
 *    existed, and a rule that silently dropped a live subscription is the harm to avoid.
 *  - CHECKED (criterion 12). On the check day the pair's net P/L is read — realized P/L, plus the
 *    shares an assignment delivered marked at the last price against what they cost (the ledger
 *    scores no share leg, `decision-option-trips.ts`), plus open contracts marked at the broker's
 *    mark — and its strategy's own retire test (the wheel: more than 1 in 3 sold puts finished in
 *    the money). Failing either stops NEW entries (`conviction-gate.ts`); exits never stop.
 */

export const CONVICTION_NOT_STATED = "conviction not stated";

/** What the decision store knows about one pair's history, for one persona. */
export interface PairLedger {
  /** Realized P/L across the pair's closed round trips (`realizedPlForPlaybook`). */
  readonly realizedPl: number;
  /** Sold puts the expiry or assignment reports have ended, and how many of those were assigned.
   *  Meaningful only for a strategy that sells puts. */
  readonly putsClosed: number;
  readonly putsAssigned: number;
}

/** A pair the house did not mark ✓, whose owner has stated no conviction. Authored plays and ids
 *  the pair table does not know are not pairs, so they are never labelled. */
export function isConvictionNotStated(sub: PlaybookSubscription): boolean {
  if (!sub.enabled || sub.conviction) return false;
  const pair = findPair(sub.playbookId);
  return pair !== undefined && pair.evidence.status !== "researched";
}

/** The tag a pair's sold puts carry on the decision record, or `undefined` for a strategy with no
 *  put-based retire test. */
export function putStrategyTag(pair: Pair): string | undefined {
  const [symbol] = pair.symbols;
  return pair.strategy === "wheel" && symbol ? wheelStrategyTag(symbol, "put") : undefined;
}

const dollars = (x: number): string => `${x < 0 ? "-" : ""}$${Math.abs(x).toFixed(2)}`;

/** Unrealized P/L on one ticker's book: shares against what they cost, contracts against the
 *  premium taken or paid. A mark that is missing is cost, so it adds nothing. */
function unrealized(book: OptionBook, last: number | undefined): number {
  const shares =
    book.shares > 0 && book.shareCost !== undefined && last !== undefined && last > 0
      ? book.shares * (last - book.shareCost)
      : 0;
  const contracts = book.contracts.reduce((sum, c) => {
    const size = Math.abs(c.quantity) * OPTION_MULTIPLIER;
    const premium = c.avgPrice * size;
    // Alpaca marks a short contract negative; the cost to close is its size either way.
    const mark = c.marketValue === undefined ? premium : Math.abs(c.marketValue);
    return sum + (c.quantity < 0 ? premium - mark : mark - premium);
  }, 0);
  return shares + contracts;
}

/** The pair's net P/L now: its ledger plus what its open positions are worth against their cost. */
export function netPl(
  pair: Pair,
  ledger: PairLedger,
  portfolio: Portfolio,
  quotes: Readonly<Record<string, Quote>>,
): number {
  const open = pair.symbols.reduce(
    (sum, symbol) => sum + unrealized(optionBook(portfolio, symbol), quotes[symbol]?.last),
    0,
  );
  return Math.round((ledger.realizedPl + open) * 100) / 100;
}

export type ConvictionVerdict =
  | { readonly pass: true; readonly netPl: number }
  | { readonly pass: false; readonly netPl: number; readonly reason: string };

/** Read one pair's check: net P/L at or above $0, and the strategy's retire test not failed. */
export function checkConviction(
  pair: Pair,
  checkOn: string,
  ledger: PairLedger,
  net: number,
): ConvictionVerdict {
  const name = pairName(pair);
  if (net < 0) {
    return {
      pass: false,
      netPl: net,
      reason: `${name}: net P/L is ${dollars(net)} at its ${checkOn} check`,
    };
  }
  // The wheel's retire test: more than 1 in 3 sold puts finished in the money.
  if (putStrategyTag(pair) !== undefined && ledger.putsAssigned * 3 > ledger.putsClosed) {
    return {
      pass: false,
      netPl: net,
      reason: `${name}: ${ledger.putsAssigned} of ${ledger.putsClosed} sold puts finished in the money at its ${checkOn} check, more than 1 in 3`,
    };
  }
  return { pass: true, netPl: net };
}
