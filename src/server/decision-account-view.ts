import type { DecisionRecord } from "../autonomous/decision-record.js";
import type { OrderIntent } from "../domain/types.js";
import { maxOf, minOf } from "../math/num.js";
import type { TradeActivityRecord } from "../observatory/activity-record.js";

/** A keyset page of one persona's decisions: strictly older than `before`, newest first, at most
 *  `limit`. Omitted means the store's own default page — the newest few. */
export interface DecisionPage {
  readonly before?: number;
  readonly limit?: number;
}

export interface AccountDecisionsDeps {
  readonly readDecisions?: (
    participantId: string,
    page?: DecisionPage,
  ) => Promise<readonly DecisionRecord[]>;
  readonly readTradeActivity?: (participantId: string) => Promise<readonly TradeActivityRecord[]>;
  readonly findByOrderId?: (
    orderId: string,
  ) => { readonly record: DecisionRecord; readonly intent: OrderIntent } | undefined;
  /** Preferred over `findByOrderId` when wired: persona ids for a batch of orders without
   *  assembling a decision record per order. */
  readonly personasOfOrders?: (orderIds: readonly string[]) => readonly string[];
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
  const foreign = await foreignPersonas(accountId, deps);
  if (foreign.length === 0) return ownRecords;
  const foreignSets = await Promise.all(
    foreign.map((personaId) => deps.readDecisions?.(personaId) ?? Promise.resolve([])),
  );
  return [...ownRecords, ...foreignSets.flat()];
}

/** Every OTHER persona whose orders land on this account's ledger, found by the order-id join.
 *  Looked up once per unique order id, not once per ledger line — a partial fill posts several
 *  activity rows for the same order, and `findByOrderId` is a synchronous SQLite call (#4612
 *  slice 7, defect #9: "~10x faster" over unique ids on a 70-day ledger). */
async function foreignPersonas(accountId: string, deps: AccountDecisionsDeps): Promise<string[]> {
  if (!((deps.personasOfOrders || deps.findByOrderId) && deps.readTradeActivity)) return [];
  const orderIds = [...new Set((await deps.readTradeActivity(accountId)).map((t) => t.orderId))];
  if (deps.personasOfOrders)
    return deps.personasOfOrders(orderIds).filter((id) => id !== accountId);
  const found = new Set<string>();
  for (const orderId of orderIds) {
    const personaId = deps.findByOrderId?.(orderId)?.record.personaId;
    if (personaId && personaId !== accountId) found.add(personaId);
  }
  return [...found];
}

export interface AccountDecisionsPage {
  readonly records: readonly DecisionRecord[];
  /** Set when some persona's page came back full: nothing older than this was read for it, so
   *  the page ends here and the next one resumes strictly before it. */
  readonly horizon?: number;
}

/**
 * One page of the account's pooled decisions, walked back through the WHOLE history rather than
 * the store's newest default page (found 2026-09-24: "Load older" only ever paged within Sauron's
 * newest 30 passes, about 7.5 minutes). Each persona is its own time-ordered stream; when any
 * stream fills its page, everything older than that stream's oldest record is held back for the
 * next page, so no pass is skipped or shown twice.
 */
export async function readAccountDecisionsPage(
  accountId: string,
  deps: AccountDecisionsDeps,
  page: { readonly before?: number; readonly limit: number },
): Promise<AccountDecisionsPage | undefined> {
  const read = deps.readDecisions;
  if (!read) return undefined;
  const personas = [accountId, ...(await foreignPersonas(accountId, deps))];
  const before = page.before ?? Number.POSITIVE_INFINITY;
  // The `before` filter repeats the store's own, for a legacy reader that ignores the page.
  const streams = (await Promise.all(personas.map((id) => read(id, page)))).map((s) =>
    s.filter((r) => r.at < before),
  );
  const full = streams.filter((s) => s.length >= page.limit);
  // A legacy reader returns a persona's WHOLE audit trail, so a stream is unbounded: fold it, never
  // spread it into Math.min (RangeError past ~121k cycles, #4615). Personas are few; either works.
  const horizon = full.length > 0 ? maxOf(full.map((s) => minOf(s.map((r) => r.at)))) : undefined;
  const records = streams.flat().filter((r) => horizon === undefined || r.at >= horizon);
  return { records, ...(horizon !== undefined ? { horizon } : {}) };
}
