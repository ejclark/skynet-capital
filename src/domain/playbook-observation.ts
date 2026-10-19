/**
 * What an observe-only playbook records instead of an order (#5489). These types are deliberately
 * NOT an `OrderIntent`: no `quantity`, no order `type`, no `playbookId` stamp the trader could
 * submit. A would-be order is a sentence about the tape, kept so thirty observed days can be scored
 * later; nothing in this file or in the code that builds it reaches a broker.
 */

/** The late-recovery rule's level: a signal stops new buys in a name, a gate stops them everywhere
 *  (and a held tranche keeps its target sell working at either). */
export type RecoveryLevel = "none" | "signal" | "gate";

const RANK: Readonly<Record<RecoveryLevel, number>> = { none: 0, signal: 1, gate: 2 };

/** The higher of two levels — the worst a tranche has been. */
export const worseLevel = (a: RecoveryLevel, b: RecoveryLevel): RecoveryLevel =>
  RANK[a] >= RANK[b] ? a : b;

/** An order the rule would place. Not an `OrderIntent`: it cannot reach a broker. */
export interface WouldBeOrder {
  readonly side: "buy" | "sell";
  readonly shares: number;
  /** `market` for a buy at the signal bar's close; `resting` for a tranche's sell at its target. */
  readonly kind: "market" | "resting";
  readonly price: number;
  readonly why: string;
}

/** The quote the pass saw when it first saw a signal — the spread the study had to assume. */
export interface SignalQuote {
  readonly bid: number;
  readonly ask: number;
  readonly last: number;
  /** Epoch ms of the pass that read it. The signal is the bar's CLOSE, so `seenAt` minus that close
   *  is how late the read was; a scorer may drop late ones. */
  readonly seenAt: number;
}

/** One dip signal the rule saw: a would-be buy and its would-be exit, then how it ended. */
export interface SignalObservation {
  readonly kind: "signal";
  readonly playbookId: string;
  readonly symbol: string;
  /** The signal bar: its ET session and START minutes. The signal is its close. */
  readonly session: string;
  readonly minutes: number;
  /** `buy`: the rule admitted it. `refused`: the late-recovery rule stopped it (`refusedWhy`). */
  readonly outcome: "buy" | "refused";
  readonly refusedWhy?: string;
  /** Session VWAP and the name's own 5-minute range unit at the signal bar. */
  readonly vwap: number;
  readonly range: number;
  /** The buy it would place: a market order at the signal bar's close. */
  readonly entry: WouldBeOrder;
  /** The exit it would rest: a sell at the target, kept working at every level, never gated.
   *  Absent on a refused signal (no tranche was bought). */
  readonly exit?: WouldBeOrder;
  /** The late-recovery level and age (in sessions) as of the newest bar read, and the worst so far. */
  readonly level: RecoveryLevel;
  readonly worstLevel: RecoveryLevel;
  readonly age: number;
  /** Set once a later bar traded through the target (or opened above it). */
  readonly sold?: { readonly session: string; readonly minutes: number; readonly price: number };
  /** The live quote at first sight; absent when the signal was found on a bar already stale. */
  readonly quote?: SignalQuote;
}

/** One name's book on one session, as of the newest bar read: the per-playbook level, both ways. */
export interface DayObservation {
  readonly kind: "day";
  readonly playbookId: string;
  readonly symbol: string;
  readonly session: string;
  /** START minutes of the newest bar read that session. */
  readonly minutes: number;
  readonly level: RecoveryLevel;
  readonly reasons: readonly string[];
  /** Held tranches bought before today, as a share of the allocation. */
  readonly tiedUp: number;
  readonly held: number;
  readonly sold: number;
  readonly refused: number;
  /** What it would have working right now: every held tranche's sell, and a buy if the newest bar
   *  signalled. */
  readonly wouldBe: readonly WouldBeOrder[];
}

export type PlaybookObservation = SignalObservation | DayObservation;

/** Where in its session an observation lives: a signal at its bar, a day's reading in one slot
 *  (0) so each new bar overwrites the session's reading instead of adding a row. */
export const observationSlot = (o: PlaybookObservation): number =>
  o.kind === "day" ? 0 : o.minutes;

/** The identity an observation upserts on. */
export const observationKey = (o: PlaybookObservation): string =>
  `${o.playbookId}|${o.symbol}|${o.kind}|${o.session}|${observationSlot(o)}`;

/**
 * `next` written over `prev`: the outcome moves on, but a signal's first-sight quote stays the one
 * read at the signal and its worst level only ever rises. Pure.
 */
export function mergeObservation(
  prev: PlaybookObservation | undefined,
  next: PlaybookObservation,
): PlaybookObservation {
  if (prev?.kind !== "signal" || next.kind !== "signal") return next;
  const quote = prev.quote ?? next.quote;
  return {
    ...next,
    worstLevel: worseLevel(worseLevel(prev.worstLevel, next.worstLevel), next.level),
    ...(quote ? { quote } : {}),
  };
}
