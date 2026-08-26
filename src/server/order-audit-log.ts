import { join } from "node:path";
import type { TradeTypeCode } from "../domain/trade-types.js";
import { JsonlKeyedStore } from "../storage/jsonl-store.js";

/**
 * THE PER-ORDER AUDIT TRAIL — one append-only line every time a member-initiated order actually
 * reaches the broker (#466 slice 1). Distinct from `activity-store.ts`'s fill-stream ledger: that
 * one is fed asynchronously from each account's `trade_updates` stream and exists to render the
 * blotter; this one is written synchronously by the desk seam itself at the moment of submission,
 * and its whole point is to answer "who submitted this order" — the account AND the signed-in
 * owner who confirmed it — durably, on the mounted volume, even if the fill stream is slow or down.
 *
 * The line also carries the desk's TAG-AT-ENTRY (docs/IDEAS.md, strategy attribution): the play
 * code the member confirmed, stamped at the one moment it is known for sure. Milestone derivation
 * (`domain/progression.ts`) joins these tags with the fill ledger — an option fill earns its
 * course code only when the tag says it OPENED that play, so a buy-to-close never masquerades as
 * a long. All tag fields are optional: pre-tag lines parse unchanged.
 */
export interface OrderAuditRecord {
  readonly participantId: string;
  /** The session email that confirmed the order — absent only for a bot's own autonomous orders. */
  readonly ownerEmail?: string;
  readonly orderId: string;
  readonly at: string;
  /** The play the member confirmed — absent on a close (a close is an exit, not a play). */
  readonly code?: TradeTypeCode;
  readonly intent?: "open" | "close";
  /** The wire symbol the broker echoed — OCC for options, ticker for shares. */
  readonly symbol?: string;
  readonly side?: "buy" | "sell";
}

export interface OrderAuditLog {
  record(entry: OrderAuditRecord): Promise<void>;
  /** All recorded lines (order not guaranteed); one participant's when given. */
  list(participantId?: string): Promise<OrderAuditRecord[]>;
}

/** The in-memory reference implementation (`InMemoryOrderAuditLog`) lives in its own file,
 *  `order-audit-memory-log.ts` (Biome `noExcessiveClassesPerFile` — one class per module). */

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
