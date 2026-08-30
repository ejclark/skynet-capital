import { join } from "node:path";
import type { AlpacaOrder } from "../alpaca/alpaca-trading-client.js";
import { JsonlKeyedStore } from "../storage/jsonl-store.js";
import type { ActivitySource, ActivityStore, TradeActivityRecord } from "./activity-record.js";
import { InMemoryActivityStore } from "./in-memory-activity-store.js";
import type { ActivityView } from "./participant-snapshot.js";

export type { ActivitySource, ActivityStore, TradeActivityRecord };

/**
 * THE DURABLE TRADE-ACTIVITY LEDGER — every order the desk or a bot ever placed, kept for good.
 *
 * Why this exists: the desk's history tab used to reconstruct trades from the broker's recent-order
 * window (the last ~15 orders). The moment Sauron started trading autonomously, real history began
 * scrolling out of that window forever — `history-boot.ts` even documented the missing per-order
 * ledger as an accepted gap. This store closes it: an append-only JSONL journal per participant
 * (the same pattern as `JsonlHistoryStore` / `JsonlAuditStore`), fed live from each account's
 * `trade_updates` stream and retroactively by `scripts/backfill-trade-activity.ts`.
 *
 * The journal is append-only, so one order may appear on several lines as it progresses
 * (new → partially_filled → filled). Readers call `collapseActivity` to fold the journal into the
 * latest known state per order — writes stay cheap and crash-safe, and the fold is pure and specced.
 *
 * Provenance is recorded, not laundered: `source` says how each line got here (`stream` = captured
 * live, `backfill` = read from the broker's order history after the fact, `broker` = the recent-order
 * window read). The view badges backfilled rows so the record never implies we watched a trade land
 * when we actually recovered it later.
 */

/** In-memory store: the reference implementation, used by tests and offline runs. */
export { InMemoryActivityStore };

/** File-backed store: one append-only JSONL file per participant under `dir` (on the mounted
 *  volume in prod — set `SKYNET_ACTIVITY_DIR=/data/activity` — so the ledger survives redeploys). */
export class JsonlActivityStore implements ActivityStore {
  private readonly store: JsonlKeyedStore<TradeActivityRecord>;

  constructor(dir: string) {
    this.store = new JsonlKeyedStore<TradeActivityRecord>(dir, (participantId) =>
      join(dir, `${participantId.replace(/[^a-zA-Z0-9_-]/g, "_")}.jsonl`),
    );
  }

  async record(entry: TradeActivityRecord): Promise<void> {
    await this.store.append(entry.participantId, entry);
  }

  list(participantId?: string): Promise<TradeActivityRecord[]> {
    return this.store.list(participantId);
  }
}

/** Build the activity store from the environment (`SKYNET_ACTIVITY_DIR`, default `data/activity`). */
export function createActivityStore(env: NodeJS.ProcessEnv): ActivityStore {
  return new JsonlActivityStore(env.SKYNET_ACTIVITY_DIR ?? "data/activity");
}

/**
 * Offline runs get an in-memory store, for the same reason `createBootHistoryStore` does: the
 * fixture replay loops, and persisting each loop's identical fills would compound a fabricated
 * ledger across restarts.
 */
export function createBootActivityStore(env: NodeJS.ProcessEnv, mode: string): ActivityStore {
  return mode === "offline" ? new InMemoryActivityStore() : createActivityStore(env);
}

/**
 * Fold journal lines into the latest known state per order. "Latest" is the line with the most
 * progressed fill (highest `filledQuantity`); among equals, the later `at` wins, and the later
 * journal line breaks any remaining tie — so a backfill line never regresses a live-captured fill.
 * Lines are returned newest-first by `at`, the order every blotter wants.
 */
export function collapseActivity(records: readonly TradeActivityRecord[]): TradeActivityRecord[] {
  const byOrder = new Map<string, TradeActivityRecord>();
  for (const record of records) {
    const held = byOrder.get(record.orderId);
    if (
      !held ||
      record.filledQuantity > held.filledQuantity ||
      (record.filledQuantity === held.filledQuantity && record.at >= held.at)
    ) {
      byOrder.set(record.orderId, record);
    }
  }
  return [...byOrder.values()].sort((a, b) => b.at.localeCompare(a.at));
}

// --- windows & type filters -------------------------------------------------------------------

/** The history view's time windows. Bounded by design — an all-time ledger needs an "All". */
export type ActivityWindow = "7d" | "30d" | "90d" | "all";

/** The trade-type filter: an order is a buy or a sell; "all" shows both. */
export type ActivityTypeFilter = "all" | "buy" | "sell";

const ACTIVITY_WINDOWS: ReadonlyArray<{
  key: ActivityWindow;
  label: string;
  days?: number;
}> = [
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "90d", label: "90 days", days: 90 },
  // "All history", not "All": this chip sits beside the type filter's identical "All" — naming it
  // distinctly keeps the pair from reading as one ambiguous choice; each chip says what it selects.
  { key: "all", label: "All history" },
];

const ACTIVITY_TYPES: ReadonlyArray<{ key: ActivityTypeFilter; label: string }> = [
  { key: "all", label: "All types" },
  { key: "buy", label: "Buys" },
  { key: "sell", label: "Sells" },
];

/** Parse `?window=`, defaulting to 30 days — a bounded default keeps a long ledger glanceable. */
export function parseActivityWindow(raw: string | null | undefined): ActivityWindow {
  const match = ACTIVITY_WINDOWS.find((w) => w.key === raw);
  return match ? match.key : "30d";
}

/** Parse `?type=`, defaulting to both sides. */
export function parseActivityType(raw: string | null | undefined): ActivityTypeFilter {
  const match = ACTIVITY_TYPES.find((t) => t.key === raw);
  return match ? match.key : "all";
}

/** The ISO cutoff a window starts at, measured back from `now`; undefined = unbounded ("all"). */
export function windowCutoff(window: ActivityWindow, now: Date): string | undefined {
  const days = ACTIVITY_WINDOWS.find((w) => w.key === window)?.days;
  if (days === undefined) return undefined;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

/** Apply the window + type filters to collapsed records. Pure; `now` injected for determinism.
 *  Generic over anything time-stamped and sided, so plain broker-window rows filter too. */
export function filterActivity<T extends { readonly at: string; readonly side: string }>(
  records: readonly T[],
  filters: { window: ActivityWindow; type: ActivityTypeFilter; now: Date },
): T[] {
  const cutoff = windowCutoff(filters.window, filters.now);
  return records.filter(
    (r) =>
      (cutoff === undefined || r.at >= cutoff) &&
      (filters.type === "all" || r.side === filters.type),
  );
}

// --- conversions ------------------------------------------------------------------------------

/**
 * One broker order → one journal line. Null for orders the ledger can't honestly hold: a side
 * that isn't buy/sell, or no timestamp at all (an unplaceable-in-time line can never be windowed).
 */
export function recordFromOrder(
  order: AlpacaOrder,
  participantId: string,
  source: ActivitySource,
): TradeActivityRecord | null {
  if (order.side !== "buy" && order.side !== "sell") return null;
  const at = order.filled_at ?? order.submitted_at;
  if (!at) return null;
  const quantity = Number(order.qty);
  const filledQuantity = Number(order.filled_qty ?? "0");
  if (!(Number.isFinite(quantity) && Number.isFinite(filledQuantity))) return null;
  const price = order.filled_avg_price ? Number(order.filled_avg_price) : undefined;
  return {
    orderId: order.id,
    participantId,
    symbol: order.symbol,
    side: order.side,
    quantity,
    filledQuantity,
    ...(price !== undefined && Number.isFinite(price) ? { price } : {}),
    status: order.status,
    at,
    source,
  };
}

/**
 * Broker-window rows (a snapshot's `activity`) → journal lines, for merging with the durable
 * ledger at view time. Rows without an order id are skipped — identity is what makes the merge
 * honest, and every live broker read now carries one.
 */
export function recordsFromActivity(
  activity: readonly ActivityView[] | undefined,
  participantId: string,
): TradeActivityRecord[] {
  const records: TradeActivityRecord[] = [];
  for (const row of activity ?? []) {
    if (!row.orderId || (row.side !== "buy" && row.side !== "sell")) continue;
    records.push({ ...row, orderId: row.orderId, participantId, side: row.side, source: "broker" });
  }
  return records;
}

/**
 * Would `row` advance the ledger's knowledge of its order beyond `held`? The one append predicate,
 * shared by the boot reconcile and the backfill: append on a fuller fill or a changed status,
 * never re-journal a state already held (append-only must not mean append-always).
 */
export function advancesLedger(
  held: TradeActivityRecord | undefined,
  row: TradeActivityRecord,
): boolean {
  if (!held) return true;
  return row.filledQuantity > held.filledQuantity || row.status !== held.status;
}
