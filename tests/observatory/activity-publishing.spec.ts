import type { ActivityEventBus } from "../../src/observatory/activity-event.js";
import {
  bootPublishingActivityStore,
  publishingActivityStore,
  publishingOrderAuditLog,
} from "../../src/observatory/activity-publishing.js";
import type { TradeActivityRecord } from "../../src/observatory/activity-record.js";
import { InMemoryActivityEventBus } from "../../src/observatory/in-memory-activity-event-bus.js";
import { InMemoryActivityStore } from "../../src/observatory/in-memory-activity-store.js";
import type { OrderAuditRecord } from "../../src/server/order-audit-log.js";
import { InMemoryOrderAuditLog } from "../../src/server/order-audit-memory-log.js";

const tradeRecord: TradeActivityRecord = {
  orderId: "ord-1",
  participantId: "sauron",
  symbol: "NVDA",
  side: "buy",
  quantity: 10,
  filledQuantity: 10,
  status: "filled",
  at: "2026-08-19T14:30:00.000Z",
  source: "stream",
};

const auditRecord: OrderAuditRecord = {
  participantId: "sauron",
  orderId: "ord-1",
  at: "2026-08-19T14:29:00.000Z",
};

describe("publishingActivityStore", () => {
  it("still records and lists exactly as the wrapped store would (behavior-preserving)", async () => {
    const store = new InMemoryActivityStore();
    const wrapped = publishingActivityStore(store, new InMemoryActivityEventBus());

    await wrapped.record(tradeRecord);

    expect(await wrapped.list("sauron")).toEqual(await store.list("sauron"));
  });

  it("also publishes a translated event onto the bus", async () => {
    const bus = new InMemoryActivityEventBus();
    const wrapped = publishingActivityStore(new InMemoryActivityStore(), bus);

    await wrapped.record(tradeRecord);

    const published = await bus.list("sauron");
    expect(published).toHaveLength(1);
    expect(published[0]).toMatchObject({ eventType: "order.filled", visibility: "public" });
  });

  it("a bus failure never fails the caller's record() — the ledger write already succeeded", async () => {
    const failingBus: ActivityEventBus = {
      publish: () => Promise.reject(new Error("bus down")),
      list: () => Promise.resolve([]),
      subscribe: () => ({ unsubscribe: () => undefined }),
    };
    const store = new InMemoryActivityStore();
    const wrapped = publishingActivityStore(store, failingBus);

    await expect(wrapped.record(tradeRecord)).resolves.toBeUndefined();
    expect(await store.list("sauron")).toHaveLength(1);
  });
});

describe("publishingOrderAuditLog", () => {
  it("still records and lists exactly as the wrapped log would (behavior-preserving)", async () => {
    const log = new InMemoryOrderAuditLog();
    const wrapped = publishingOrderAuditLog(log, new InMemoryActivityEventBus());

    await wrapped.record(auditRecord);

    expect(await wrapped.list("sauron")).toEqual(await log.list("sauron"));
  });

  it("publishes with owner-only visibility, matching the schema's audit-line tier", async () => {
    const bus = new InMemoryActivityEventBus();
    const wrapped = publishingOrderAuditLog(new InMemoryOrderAuditLog(), bus);

    await wrapped.record(auditRecord);

    expect(await bus.list("sauron")).toMatchObject([{ visibility: "owner-only" }]);
  });
});

describe("bootPublishingActivityStore", () => {
  it("offline mode wires an in-memory bus", () => {
    const { bus } = bootPublishingActivityStore({} as NodeJS.ProcessEnv, "offline");
    expect(bus).toBeInstanceOf(InMemoryActivityEventBus);
  });

  it("records through the returned activity store publish onto the returned bus", async () => {
    const { activity, bus } = bootPublishingActivityStore({} as NodeJS.ProcessEnv, "offline");
    await activity.record(tradeRecord);
    expect(await bus.list("sauron")).toHaveLength(1);
  });
});
