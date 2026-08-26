/**
 * IN-MEMORY ORDER AUDIT LOG — the reference `OrderAuditLog` implementation, used by tests and
 * offline runs. Split out of `order-audit-log.ts` (Biome `noExcessiveClassesPerFile`) so the
 * file-backed log stays the one class the main module defines.
 */
import type { OrderAuditLog, OrderAuditRecord } from "./order-audit-log.js";

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
