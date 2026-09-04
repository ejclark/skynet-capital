/**
 * IN-MEMORY EVENT BUS — the reference `ActivityEventBus` implementation, used by tests and offline
 * runs. Split out of `activity-bus.ts` (Biome `noExcessiveClassesPerFile`), mirroring
 * `in-memory-activity-store.ts` / `order-audit-memory-log.ts`. Imports the interface from
 * `activity-event.ts`, never from `activity-bus.ts` itself — that file imports THIS class for its
 * boot factory, so the reverse import would form a cycle.
 */
import { InMemoryKeyedStore } from "../storage/in-memory-keyed-store.js";
import type {
  ActivityEvent,
  ActivityEventBus,
  ActivitySubscription,
  PublishedListener,
} from "./activity-event.js";

export class InMemoryActivityEventBus implements ActivityEventBus {
  private readonly store = new InMemoryKeyedStore<ActivityEvent>((e) => e.actor.participantId);
  private readonly listeners = new Set<PublishedListener>();

  async publish(event: ActivityEvent): Promise<void> {
    await this.store.append(event);
    for (const listener of this.listeners) listener(event);
  }

  list(participantId?: string): Promise<ActivityEvent[]> {
    return this.store.list(participantId);
  }

  subscribe(listener: PublishedListener): ActivitySubscription {
    this.listeners.add(listener);
    return { unsubscribe: () => this.listeners.delete(listener) };
  }
}
