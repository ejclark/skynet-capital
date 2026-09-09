import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import { InMemoryActivityEventBus } from "../../src/observatory/in-memory-activity-event-bus.js";
import { botOrderPublisher, decisionSink } from "../../src/scripts/autonomous-sinks.js";

/**
 * `botOrderPublisher` is the one bit of #1211 slice 2's wiring worth its own spec: given a bus,
 * does it translate + publish the right event for a bot's own accepted order, and does a bus
 * failure stay contained rather than reaching back into the broker's own submit path.
 */
describe("botOrderPublisher", () => {
  it("publishes an order.submitted event for the given persona on a successful order", async () => {
    const bus = new InMemoryActivityEventBus();
    const publish = botOrderPublisher("sauron", bus);

    publish({
      orderId: "o1",
      symbol: "NVDA",
      side: "buy",
      quantity: 3,
      at: "2026-09-04T14:00:00.000Z",
    });
    // publish() is fire-and-forget (never awaited by the adapter) — give the microtask a tick.
    await Promise.resolve();
    await Promise.resolve();

    const events = await bus.list("sauron");
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      eventType: "order.submitted",
      actor: { participantId: "sauron", kind: "bot" },
      source: "bot",
      visibility: "owner-only",
      payload: { symbol: "NVDA", side: "buy", quantity: 3 },
    });
  });

  it("a bus-publish failure never throws back into the broker's own submit path", () => {
    const failingBus = { publish: () => Promise.reject(new Error("disk full")) };
    const publish = botOrderPublisher("sauron", failingBus as never);

    expect(() =>
      publish({
        orderId: "o1",
        symbol: "NVDA",
        side: "buy",
        quantity: 1,
        at: "2026-09-04T14:00:00.000Z",
      }),
    ).not.toThrow();
  });
});

const decision = (over: Partial<DecisionRecord> = {}): DecisionRecord => ({
  at: 1,
  personaId: "sauron",
  mode: "observe",
  rawIntents: [],
  guardedIntents: [],
  outcomes: [],
  ...over,
});

describe("decisionSink", () => {
  it("writes to the decision DB when one is given, alongside the (absent-here) JSONL audit", () => {
    const recorded: DecisionRecord[] = [];
    const db = { record: (r: DecisionRecord) => recorded.push(r) };

    decisionSink(undefined, db as never)(decision());

    expect(recorded).toHaveLength(1);
  });

  it("is a no-op with neither sink configured — never throws", () => {
    expect(() => decisionSink(undefined, undefined)(decision())).not.toThrow();
  });

  it("a throwing decision-db write is caught — DatabaseSync is synchronous, unlike the JSONL audit", () => {
    const db = {
      record: () => {
        throw new Error("SQLITE_BUSY");
      },
    };

    expect(() => decisionSink(undefined, db as never)(decision())).not.toThrow();
  });
});
