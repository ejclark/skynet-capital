import type { GuidanceGoal, GuidanceStake, HeldLongOption } from "./position-guidance-types.js";

/**
 * PARSING A STAKE FROM UNTRUSTED INPUT — shared by the browser (localStorage, `app/src/live/
 * guidance.ts`) and the server (a saved position's POST body, `src/server/saved-positions-store.ts`),
 * moved here (#3968) so the two never drift into two different ideas of "a valid stake". Every
 * field is independently whitelisted; nothing here throws — an absent or malformed field is simply
 * dropped, never a 400 for the whole object (the caller decides whether a stake with nothing usable
 * in it is itself an error).
 *
 * `openCalls` is never parsed here: it always comes from a member's own linked account (`heldStake`
 * in `app/src/live/guidance.ts`), never from typed-in or stored input.
 */

const GOALS: readonly GuidanceGoal[] = ["income", "keep-shares", "exit"];
const OPTION_TYPES = ["call", "put"] as const;

const positive = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) && v > 0 ? v : undefined;

const isoDate = (v: unknown): string | undefined =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined;

/** A held long call/put — all five required fields present and positive, or the whole leg is
 *  dropped: a half-specified option (a strike with no expiration) is not a position. */
function cleanLongOption(raw: unknown): HeldLongOption | undefined {
  const r = (raw ?? {}) as Record<string, unknown>;
  const type = OPTION_TYPES.find((t) => t === r.type);
  const strike = positive(r.strike);
  const expiration = isoDate(r.expiration);
  const contracts = positive(r.contracts);
  const costPerContract = positive(r.costPerContract);
  if (
    !(
      type &&
      strike !== undefined &&
      expiration &&
      contracts !== undefined &&
      costPerContract !== undefined
    )
  )
    return undefined;
  const bid = positive(r.bid);
  const ask = positive(r.ask);
  return {
    type,
    strike,
    expiration,
    contracts: Math.floor(contracts),
    costPerContract,
    ...(bid !== undefined ? { bid } : {}),
    ...(ask !== undefined ? { ask } : {}),
  };
}

/** Only the fields the engine reads, each independently whitelisted — untrusted input in, a stake
 *  the engine can safely consume out. */
export function cleanStake(raw: unknown): GuidanceStake {
  const r = (raw ?? {}) as Record<string, unknown>;
  const shares = positive(r.shares);
  const costBasis = positive(r.costBasis);
  const cash = positive(r.cash);
  const happyToOwnAt = positive(r.happyToOwnAt);
  const callsSold = positive(r.callsSold);
  const premiumsCollected = positive(r.premiumsCollected);
  const goal = GOALS.find((g) => g === r.goal);
  const longOption = cleanLongOption(r.longOption);
  return {
    ...(shares !== undefined ? { shares: Math.floor(shares) } : {}),
    ...(costBasis !== undefined ? { costBasis } : {}),
    ...(cash !== undefined ? { cash } : {}),
    ...(happyToOwnAt !== undefined ? { happyToOwnAt } : {}),
    ...(callsSold !== undefined ? { callsSold: Math.floor(callsSold) } : {}),
    ...(premiumsCollected !== undefined ? { premiumsCollected } : {}),
    ...(goal ? { goal } : {}),
    ...(longOption ? { longOption } : {}),
  };
}
