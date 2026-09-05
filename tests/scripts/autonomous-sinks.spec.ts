import { InMemoryActivityEventBus } from "../../src/observatory/in-memory-activity-event-bus.js";
import { botOrderPublisher } from "../../src/scripts/autonomous-sinks.js";

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
