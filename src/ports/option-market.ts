import type { OptionMarket, OptionMarketRequest } from "../domain/types.js";

/**
 * Where a cycle's option quotes come from. The trader asks once per cycle with a PURE demand
 * function; the port reads the listed expirations, asks the demand which chains and contracts it
 * needs, and reads only those — so a cycle with nothing to price costs no network at all.
 */
export interface OptionMarketPort {
  /** Fail-soft: `undefined` or a partial market, never a throw. */
  readOptionMarket(request: OptionMarketRequest): Promise<OptionMarket | undefined>;
}

/**
 * The option orders a previous submit left `working` (the cancel was not confirmed). Settled at the
 * top of every live cycle, so a still-live order on an underlying blocks a second one there.
 */
export interface OptionOrderTracker {
  /** Re-reads every order a previous submit left `working`: forgets the settled, re-cancels the
   *  live, returns the underlyings still live. No network when nothing is pending. */
  settle(): Promise<ReadonlySet<string>>;
  /** Re-reads the SHARE orders a submit left `working` and reports each one the broker has ended
   *  (#4650). Read-only — never cancels — so it runs every cycle in any mode, halted included: a
   *  share order on this account may be the beta scout's, which trades live whatever mode this
   *  bot runs in. Never throws. No network when nothing is pending. */
  settleShares?(): Promise<void>;
}
