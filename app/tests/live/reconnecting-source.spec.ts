import { openReconnectingSource, reopenDelayMs } from "../../src/live/reconnecting-source";

/**
 * #4620 — a reconnect the edge refuses (502 while a machine restarts) closes an EventSource for
 * good. The wrapper reopens a source that had been open; it never retries one that was refused
 * from the start, because that is a route declining on purpose (JSON instead of a stream).
 */

class FakeEventSource {
  static instances: FakeEventSource[] = [];
  readonly listeners = new Map<string, Array<() => void>>();
  readyState = 0;
  closed = false;
  constructor(readonly url: string) {
    FakeEventSource.instances.push(this);
  }
  addEventListener(type: string, listener: () => void) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }
  emit(type: string) {
    for (const l of this.listeners.get(type) ?? []) l();
  }
  open() {
    this.readyState = 1;
    this.emit("open");
  }
  /** The browser's verdict on a refused reconnect: error, and CLOSED for good. */
  refuse() {
    this.readyState = 2;
    this.emit("error");
  }
  close() {
    this.closed = true;
    this.readyState = 2;
  }
}

describe("openReconnectingSource", () => {
  beforeEach(() => {
    rstest.useFakeTimers();
    FakeEventSource.instances.length = 0;
    (globalThis as { EventSource?: unknown }).EventSource = FakeEventSource;
  });
  afterEach(() => {
    rstest.useRealTimers();
    (globalThis as { EventSource?: unknown }).EventSource = undefined;
  });

  it("hands every source it opens to the wiring, so listeners follow the reopen", () => {
    const wired: FakeEventSource[] = [];
    openReconnectingSource("/events", (s) => wired.push(s as unknown as FakeEventSource));
    FakeEventSource.instances[0]?.open();
    FakeEventSource.instances[0]?.refuse();
    rstest.advanceTimersByTime(1000);
    expect(wired).toHaveLength(2);
    expect(FakeEventSource.instances[1]?.url).toBe("/events");
  });

  it("reopens a refused reconnect within the plan's 30 s once the server is back", () => {
    openReconnectingSource("/events", () => undefined);
    FakeEventSource.instances[0]?.open();
    FakeEventSource.instances[0]?.refuse(); // the 502 during the restart
    rstest.advanceTimersByTime(1000);
    FakeEventSource.instances[1]?.refuse(); // still booting
    rstest.advanceTimersByTime(2000);
    FakeEventSource.instances[2]?.refuse();
    rstest.advanceTimersByTime(4000);
    FakeEventSource.instances[3]?.open(); // back
    expect(FakeEventSource.instances).toHaveLength(4);
    expect(FakeEventSource.instances[3]?.closed).toBe(false);
  });

  it("backs off, then holds at the ceiling", () => {
    expect([0, 1, 2, 3, 4, 5, 9].map(reopenDelayMs)).toEqual([
      1000, 2000, 4000, 8000, 15_000, 15_000, 15_000,
    ]);
  });

  it("restarts the backoff once a reopened source actually opens", () => {
    openReconnectingSource("/events", () => undefined);
    FakeEventSource.instances[0]?.open();
    FakeEventSource.instances[0]?.refuse();
    rstest.advanceTimersByTime(1000);
    FakeEventSource.instances[1]?.open();
    FakeEventSource.instances[1]?.refuse();
    rstest.advanceTimersByTime(999);
    expect(FakeEventSource.instances).toHaveLength(2);
    rstest.advanceTimersByTime(1);
    expect(FakeEventSource.instances).toHaveLength(3);
  });

  it("leaves a route that declined from the start alone — no retry loop against a no", () => {
    openReconnectingSource("/api/trade/quote-stream", () => undefined);
    FakeEventSource.instances[0]?.refuse();
    rstest.advanceTimersByTime(60_000);
    expect(FakeEventSource.instances).toHaveLength(1);
  });

  it("leaves a source the browser is retrying itself (CONNECTING) alone", () => {
    openReconnectingSource("/events", () => undefined);
    const source = FakeEventSource.instances[0];
    source?.open();
    if (source) source.readyState = 0; // the browser is mid-retry
    source?.emit("error");
    rstest.advanceTimersByTime(60_000);
    expect(FakeEventSource.instances).toHaveLength(1);
  });

  it("the disposer cancels a pending reopen and closes the current source", () => {
    const dispose = openReconnectingSource("/events", () => undefined);
    FakeEventSource.instances[0]?.open();
    FakeEventSource.instances[0]?.refuse();
    dispose();
    rstest.advanceTimersByTime(60_000);
    expect(FakeEventSource.instances).toHaveLength(1);
    expect(FakeEventSource.instances[0]?.closed).toBe(true);
  });
});
