import { join } from "node:path";
import { JsonlKeyedStore } from "../storage/jsonl-store.js";

/**
 * THE PER-ORDER AUDIT TRAIL — one append-only line every time a member-initiated order actually
 * reaches the broker (#466 slice 1). Distinct from `activity-store.ts`'s fill-stream ledger: that
 * one is fed asynchronously from each account's `trade_updates` stream and exists to render the
 * blotter; this one is written synchronously by the desk seam itself at the moment of submission,
 * and its whole point is to answer "who submitted this order" — the account AND the signed-in
 * owner who confirmed it — durably, on the mounted volume, even if the fill stream is slow or down.
 */
export interface OrderAuditRecord {
  readonly participantId: string;
  /** The session email that confirmed the order — absent only for a bot's own autonomous orders. */
  readonly ownerEmail?: string;
  readonly orderId: string;
  readonly at: string;
}

export interface OrderAuditLog {
  record(entry: OrderAuditRecord): Promise<void>;
  /** All recorded lines (order not guaranteed); one participant's when given. */
  list(participantId?: string): Promise<OrderAuditRecord[]>;
}

/** In-memory log: the reference implementation, used by tests and offline runs. */
export class InMemoryOrderAuditLog implements OrderAuditLog {
  private readonly entries: OrderAuditRecord[] = [];

  record(entry: OrderAuditRecord): Promise<void> {
    this.entries.push(entry);
    return Promise.resolve();
  }

  list(participantId?: string): Promise<OrderAuditRecord[]> {
    const all = [...this.entries];
    return Promise.resolve(
      participantId ? all.filter((e) => e.participantId === participantId) : all,
    );
  }
}

/** File-backed log: one append-only JSONL file per participant under `dir` (mount it in prod). */
export class JsonlOrderAuditLog implements OrderAuditLog {
  private readonly store: JsonlKeyedStore<OrderAuditRecord>;

  constructor(dir: string) {
    this.store = new JsonlKeyedStore<OrderAuditRecord>(dir, (participantId) =>
      join(dir, `${participantId.replace(/[^a-zA-Z0-9_-]/g, "_")}.jsonl`),
    );
  }

  record(entry: OrderAuditRecord): Promise<void> {
    return this.store.append(entry.participantId, entry);
  }

  list(participantId?: string): Promise<OrderAuditRecord[]> {
    return this.store.list(participantId);
  }
}

/** Build the log from the environment (`SKYNET_ORDER_AUDIT_DIR`, default `data/order-audit`). */
export function createOrderAuditLog(env: NodeJS.ProcessEnv): OrderAuditLog {
  return new JsonlOrderAuditLog(env.SKYNET_ORDER_AUDIT_DIR ?? "data/order-audit");
}
