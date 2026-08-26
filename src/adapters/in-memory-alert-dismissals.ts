import type { AlertDismissalsPort } from "../ports/alert-dismissals.js";

/**
 * The reference `AlertDismissalsPort` — everything in a Map, nothing on disk.
 *
 * This is what the specs drive and what an offline run uses, for the same reason
 * `createBootActivityStore` hands offline runs an in-memory store: a fixture replay loops, and
 * persisting each loop's identical dismissals would compound a fabricated record across restarts.
 *
 * Its semantics are the contract every durable adapter must match: dismissal is a SET (repeat
 * dismissals collapse), it is scoped per consumer (one member's dismissal is never another's),
 * and an unknown consumer loads empty rather than failing — a member who has dismissed nothing
 * and a member the store has never seen are the same observable state.
 */
export class InMemoryAlertDismissals implements AlertDismissalsPort {
  private readonly byConsumer = new Map<string, Set<string>>();

  loadDismissed(consumerId: string): Promise<readonly string[]> {
    return Promise.resolve([...(this.byConsumer.get(consumerId) ?? [])]);
  }

  dismiss(consumerId: string, fingerprint: string): Promise<void> {
    const held = this.byConsumer.get(consumerId);
    if (held) {
      held.add(fingerprint);
    } else {
      this.byConsumer.set(consumerId, new Set([fingerprint]));
    }
    return Promise.resolve();
  }
}
