import { isRecord } from "../storage/parse-guards.js";
import type { IntentOutcome } from "./decision-record.js";

/**
 * THE FORCED DAILY PICK'S OWN LOTS (review of #4642 slice 10). The scout used to track the NAMES it
 * owned, added before its buy was even submitted and sold whole at the next rollover. Three ways
 * that went wrong: a pick that was only observed (observe mode), blocked by a halt, or rejected by
 * the broker stayed "owned" for good; a disarmed scout then sold the account's WHOLE holding of that
 * name — another playbook's shares included — under the BETA-SCOUT label; and the rollover released
 * a lot before its sell was placed, so a halted first cycle stranded it (#4786).
 *
 * A lot is now fill-based and counted: it exists only once a scout buy was actually placed (filled,
 * or still working at the broker — a pick staged after the close fills at the open), carries the
 * shares that buy took, and is sold at the first session after its own, never for more than it
 * holds and never for more than the account holds. It is released only once its sell was placed.
 */
export interface ScoutLot {
  readonly symbol: string;
  /** Shares the scout's buy filled — or, while the broker has not confirmed a fill, ordered. */
  readonly quantity: number;
  /** The session day the buy was for; the lot is sold on the first session after it. */
  readonly day: string;
  /** The bot account (persona id) it was bought on, when known. */
  readonly host?: string;
}

/** Shares an outcome actually moved: a placed order the broker took, at what it filled, or at the
 *  whole order while it is still working (it may yet fill). Zero for anything not placed. */
function sharesMoved(outcome: IntentOutcome): number {
  const result = outcome.result;
  if (outcome.action !== "placed" || !result) return 0;
  if (result.status === "rejected" || result.status === "unfilled") return 0;
  if (result.status === "filled" && result.filledQuantity !== undefined) {
    return Math.max(0, result.filledQuantity);
  }
  return outcome.intent.quantity;
}

/** The lot a scout buy's outcome leaves, if any: only a buy the broker actually took. Never one
 *  from an observed, blocked, refused or rejected pick. */
export function lotFromOutcome(
  outcome: IntentOutcome,
  day: string,
  host?: string,
): ScoutLot | undefined {
  if (outcome.intent.side !== "buy") return undefined;
  const quantity = sharesMoved(outcome);
  if (!(quantity > 0)) return undefined;
  return { symbol: outcome.intent.symbol, quantity, day, ...(host ? { host } : {}) };
}

/**
 * The lots left after an exit's outcome: those of its symbol released once the sell was placed —
 * all of them when it sold everything it asked for (or is still working), or one lot of what it
 * did not sell when it partly filled. An exit not placed (observed, blocked, refused, rejected)
 * leaves every lot as it was, for the next try.
 */
export function afterExit(
  lots: readonly ScoutLot[],
  outcome: IntentOutcome,
  isDue: (lot: ScoutLot) => boolean,
): ScoutLot[] {
  const sold = sharesMoved(outcome);
  if (outcome.intent.side !== "sell" || !(sold > 0)) return [...lots];
  const mine = lots.filter((lot) => lot.symbol === outcome.intent.symbol && isDue(lot));
  const rest = lots.filter((lot) => !mine.includes(lot));
  const unsold = outcome.intent.quantity - sold;
  const first = mine[0];
  return unsold > 0 && first ? [...rest, { ...first, quantity: unsold }] : rest;
}

/** Shares the scout may sell per symbol: its due lots summed. */
export function lotShares(lots: readonly ScoutLot[]): Map<string, number> {
  const shares = new Map<string, number>();
  for (const lot of lots) shares.set(lot.symbol, (shares.get(lot.symbol) ?? 0) + lot.quantity);
  return shares;
}

/**
 * The persisted `owned_json`, read safely: today's lots, and the bare symbols a state saved before
 * lots carried a quantity still names. Those are never sold — how many shares were the scout's is
 * unknown, and the whole holding may be another playbook's — so the caller says so once and drops
 * them. Anything malformed is dropped too, never guessed.
 */
export function parseOwned(value: unknown): {
  readonly lots: ScoutLot[];
  readonly legacySymbols: string[];
} {
  const lots: ScoutLot[] = [];
  const legacySymbols: string[] = [];
  for (const entry of Array.isArray(value) ? value : []) {
    if (typeof entry === "string") {
      legacySymbols.push(entry);
      continue;
    }
    if (!isRecord(entry)) continue;
    const { symbol, quantity, day, host } = entry;
    if (typeof symbol !== "string" || typeof day !== "string") continue;
    if (typeof quantity !== "number" || !(quantity > 0)) continue;
    lots.push({ symbol, quantity, day, ...(typeof host === "string" ? { host } : {}) });
  }
  return { lots, legacySymbols };
}
