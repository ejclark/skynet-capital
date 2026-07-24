import type { DashboardData } from "../observatory/dashboard-data.js";
import type { ObservatoryEvent } from "../observatory/events.js";
import { reduceObservatory } from "../observatory/reduce.js";

type Listener = (state: DashboardData) => void;

/**
 * The live in-memory state of the observatory. Events (fills, price ticks, snapshots)
 * come in via `apply`; it folds them through the pure reducer and notifies subscribers
 * only when the state actually changed. The SSE server subscribes here; the market-data
 * stream and (later) the trading loop call `apply`. All the realtime plumbing meets at
 * this one object, which stays trivially testable because the reducer does the thinking.
 */
export class ObservatoryHub {
  private state: DashboardData;
  private readonly listeners = new Set<Listener>();

  constructor(initial: DashboardData) {
    this.state = initial;
  }

  getState(): DashboardData {
    return this.state;
  }

  /** Fold an event into the state; notify subscribers only if it changed something. */
  apply(event: ObservatoryEvent): void {
    const next = reduceObservatory(this.state, event);
    if (next === this.state) {
      return;
    }
    this.state = next;
    for (const listener of this.listeners) {
      listener(next);
    }
  }

  /** Subscribe to state changes. Returns an unsubscribe function. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Number of active subscribers — useful for logging/diagnostics. */
  get subscriberCount(): number {
    return this.listeners.size;
  }
}
