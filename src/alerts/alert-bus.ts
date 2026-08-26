import { type Alert, type AlertFilter, matchesFilter, sortAlerts } from "./alert.js";

/**
 * THE ALERT BUS — the one seam every signal producer publishes to and every consumer reads from.
 *
 * A producer calls `publish` and is done: it never learns who is listening, how many listeners
 * there are, or whether anyone is. A consumer calls `subscribe` with a filter and receives only
 * what it asked for — the firehose is opt-in (`{}`), not the default, so a symbol-scoped panel
 * cannot accidentally become a global one.
 *
 * It also keeps a bounded rolling window of what was published, so a consumer that mounts late
 * (a page load, a reconnect) can render immediately instead of waiting for the next signal.
 * The window is bounded on purpose — an unbounded log in a long-lived process is a leak — and
 * `dropped` reports how many alerts aged out of it, because a truncated window presented as a
 * complete history would be a quiet lie about what the desk knew.
 *
 * In-memory and synchronous: no clock, no I/O. Persistence is a port (`AlertDismissalsPort`),
 * wired by `AlertCenter`, so specs drive the whole substrate with nothing on disk.
 */

/** A consumer's callback. Returns nothing — the bus never waits on a listener. */
export type AlertListener = (alert: Alert) => void;

interface Subscription {
  readonly filter: AlertFilter | undefined;
  readonly listener: AlertListener;
}

/** Rolling-window size. ~200 keeps a session's worth of context at a trivial memory cost. */
const DEFAULT_CAPACITY = 200;

export class AlertBus {
  private readonly subscriptions = new Set<Subscription>();
  private readonly window: Alert[] = [];
  private readonly capacity: number;
  private aged = 0;
  private readonly onListenerError: ((error: unknown, alert: Alert) => void) | undefined;

  constructor(
    options: {
      /** Rolling-window size; clamped to at least 1. */
      readonly capacity?: number;
      /** Where a throwing consumer is reported. Absent = swallowed, never rethrown: one broken
       *  consumer must not silence the others or take the producer down with it. */
      readonly onListenerError?: (error: unknown, alert: Alert) => void;
    } = {},
  ) {
    this.capacity = Math.max(1, Math.floor(options.capacity ?? DEFAULT_CAPACITY));
    this.onListenerError = options.onListenerError;
  }

  /** How many alerts have aged out of the rolling window since this bus started. */
  get dropped(): number {
    return this.aged;
  }

  /** Fan one alert out to every matching subscriber, and remember it in the rolling window. */
  publish(alert: Alert): void {
    this.window.push(alert);
    while (this.window.length > this.capacity) {
      this.window.shift();
      this.aged += 1;
    }
    // Snapshot the set: a listener that unsubscribes (or subscribes) mid-fan-out must not change
    // who this emission reaches, or delivery would depend on iteration order.
    for (const subscription of [...this.subscriptions]) {
      if (!matchesFilter(alert, subscription.filter)) continue;
      try {
        subscription.listener(alert);
      } catch (error) {
        this.onListenerError?.(error, alert);
      }
    }
  }

  /** Register a standing interest. Returns the unsubscribe; calling it twice is harmless. */
  subscribe(filter: AlertFilter | undefined, listener: AlertListener): () => void {
    const subscription: Subscription = { filter, listener };
    this.subscriptions.add(subscription);
    return () => {
      this.subscriptions.delete(subscription);
    };
  }

  /**
   * The matching slice of the rolling window, loudest-then-newest first. A copy — a consumer
   * mutating what it got back must not reshape what the next consumer sees.
   */
  recent(filter?: AlertFilter): Alert[] {
    return sortAlerts(this.window.filter((alert) => matchesFilter(alert, filter)));
  }
}
