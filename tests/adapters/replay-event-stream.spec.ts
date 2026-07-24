import {
  ReplayEventStream,
  parseEventsJsonl,
  toEventsJsonl,
} from "../../src/adapters/replay-event-stream.js";
import type { ObservatoryEvent } from "../../src/observatory/events.js";

const events: ObservatoryEvent[] = [
  { type: "price", symbol: "NVDA", price: 170, at: "t1" },
  { type: "price", symbol: "NVDA", price: 172, at: "t2" },
];

describe("ReplayEventStream", () => {
  it("emits events in order via tick()", () => {
    const seen: ObservatoryEvent[] = [];
    const stream = new ReplayEventStream({ events, onEvent: (e) => seen.push(e) });
    stream.tick();
    stream.tick();
    expect(seen).toEqual(events);
  });

  it("loops back to the start by default when exhausted", () => {
    const seen: ObservatoryEvent[] = [];
    const stream = new ReplayEventStream({ events, onEvent: (e) => seen.push(e) });
    stream.tick();
    stream.tick();
    stream.tick(); // wraps
    expect(seen).toHaveLength(3);
    expect(seen[2]).toEqual(events[0]);
  });

  it("stops at the end when loop is false", () => {
    const seen: ObservatoryEvent[] = [];
    const stream = new ReplayEventStream({ events, loop: false, onEvent: (e) => seen.push(e) });
    stream.tick();
    stream.tick();
    stream.tick(); // no-op past the end
    expect(seen).toHaveLength(2);
  });
});

describe("JSONL (de)serialization", () => {
  it("round-trips events through JSONL", () => {
    expect(parseEventsJsonl(toEventsJsonl(events))).toEqual(events);
  });

  it("ignores blank lines", () => {
    const text = `${JSON.stringify(events[0])}\n\n  \n${JSON.stringify(events[1])}\n`;
    expect(parseEventsJsonl(text)).toEqual(events);
  });
});
