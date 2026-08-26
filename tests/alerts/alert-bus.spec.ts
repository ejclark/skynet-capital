import type { Alert } from "../../src/alerts/alert.js";
import { AlertBus } from "../../src/alerts/alert-bus.js";

const alert = (over: Partial<Alert> = {}): Alert => ({
  id: "a1",
  at: 1_000,
  source: "price",
  priority: "warning",
  title: "NVDA through its stop",
  symbol: "NVDA",
  ...over,
});

describe("AlertBus", () => {
  it("delivers a published alert to a subscriber that asked for everything", () => {
    const bus = new AlertBus();
    const seen: Alert[] = [];
    bus.subscribe({}, (a) => seen.push(a));
    const published = alert();
    bus.publish(published);
    expect(seen).toEqual([published]);
  });

  it("accepts a publish with no subscribers at all — a producer never learns who listens", () => {
    const bus = new AlertBus();
    expect(() => bus.publish(alert())).not.toThrow();
    expect(bus.recent()).toHaveLength(1);
  });

  it("gives a source-filtered subscriber only its own source, never the firehose", () => {
    const bus = new AlertBus();
    const seen: string[] = [];
    bus.subscribe({ sources: ["calendar"] }, (a) => seen.push(a.id));
    bus.publish(alert({ id: "price-1", source: "price" }));
    bus.publish(alert({ id: "cal-1", source: "calendar" }));
    bus.publish(alert({ id: "news-1", source: "news-sentiment" }));
    expect(seen).toEqual(["cal-1"]);
  });

  it("gives a priority-filtered subscriber only alerts at or above its floor", () => {
    const bus = new AlertBus();
    const seen: string[] = [];
    bus.subscribe({ minPriority: "warning" }, (a) => seen.push(a.id));
    bus.publish(alert({ id: "info", priority: "info" }));
    bus.publish(alert({ id: "warn", priority: "warning" }));
    bus.publish(alert({ id: "crit", priority: "critical" }));
    expect(seen).toEqual(["warn", "crit"]);
  });

  it("fans one alert out to every matching subscriber independently", () => {
    const bus = new AlertBus();
    const nvda: string[] = [];
    const everything: string[] = [];
    bus.subscribe({ symbols: ["NVDA"] }, (a) => nvda.push(a.id));
    bus.subscribe({}, (a) => everything.push(a.id));
    bus.publish(alert({ id: "n", symbol: "NVDA" }));
    bus.publish(alert({ id: "s", symbol: "SPY" }));
    expect(nvda).toEqual(["n"]);
    expect(everything).toEqual(["n", "s"]);
  });

  it("stops delivering after unsubscribe, and a second unsubscribe is harmless", () => {
    const bus = new AlertBus();
    const seen: string[] = [];
    const off = bus.subscribe({}, (a) => seen.push(a.id));
    bus.publish(alert({ id: "before" }));
    off();
    off();
    bus.publish(alert({ id: "after" }));
    expect(seen).toEqual(["before"]);
  });

  it("keeps delivering to the other subscribers when one of them throws", () => {
    const errors: unknown[] = [];
    const bus = new AlertBus({ onListenerError: (error) => errors.push(error) });
    const seen: string[] = [];
    bus.subscribe({}, () => {
      throw new Error("consumer blew up");
    });
    bus.subscribe({}, (a) => seen.push(a.id));
    expect(() => bus.publish(alert({ id: "x" }))).not.toThrow();
    expect(seen).toEqual(["x"]);
    expect(errors).toHaveLength(1);
  });

  it("swallows a throwing consumer when no error sink is wired", () => {
    const bus = new AlertBus();
    bus.subscribe({}, () => {
      throw new Error("consumer blew up");
    });
    expect(() => bus.publish(alert())).not.toThrow();
  });

  it("does not deliver to a subscriber added by another subscriber mid-fan-out", () => {
    const bus = new AlertBus();
    const late: string[] = [];
    bus.subscribe({}, () => {
      bus.subscribe({}, (a) => late.push(a.id));
    });
    bus.publish(alert({ id: "first" }));
    expect(late).toEqual([]);
    bus.publish(alert({ id: "second" }));
    expect(late).toEqual(["second"]);
  });

  it("replays the matching rolling window to a consumer that mounts late", () => {
    const bus = new AlertBus();
    bus.publish(alert({ id: "cal", source: "calendar", at: 1 }));
    bus.publish(alert({ id: "price", source: "price", at: 2 }));
    expect(bus.recent({ sources: ["calendar"] }).map((a) => a.id)).toEqual(["cal"]);
  });

  it("returns the window loudest-then-newest first", () => {
    const bus = new AlertBus();
    bus.publish(alert({ id: "old-warn", priority: "warning", at: 1 }));
    bus.publish(alert({ id: "info", priority: "info", at: 9 }));
    bus.publish(alert({ id: "crit", priority: "critical", at: 2 }));
    bus.publish(alert({ id: "new-warn", priority: "warning", at: 8 }));
    expect(bus.recent().map((a) => a.id)).toEqual(["crit", "new-warn", "old-warn", "info"]);
  });

  it("hands back a copy — mutating it does not reshape what the next consumer sees", () => {
    const bus = new AlertBus();
    bus.publish(alert({ id: "keep" }));
    bus.recent().pop();
    expect(bus.recent().map((a) => a.id)).toEqual(["keep"]);
  });

  it("reports an empty window before anything is published", () => {
    expect(new AlertBus().recent()).toEqual([]);
    expect(new AlertBus().dropped).toBe(0);
  });

  it("bounds the window and counts what aged out, so truncation is never silent", () => {
    const bus = new AlertBus({ capacity: 2 });
    bus.publish(alert({ id: "one", at: 1 }));
    bus.publish(alert({ id: "two", at: 2 }));
    bus.publish(alert({ id: "three", at: 3 }));
    expect(bus.recent().map((a) => a.id)).toEqual(["three", "two"]);
    expect(bus.dropped).toBe(1);
  });

  it("clamps a nonsense capacity to one rather than dropping everything", () => {
    const bus = new AlertBus({ capacity: 0 });
    bus.publish(alert({ id: "only" }));
    expect(bus.recent().map((a) => a.id)).toEqual(["only"]);
  });

  it("still delivers live alerts that have already aged out of the window", () => {
    const bus = new AlertBus({ capacity: 1 });
    const seen: string[] = [];
    bus.subscribe({}, (a) => seen.push(a.id));
    bus.publish(alert({ id: "one", at: 1 }));
    bus.publish(alert({ id: "two", at: 2 }));
    expect(seen).toEqual(["one", "two"]);
    expect(bus.recent().map((a) => a.id)).toEqual(["two"]);
  });
});
