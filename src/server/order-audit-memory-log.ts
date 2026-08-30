/**
 * IN-MEMORY ORDER AUDIT LOG — the reference `OrderAuditLog` implementation, used by tests and
 * offline runs. Split out of `order-audit-log.ts` (Biome `noExcessiveClassesPerFile`) so the
 * file-backed log stays the one class the main module defines.
 */
import { InMemoryKeyedStore } from "../storage/in-memory-keyed-store.js";
import type { OrderAuditLog, OrderAuditRecord } from "./order-audit-log.js";

/** In-memory log: the reference implementation, used by tests and offline runs. */
export class InMemoryOrderAuditLog implements OrderAuditLog {
  private readonly store = new InMemoryKeyedStore<OrderAuditRecord>((e) => e.participantId);

  record(entry: OrderAuditRecord): Promise<void> {
    return this.store.append(entry);
  }

  list(participantId?: string): Promise<OrderAuditRecord[]> {
    return this.store.list(participantId);
  }
}
