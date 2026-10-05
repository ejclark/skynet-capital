import type { CoverNeeds } from "../domain/option-book.js";
import type { OrderIntent, PlaybookSubscription } from "../domain/types.js";

/**
 * What one batch of intents has already claimed, so the next intent in the SAME batch cannot claim
 * it again. Guards size every intent against the cycle's starting book; without this, a sold put and
 * a share buy in one cycle could both spend the same cash, and two share buys could jointly eat a
 * put's collateral.
 *
 * Active only when the batch carries an option order or the book already holds a short (cash or
 * shares promised). Inactive, every read is 0 and every write is skipped — a share-only cycle with
 * no option positions sizes exactly as it always has.
 */
export interface GuardLedger {
  readonly active: boolean;
  /** Dollars claimed: share buys' cost, collateral for sold puts, debits paid. */
  cash: number;
  /** Shares claimed per underlying: share sells, and shares held back to cover a sold call. */
  readonly shares: Map<string, number>;
  /** Option risk claimed per playbook, against its Store allocation. */
  readonly byPlaybook: Map<string, number>;
}

export function openLedger(intents: readonly OrderIntent[], book: CoverNeeds): GuardLedger {
  const promisesShares = [...book.sharesByUnderlying.values()].some((n) => n > 0);
  return {
    active: intents.some((i) => i.option !== undefined) || book.cash > 0 || promisesShares,
    cash: 0,
    shares: new Map(),
    byPlaybook: new Map(),
  };
}

export function ledgerCash(ledger: GuardLedger): number {
  return ledger.active ? ledger.cash : 0;
}

export function ledgerShares(ledger: GuardLedger, underlying: string): number {
  return ledger.active ? (ledger.shares.get(underlying) ?? 0) : 0;
}

/** Record what an approved intent claimed. A no-op on an inactive ledger. */
export function claim(
  ledger: GuardLedger,
  claimed: {
    readonly cash?: number;
    readonly underlying?: string;
    readonly shares?: number;
    readonly playbookId?: string;
    readonly risk?: number;
  },
): void {
  if (!ledger.active) return;
  ledger.cash += Math.max(0, claimed.cash ?? 0);
  if (claimed.underlying !== undefined && (claimed.shares ?? 0) > 0) {
    const prior = ledger.shares.get(claimed.underlying) ?? 0;
    ledger.shares.set(claimed.underlying, prior + (claimed.shares ?? 0));
  }
  if (claimed.playbookId !== undefined && (claimed.risk ?? 0) > 0) {
    const prior = ledger.byPlaybook.get(claimed.playbookId) ?? 0;
    ledger.byPlaybook.set(claimed.playbookId, prior + (claimed.risk ?? 0));
  }
}

/** The enabled subscription an intent's playbook trades under, if any. */
export function subscriptionFor(
  intent: OrderIntent,
  subscriptions: readonly PlaybookSubscription[] | undefined,
): PlaybookSubscription | undefined {
  return intent.playbookId
    ? subscriptions?.find((s) => s.playbookId === intent.playbookId && s.enabled)
    : undefined;
}
