import type { ActivityEventBus } from "../../src/observatory/activity-event.js";
import { activityEventFromFeedbackStatus } from "../../src/observatory/activity-event.js";
import {
  bootPublishingActivityStore,
  publishingActivityStore,
  publishingFeedbackLogStore,
  publishingFeedbackStatuses,
  publishingOrderAuditLog,
} from "../../src/observatory/activity-publishing.js";
import type { TradeActivityRecord } from "../../src/observatory/activity-record.js";
import { InMemoryActivityEventBus } from "../../src/observatory/in-memory-activity-event-bus.js";
import { InMemoryActivityStore } from "../../src/observatory/in-memory-activity-store.js";
import type { FeedbackLogEntry } from "../../src/server/feedback-log.js";
import { InMemoryFeedbackLogStore } from "../../src/server/feedback-log-memory-store.js";
import type { FeedbackStatus } from "../../src/server/feedback-status.js";
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

const filing: FeedbackLogEntry = {
  uuid: "u-1",
  opaqueMemberId: "m-1",
  issueNumber: 700,
  url: "https://github.com/ejclark/skynet-capital/issues/700",
  kind: "idea",
  title: "A better wire",
  filedAt: "2026-08-27T10:00:00.000Z",
};

describe("publishingFeedbackLogStore", () => {
  it("still records and lists exactly as the wrapped store would (behavior-preserving)", async () => {
    const store = new InMemoryFeedbackLogStore();
    const wrapped = publishingFeedbackLogStore(store, new InMemoryActivityEventBus());

    await wrapped.record(filing);

    expect(await wrapped.list("m-1")).toEqual(await store.list("m-1"));
  });

  it("publishes the filing onto the bus as a public event", async () => {
    const bus = new InMemoryActivityEventBus();
    await publishingFeedbackLogStore(new InMemoryFeedbackLogStore(), bus).record(filing);

    expect(await bus.list()).toMatchObject([
      {
        eventType: "feedback.filed",
        visibility: "public",
        target: { kind: "feedback", id: "700" },
      },
    ]);
  });

  it("a bus failure never costs the member the filing they just made", async () => {
    const failingBus: ActivityEventBus = {
      publish: () => Promise.reject(new Error("bus down")),
      list: () => Promise.resolve([]),
      subscribe: () => ({ unsubscribe: () => undefined }),
    };
    const store = new InMemoryFeedbackLogStore();

    await expect(
      publishingFeedbackLogStore(store, failingBus).record(filing),
    ).resolves.toBeUndefined();
    expect(await store.list("m-1")).toHaveLength(1);
  });
});

describe("publishingFeedbackStatuses", () => {
  const fetcherFor = (statuses: ReadonlyMap<number, FeedbackStatus>) => () =>
    Promise.resolve(statuses);
  const at = () => "2026-08-30T10:00:00.000Z";

  it("returns the wrapped fetcher's result untouched, so every existing caller is unchanged", async () => {
    const statuses = new Map<number, FeedbackStatus>([[700, "shipped"]]);
    const wrapped = publishingFeedbackStatuses(
      fetcherFor(statuses),
      new InMemoryActivityEventBus(),
      at,
    );

    expect(await wrapped([700])).toBe(statuses);
  });

  it("publishes an observed transition onto the bus", async () => {
    const bus = new InMemoryActivityEventBus();
    const wrapped = publishingFeedbackStatuses(
      fetcherFor(new Map<number, FeedbackStatus>([[700, "shipped"]])),
      bus,
      at,
    );

    await wrapped([700]);

    expect(await bus.list()).toMatchObject([
      { eventType: "feedback.status-changed", payload: { issueNumber: 700, status: "shipped" } },
    ]);
  });

  it("stays silent for a filing still sitting in the queue — `feedback.filed` already said that", async () => {
    const bus = new InMemoryActivityEventBus();
    const wrapped = publishingFeedbackStatuses(
      fetcherFor(new Map<number, FeedbackStatus>([[700, "open"]])),
      bus,
      at,
    );

    await wrapped([700]);

    expect(await bus.list()).toEqual([]);
  });

  it("does not re-announce a status on every poll", async () => {
    const bus = new InMemoryActivityEventBus();
    const wrapped = publishingFeedbackStatuses(
      fetcherFor(new Map<number, FeedbackStatus>([[700, "shipped"]])),
      bus,
      at,
    );

    await wrapped([700]);
    await wrapped([700]);

    expect(await bus.list()).toHaveLength(1);
  });

  it("does not re-announce history the bus already witnessed before this process started", async () => {
    const bus = new InMemoryActivityEventBus();
    await bus.publish(activityEventFromFeedbackStatus(700, "shipped", "2026-08-29T10:00:00.000Z"));
    const wrapped = publishingFeedbackStatuses(
      fetcherFor(new Map<number, FeedbackStatus>([[700, "shipped"]])),
      bus,
      at,
    );

    await wrapped([700]);

    expect(await bus.list()).toHaveLength(1);
  });

  it("two polls racing an unseeded memory publish the transition once, not twice", async () => {
    const bus = new InMemoryActivityEventBus();
    const wrapped = publishingFeedbackStatuses(
      fetcherFor(new Map<number, FeedbackStatus>([[700, "shipped"]])),
      bus,
      at,
    );

    await Promise.all([wrapped([700]), wrapped([700])]);

    expect(await bus.list()).toHaveLength(1);
  });

  it("a failed seed read is retried, not remembered as a permanently broken emitter", async () => {
    const inner = new InMemoryActivityEventBus();
    let listCalls = 0;
    const flakyBus: ActivityEventBus = {
      publish: (event) => inner.publish(event),
      list: (participantId) => {
        listCalls += 1;
        return listCalls === 1
          ? Promise.reject(new Error("volume not ready"))
          : inner.list(participantId);
      },
      subscribe: (listener) => inner.subscribe(listener),
    };
    const wrapped = publishingFeedbackStatuses(
      fetcherFor(new Map<number, FeedbackStatus>([[700, "shipped"]])),
      flakyBus,
      at,
    );

    await wrapped([700]);
    expect(await inner.list()).toEqual([]);

    await wrapped([700]);
    expect(await inner.list()).toHaveLength(1);
  });

  it("a bus failure never fails the status read the page is waiting on", async () => {
    const statuses = new Map<number, FeedbackStatus>([[700, "shipped"]]);
    const failingBus: ActivityEventBus = {
      publish: () => Promise.reject(new Error("bus down")),
      list: () => Promise.resolve([]),
      subscribe: () => ({ unsubscribe: () => undefined }),
    };

    await expect(
      publishingFeedbackStatuses(fetcherFor(statuses), failingBus, at)([700]),
    ).resolves.toBe(statuses);
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
