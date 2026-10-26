import { type OptionBook, optionBook } from "../domain/option-book.js";
import type { PlaybookSubscription, Portfolio, Quote } from "../domain/types.js";
import { OPTION_MULTIPLIER } from "../trading/option-symbols.js";
import { isConvictionOffView } from "./conviction-store.js";
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

/** A pair the house did not mark ✓, whose owner has stated no conviction — neither its own nor a
 *  record's that steers it (#5482 slice 2). A pointer is a stated view even where this build's store
 *  cannot read it (a member's, held by the bots' own lookup): its pair is not unstated, and one the
 *  bots cannot resolve runs exits-only and says so (`steeredBy`). A ◆ pair with no pointer trades
 *  only on a conviction and runs exits-only the same way (`subscriptionRoster`), so "still trading"
 *  would be false of it: the label is for the other non-✓ pairs (`isConvictionOffView`). Authored plays and ids the pair table does not
 *  know are not pairs, so they are never labelled. */
export function isConvictionNotStated(sub: PlaybookSubscription): boolean {
  if (!sub.enabled || sub.convictionId !== undefined || isConvictionOffView(sub)) return false;
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
 *  premium taken or paid. `undefined` when a held position has no mark to read — a missing mark is
 *  not a flat one, and a check latched on it would pass or fail on a gap in the feed. */
function unrealized(book: OptionBook, last: number | undefined): number | undefined {
  let shares = 0;
  if (book.shares > 0 && book.shareCost !== undefined) {
    if (last === undefined || !Number.isFinite(last) || last <= 0) return undefined;
    shares = book.shares * (last - book.shareCost);
  }
  let contracts = 0;
  for (const c of book.contracts) {
    if (c.marketValue === undefined || !Number.isFinite(c.marketValue)) return undefined;
    const size = Math.abs(c.quantity) * OPTION_MULTIPLIER;
    const premium = c.avgPrice * size;
    // Alpaca marks a short contract negative; the cost to close is its size either way.
    const mark = Math.abs(c.marketValue);
    contracts += c.quantity < 0 ? premium - mark : mark - premium;
  }
  return shares + contracts;
}

/** The pair's net P/L now: its ledger plus what its open positions are worth against their cost,
 *  or `undefined` while any of them cannot be marked. */
export function netPl(
  pair: Pair,
  ledger: PairLedger,
  portfolio: Portfolio,
  quotes: Readonly<Record<string, Quote>>,
): number | undefined {
  let open = 0;
  for (const symbol of pair.symbols) {
    const book = unrealized(optionBook(portfolio, symbol), quotes[symbol]?.last);
    if (book === undefined) return undefined;
    open += book;
  }
  return Math.round((ledger.realizedPl + open) * 100) / 100;
}

/** The wheel's retire test: more than 1 in 3 sold puts finished in the money. A strategy with no
 *  put-based test never fails it. In words when it fails, else undefined. */
function retireFailure(pair: Pair, checkOn: string, ledger: PairLedger): string | undefined {
  if (putStrategyTag(pair) === undefined || ledger.putsAssigned * 3 <= ledger.putsClosed) {
    return undefined;
  }
  return `${pairName(pair)}: ${ledger.putsAssigned} of ${ledger.putsClosed} sold puts finished in the money at its ${checkOn} check, more than 1 in 3`;
}

/** One steered pair's reading for a record's check: its history and its net P/L now. */
export interface SteeredReading {
  readonly pair: Pair;
  readonly ledger: PairLedger;
  readonly net: number;
}

/** A record's verdict (#5482 criterion 5): whether the view held, and which pairs stop new entries. */
export interface RecordVerdict {
  /** False when the pairs' net P/L together is below $0. */
  readonly pass: boolean;
  /** The steered pairs' net P/L added together — the number the view is judged on. */
  readonly netPl: number;
  /** The pair ids that take no new entries. Empty when the view held and no pair retired. */
  readonly stopped: readonly string[];
  /** In words, why; empty when nothing stopped. */
  readonly reason: string;
}

/**
 * Read a conviction record's check (#5482 criterion 5), over every pair it steers on this bot.
 * The view is judged on the pairs together, never trade by trade (the call sheet's stance): the
 * sum of their net P/L below $0 fails the view and stops new entries on EVERY pair it steers, so
 * a gain on one pair holds a loss on another, and a loss on all of them stops all of them. A
 * strategy's own retire test (the wheel's 1 in 3 puts in the money) is a fact about that strategy,
 * not about the view: it stops its own pair even when the view held — unless the record's owner
 * accepts assignment, when the money is the only test. Exits never stop — the gate
 * only drops opens (`with-conviction-gate.ts`).
 */
export function checkRecord(
  checkOn: string,
  readings: readonly SteeredReading[],
  { acceptsAssignment = false }: { readonly acceptsAssignment?: boolean } = {},
): RecordVerdict {
  const netPl = Math.round(readings.reduce((sum, r) => sum + r.net, 0) * 100) / 100;
  if (netPl < 0) {
    const names = readings.map((r) => pairName(r.pair)).join(" + ");
    const together = readings.length > 1 ? " together" : "";
    return {
      pass: false,
      netPl,
      stopped: readings.map((r) => r.pair.id),
      reason: `${names}: net P/L is ${dollars(netPl)}${together} at the ${checkOn} check`,
    };
  }
  // An owner who accepts assignment is judged on the money alone (`Conviction.acceptsAssignment`).
  const retired = readings.flatMap((r) => {
    const why = acceptsAssignment ? undefined : retireFailure(r.pair, checkOn, r.ledger);
    return why ? [{ id: r.pair.id, why }] : [];
  });
  return {
    pass: true,
    netPl,
    stopped: retired.map((r) => r.id),
    reason: retired.map((r) => r.why).join("; "),
  };
}
