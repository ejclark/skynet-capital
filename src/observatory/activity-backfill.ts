import type { AlpacaAccountActivity } from "../alpaca/alpaca-options-client.js";
import type { AlpacaOrder } from "../alpaca/alpaca-trading-client.js";
import { parseLifecycleActivity } from "../trading/option-lifecycle.js";
import {
  type ActivityStore,
  advancesLedger,
  collapseActivity,
  recordFromOrder,
  recordsFromActivity,
  type TradeActivityRecord,
} from "./activity-store.js";
import { lifecycleLedgerRecord } from "./option-lifecycle-activity.js";
import type { ActivityView } from "./participant-snapshot.js";

/**
 * CAPTURE FROM THE BROKER'S OWN RECORD — the two paths that fill the activity ledger from reads
 * rather than the live stream:
 *
 *  - `reconcileBrokerActivity` — every boot banks the broker's recent-order window, so orders that
 *    landed while the dashboard was down still make it into the ledger before they scroll away.
 *  - `backfillParticipantActivity` — the one-time (re-runnable) retroactive sweep: pages the
 *    broker's full order history back to the account's first order and journals everything the
 *    ledger doesn't already hold. This is the recovery path `history-boot.ts` documented as a
 *    non-goal for equity history — the per-order record makes it possible here.
 *
 * Both are idempotent by the same predicate (`advancesLedger`): re-running appends nothing new,
 * which is what makes "run it once, safely" an honest promise.
 */

/** Append `rows` that advance the ledger, deduping against the store and within the call. */
async function appendAdvancing(
  store: ActivityStore,
  rows: readonly TradeActivityRecord[],
  known: Map<string, TradeActivityRecord>,
): Promise<number> {
  let appended = 0;
  for (const row of rows) {
    if (!advancesLedger(known.get(row.orderId), row)) continue;
    await store.record(row);
    known.set(row.orderId, row);
    appended += 1;
  }
  return appended;
}

async function knownOrders(
  store: ActivityStore,
  participantId: string,
): Promise<Map<string, TradeActivityRecord>> {
  return new Map(collapseActivity(await store.list(participantId)).map((r) => [r.orderId, r]));
}

/**
 * Fold a boot snapshot's broker-window rows into the ledger — the restart-gap net. Returns how
 * many lines were written, for the boot log.
 */
export async function reconcileBrokerActivity(
  store: ActivityStore,
  participants: ReadonlyArray<{ readonly id: string; readonly activity?: readonly ActivityView[] }>,
): Promise<number> {
  let appended = 0;
  for (const participant of participants) {
    const rows = recordsFromActivity(participant.activity, participant.id);
    if (rows.length === 0) continue;
    appended += await appendAdvancing(store, rows, await knownOrders(store, participant.id));
  }
  return appended;
}

export interface BackfillResult {
  readonly participantId: string;
  /** Orders the broker returned across all pages. */
  readonly fetched: number;
  /** Ledger lines actually appended (the rest were already held or unjournalable). */
  readonly appended: number;
  readonly pages: number;
}

/** A page cap so a paging bug can never hammer the broker forever: 40 × 500 = 20k orders. */
const MAX_PAGES = 40;
const PAGE_SIZE = 500;

/**
 * Page one participant's full order history (newest first, `until` as the cursor) into the
 * ledger. The client is injected as a single function so the walk is specced with a fake — no
 * transport, no network.
 */
export async function backfillParticipantActivity(opts: {
  readonly participantId: string;
  readonly store: ActivityStore;
  readonly listOrders: (params: { limit: number; until?: string }) => Promise<AlpacaOrder[]>;
  readonly pageSize?: number;
}): Promise<BackfillResult> {
  const pageSize = opts.pageSize ?? PAGE_SIZE;
  const known = await knownOrders(opts.store, opts.participantId);
  let fetched = 0;
  let appended = 0;
  let pages = 0;
  let until: string | undefined;

  while (pages < MAX_PAGES) {
    const orders = await opts.listOrders({ limit: pageSize, ...(until ? { until } : {}) });
    if (orders.length === 0) break;
    pages += 1;
    fetched += orders.length;

    const rows: TradeActivityRecord[] = [];
    for (const order of orders) {
      const row = recordFromOrder(order, opts.participantId, "backfill");
      if (row) rows.push(row);
    }
    appended += await appendAdvancing(opts.store, rows, known);

    // `until` is exclusive on submission time, so the oldest row seen is the next page's cursor.
    const oldest = orders[orders.length - 1]?.submitted_at;
    if (orders.length < pageSize || !oldest || oldest === until) break;
    until = oldest;
  }

  return { participantId: opts.participantId, fetched, appended, pages };
}

/** A page cap for the lifecycle sweep too — same defensive reasoning as `MAX_PAGES` above.
 *  Exported so the read-only shape capture (`src/scripts/capture-option-lifecycle.ts`) walks the
 *  same activity feed under the same bounds instead of keeping a second copy of them. */
export const LIFECYCLE_MAX_PAGES = 40;
/** Matches `AlpacaOptionsClient.getOptionLifecycleActivities`'s own `page_size` — a page shorter
 *  than this is the broker saying "that's everything", same signal `backfillParticipantActivity`
 *  reads off `orders.length < pageSize` above. */
export const LIFECYCLE_PAGE_SIZE = 100;

/**
 * Page one participant's option lifecycle activities (`OPEXP`/`OPASN`/`OPEXC`/`OPTRD` — #468
 * criterion 6) into the same durable ledger `backfillParticipantActivity` fills from order
 * history. Idempotent by the same `advancesLedger` predicate: each activity's own id is namespaced
 * into its `orderId` (`lifecycleOrderId`), so re-running appends nothing already held.
 */
export async function backfillParticipantOptionLifecycle(opts: {
  readonly participantId: string;
  readonly store: ActivityStore;
  readonly listLifecycleActivities: (after?: string) => Promise<AlpacaAccountActivity[]>;
  readonly pageSize?: number;
}): Promise<BackfillResult> {
  const pageSize = opts.pageSize ?? LIFECYCLE_PAGE_SIZE;
  const known = await knownOrders(opts.store, opts.participantId);
  let fetched = 0;
  let appended = 0;
  let pages = 0;
  let after: string | undefined;

  while (pages < LIFECYCLE_MAX_PAGES) {
    const raw = await opts.listLifecycleActivities(after);
    if (raw.length === 0) break;
    pages += 1;
    fetched += raw.length;

    const rows: TradeActivityRecord[] = [];
    for (const activity of raw) {
      const parsed = parseLifecycleActivity(activity);
      if (parsed) rows.push(lifecycleLedgerRecord(parsed, opts.participantId));
    }
    appended += await appendAdvancing(opts.store, rows, known);

    const oldest = raw[raw.length - 1]?.id;
    if (raw.length < pageSize || !oldest || oldest === after) break;
    after = oldest;
  }

  return { participantId: opts.participantId, fetched, appended, pages };
}
