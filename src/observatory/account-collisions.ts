/**
 * Detects two participants silently pointed at the **same underlying Alpaca account** —
 * the failure mode `bot-registry.ts`'s single-seat guard protects against for the shared
 * fallback pair, generalized to catch it happening BY ACCIDENT with two supposedly-distinct
 * credential pairs.
 *
 * Real incident this exists for (2026-08-11): a regenerated Alpaca key for one bot got pasted
 * into the wrong GitHub secret slot, meaning to belong to a different bot. Nothing caught it —
 * an invalid key fails loudly ("Account unreachable"), but a key that's merely *pointed at the
 * wrong account* looks completely healthy: it authenticates fine, just to someone else's book.
 * Two participants would then silently share one Alpaca account — positions merge, P/L becomes
 * unattributable, and each sizes orders against cash the other is spending. Exactly the outcome
 * `bot-registry.ts` already refuses for the shared-seat case; this closes the gap for the
 * "two separate-looking pairs turn out to be the same pair" case, which that guard cannot see.
 */

/** Anything with an id and (when readable) the Alpaca account id it resolved to. */
export interface AccountHolder {
  readonly id: string;
  readonly accountId?: string;
}

export interface AccountCollision {
  readonly accountId: string;
  /** Two or more participant/persona ids that all resolved to this one Alpaca account. */
  readonly ids: readonly string[];
}

/**
 * Groups holders by `accountId` and returns every group with more than one member. Holders with
 * no `accountId` (a failed read, or an account never actually queried) are silently excluded —
 * this detects a **confirmed** collision, not an absence of information.
 */
export function findAccountCollisions(holders: readonly AccountHolder[]): AccountCollision[] {
  const byAccount = new Map<string, string[]>();
  for (const holder of holders) {
    if (!holder.accountId) continue;
    const ids = byAccount.get(holder.accountId) ?? [];
    ids.push(holder.id);
    byAccount.set(holder.accountId, ids);
  }
  return [...byAccount.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([accountId, ids]) => ({ accountId, ids }));
}
