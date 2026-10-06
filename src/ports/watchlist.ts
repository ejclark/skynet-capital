import type { WatchedSymbol } from "../trading/watchlist.js";

/**
 * The boundary between the watchlist surface and wherever a member's chosen names are kept.
 *
 * A watchlist is member-AUTHORED truth: unlike the alerts beside it, or the milestones on
 * `/learn/trading`, nothing in this app can re-derive it from a ledger — if the file is lost the
 * list is simply gone, and an absent store reads exactly like an empty one (the failure mode
 * `tests/arch/volume-persistence.spec.ts` exists for). So there is exactly one adapter —
 * `jsonl-watchlist-store.ts`, on the volume — and no in-memory fallback a deployment could
 * silently sit on; a spec that needs one supplies its own fake.
 *
 * Keyed by MEMBER, not by account. The list is what a person is watching, not what one of their
 * desks holds — `watchlist-route.ts` resolves that id from the session and nowhere else, so there
 * is no parameter for a caller to point at somebody else's list.
 */
export interface WatchlistPort {
  /** The names this member is watching, in the order they built the list. */
  load(memberId: string): Promise<readonly WatchedSymbol[]>;
  /** Record one add. Must be idempotent — re-adding is a no-op, never an error. */
  add(memberId: string, symbol: string): Promise<void>;
  /** Record one remove. Must be idempotent — removing an unwatched name changes nothing. */
  remove(memberId: string, symbol: string): Promise<void>;
}
