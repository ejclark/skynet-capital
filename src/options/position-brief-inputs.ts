import type { BriefInputs, BriefStake } from "./position-brief-types.js";

/**
 * INPUT HYGIENE for the Position Brief (#3729) — the two ways a well-formed request still produces a
 * false Brief, closed before any rule runs:
 *
 *   - A stake number that is not a real amount. `costBasis: 0` would print "Infinity% if called";
 *     a negative cash balance would size puts off a debt. Anything not finite and positive is
 *     treated as NOT GIVEN, which every rule already handles honestly.
 *   - A print window that has already closed. Left in, it keeps excluding expiries forever and lists
 *     "print window opens" as still pending. It is retired, and the Brief says so in its assumptions
 *     so the caller supplies the next print instead of the engine inventing one.
 *
 * PURE: no I/O, no clock (`today` is the caller's ET date).
 */

const positive = (x: number | undefined): x is number =>
  x !== undefined && Number.isFinite(x) && x > 0;

function cleanStake(stake: BriefStake): BriefStake {
  return {
    goal: stake.goal,
    ...(positive(stake.shares) ? { shares: Math.floor(stake.shares) } : {}),
    ...(positive(stake.costBasis) ? { costBasis: stake.costBasis } : {}),
    ...(positive(stake.cash) ? { cash: stake.cash } : {}),
    ...(positive(stake.happyToOwnAt) ? { happyToOwnAt: stake.happyToOwnAt } : {}),
    ...(positive(stake.portfolioValue) ? { portfolioValue: stake.portfolioValue } : {}),
  };
}

export interface NormalizedInputs {
  readonly input: BriefInputs;
  /** A print window that closed before today — reported, never silently dropped. */
  readonly retiredWindow?: string;
}

export function normalizeInputs(raw: BriefInputs, today: string): NormalizedInputs {
  const stake = cleanStake(raw.stake);
  const e = raw.earnings;
  if (e && e.end < today) {
    const { earnings: _past, ...rest } = raw;
    return { input: { ...rest, stake }, retiredWindow: `${e.start}–${e.end}` };
  }
  return { input: { ...raw, stake } };
}
