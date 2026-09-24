import type { DecisionRecord } from "../autonomous/decision-record.js";
import type { OrderIntent } from "../domain/types.js";
import type { TradeActivityRecord } from "../observatory/activity-record.js";

export interface AccountDecisionsDeps {
  readonly readDecisions?: (participantId: string) => Promise<readonly DecisionRecord[]>;
  readonly readTradeActivity?: (participantId: string) => Promise<readonly TradeActivityRecord[]>;
  readonly findByOrderId?: (
    orderId: string,
  ) => { readonly record: DecisionRecord; readonly intent: OrderIntent } | undefined;
}

/**
 * An account's full decision history, pooled across every persona that actually trades on it —
 * not just the persona whose id happens to match the account (`readDecisions`'s own scoping,
 * `dashboard-server-config.ts`: "Keyed by participant id, which for a bot equals its persona id").
 *
 * A fallback mechanism like beta-scout submits its picks on ANOTHER persona's broker while keeping
 * its own decision history under its own persona id (`decision-replication-client.ts`'s module
 * doc, and `beta-scout.ts`'s `BETA_SCOUT_ID` tag, name the same split) — so a member looking at
 * that account's Decisions tab never saw beta-scout's reasoning at all, even though its trades
 * land right there on the account's own Activity feed (found live, 2026-09-24).
 *
 * Reuses `findByOrderId` — the exact, already-tested order-id join `wire-reasoning.ts` uses for
 * the single-row "why did that trade fire" case (PR 6), and that `playbook-performance.ts` proves
 * pools correctly across personas (PR 7d — its own test names sauron + beta-scout explicitly) —
 * rather than inventing a second cross-persona mechanism. For every order this account's own
 * activity ledger holds, the join names which persona actually decided it; any persona other than
 * the account's own gets its FULL decision history pulled in too, so its quiet/refused cycles
 * surface alongside its placed trades, not just the trades themselves.
 */
export async function readAccountDecisions(
  accountId: string,
  deps: AccountDecisionsDeps,
): Promise<readonly DecisionRecord[] | undefined> {
  const ownRecords = await deps.readDecisions?.(accountId);
  if (!ownRecords) return undefined;
  if (!(deps.findByOrderId && deps.readTradeActivity)) return ownRecords;

  const activity = await deps.readTradeActivity(accountId);
  const foreignPersonaIds = new Set<string>();
  for (const trade of activity) {
    const found = deps.findByOrderId(trade.orderId);
    if (found && found.record.personaId !== accountId) {
      foreignPersonaIds.add(found.record.personaId);
    }
  }
  if (foreignPersonaIds.size === 0) return ownRecords;

  const foreignSets = await Promise.all(
    [...foreignPersonaIds].map(
      (personaId) => deps.readDecisions?.(personaId) ?? Promise.resolve([]),
    ),
  );
  return [...ownRecords, ...foreignSets.flat()];
}
