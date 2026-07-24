import type { ObservatoryEvent } from "../observatory/events.js";

export interface ReplayEventStreamConfig {
  /** The recorded events to replay, in order. */
  readonly events: readonly ObservatoryEvent[];
  /** Called with each replayed event — the same sink the live streams push to. */
  readonly onEvent: (event: ObservatoryEvent) => void;
  /** Optional lifecycle logging. */
  readonly onStatus?: (status: string) => void;
  /** Milliseconds between emitted events (default 1000). */
  readonly intervalMs?: number;
  /** Loop back to the start when the script is exhausted (default true). */
  readonly loop?: boolean;
}

/**
 * The realtime half of offline mode: replays a recorded sequence of `ObservatoryEvent`s
 * (price ticks and fills) through the same `onEvent` sink the live sockets use, so the
 * hub and browser can't tell the difference. Exposes the same `{ start(), stop() }`
 * surface as `AlpacaMarketDataStream` / `AlpacaTradeUpdatesStream`, so the wiring code
 * accepts it interchangeably. No socket, no network, fully deterministic — `tick()` is
 * exposed so tests can advance it without timers.
 */
export class ReplayEventStream {
  private timer?: ReturnType<typeof setInterval>;
  private index = 0;
  private readonly config: ReplayEventStreamConfig;

  constructor(config: ReplayEventStreamConfig) {
    this.config = config;
  }

  start(): void {
    this.config.onStatus?.(`replaying ${this.config.events.length} event(s)`);
    this.timer = setInterval(() => this.tick(), this.config.intervalMs ?? 1000);
  }

  /** Emit the next event (looping or stopping at the end). Deterministic entry point. */
  tick(): void {
    if (this.index >= this.config.events.length) {
      if (this.config.loop ?? true) {
        this.index = 0;
      } else {
        this.stop();
        return;
      }
    }
    const event = this.config.events[this.index];
    this.index += 1;
    if (event) {
      this.config.onEvent(event);
    }
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }
}

/** Parse a JSONL recording (one `ObservatoryEvent` per line) into an array. */
export function parseEventsJsonl(text: string): ObservatoryEvent[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line) as ObservatoryEvent);
}

/** Serialize events to JSONL (one per line) — the recorder's on-disk format. */
export function toEventsJsonl(events: readonly ObservatoryEvent[]): string {
  return events.map((event) => JSON.stringify(event)).join("\n");
}
