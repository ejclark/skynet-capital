import type { AlpacaAccountActivity } from "../../src/alpaca/alpaca-options-client.js";
import type { AlpacaOrder } from "../../src/alpaca/alpaca-trading-client.js";
import {
  backfillParticipantActivity,
  backfillParticipantOptionLifecycle,
  reconcileBrokerActivity,
  recoverStreamGap,
} from "../../src/observatory/activity-backfill.js";
import { collapseActivity, InMemoryActivityStore } from "../../src/observatory/activity-store.js";

const order = (
  id: string,
  submittedAt: string,
  overrides: Partial<AlpacaOrder> = {},
): AlpacaOrder => ({
  id,
  symbol: "NVDA",
  qty: "10",
  side: "buy",
  status: "filled",
  filled_qty: "10",
  filled_avg_price: "120.00",
  submitted_at: submittedAt,
  filled_at: submittedAt,
  ...overrides,
});

describe("backfillParticipantActivity", () => {
  it("pages back through history using the oldest submission time as the cursor", async () => {
    const store = new InMemoryActivityStore();
    const calls: Array<string | undefined> = [];
    const pageOne = [order("o3", "2026-08-19T14:00:00Z"), order("o2", "2026-08-18T14:00:00Z")];
    const pageTwo = [order("o1", "2026-08-01T14:00:00Z")];

    const result = await backfillParticipantActivity({
      participantId: "sauron",
      store,
      pageSize: 2,
      listOrders: (params) => {
        calls.push(params.until);
        return Promise.resolve(params.until === undefined ? pageOne : pageTwo);
      },
    });

    expect(calls).toEqual([undefined, "2026-08-18T14:00:00Z"]);
    expect(result).toMatchObject({ fetched: 3, appended: 3, pages: 2 });
    const held = collapseActivity(await store.list("sauron"));
    expect(held.map((r) => r.orderId)).toEqual(["o3", "o2", "o1"]);
    expect(held.every((r) => r.source === "backfill")).toBe(true);
  });

  it("is idempotent — a re-run appends nothing already held", async () => {
    const store = new InMemoryActivityStore();
    const listOrders = () => Promise.resolve([order("o1", "2026-08-01T14:00:00Z")]);

    const first = await backfillParticipantActivity({ participantId: "sauron", store, listOrders });
    const again = await backfillParticipantActivity({ participantId: "sauron", store, listOrders });

    expect(first.appended).toBe(1);
    expect(again).toMatchObject({ fetched: 1, appended: 0 });
    expect(await store.list("sauron")).toHaveLength(1);
  });

  it("still journals a fuller fill for an order the stream saw earlier", async () => {
    const store = new InMemoryActivityStore();
    await store.record({
      orderId: "o1",
      participantId: "sauron",
      symbol: "NVDA",
      side: "buy",
      quantity: 10,
      filledQuantity: 4,
      status: "partially_filled",
      at: "2026-08-01T13:59:00Z",
      source: "stream",
    });

    const result = await backfillParticipantActivity({
      participantId: "sauron",
      store,
      listOrders: () => Promise.resolve([order("o1", "2026-08-01T14:00:00Z")]),
    });

    expect(result.appended).toBe(1);
    expect(collapseActivity(await store.list("sauron"))[0]).toMatchObject({
      filledQuantity: 10,
      status: "filled",
    });
  });
});

describe("backfillParticipantOptionLifecycle (#468 criterion 6)", () => {
  const activity = (
    id: string,
    type: string,
    overrides: Partial<AlpacaAccountActivity> = {},
  ): AlpacaAccountActivity => ({
    id,
    activity_type: type,
    symbol: "MSFT260918P00420000",
    qty: "2",
    date: "2026-09-19T00:00:00Z",
    ...overrides,
  });

  it("journals a well-formed OPEXP with its plain-language status, and pages by activity id", async () => {
    const store = new InMemoryActivityStore();
    const calls: Array<string | undefined> = [];
    const pageOne = [activity("act-2", "OPEXP"), activity("act-1", "OPASN")];

    const result = await backfillParticipantOptionLifecycle({
      participantId: "sauron",
      store,
      pageSize: 2,
      listLifecycleActivities: (after) => {
        calls.push(after);
        return Promise.resolve(after === undefined ? pageOne : []);
      },
    });

    expect(calls).toEqual([undefined, "act-1"]);
    expect(result).toMatchObject({ fetched: 2, appended: 2, pages: 1 });
    const held = collapseActivity(await store.list("sauron"));
    expect(held.every((r) => r.source === "lifecycle")).toBe(true);
    expect(held.find((r) => r.orderId === "lifecycle:act-2")).toMatchObject({
      status: "expired worthless",
      price: 0,
    });
  });

  it("skips a row that doesn't parse as one of the four lifecycle types, without failing the sweep", async () => {
    const store = new InMemoryActivityStore();
    const result = await backfillParticipantOptionLifecycle({
      participantId: "sauron",
      store,
      listLifecycleActivities: () =>
        Promise.resolve([activity("act-1", "FILL"), activity("act-2", "OPEXP")]),
    });
    expect(result).toMatchObject({ fetched: 2, appended: 1 });
  });

  it("is idempotent — a re-run appends nothing already held", async () => {
    const store = new InMemoryActivityStore();
    const listLifecycleActivities = () => Promise.resolve([activity("act-1", "OPEXP")]);

    const first = await backfillParticipantOptionLifecycle({
      participantId: "sauron",
      store,
      listLifecycleActivities,
    });
    const again = await backfillParticipantOptionLifecycle({
      participantId: "sauron",
      store,
      listLifecycleActivities,
    });

    expect(first.appended).toBe(1);
    expect(again).toMatchObject({ fetched: 1, appended: 0 });
    expect(await store.list("sauron")).toHaveLength(1);
  });
});

describe("reconcileBrokerActivity", () => {
  const row = {
    orderId: "o1",
    symbol: "NVDA",
    side: "buy",
    quantity: 10,
    filledQuantity: 10,
    price: 120,
    status: "filled",
    at: "2026-08-19T14:30:00Z",
  } as const;

  it("banks unseen broker-window rows and skips ones already held", async () => {
    const store = new InMemoryActivityStore();
    const participants = [{ id: "sauron", activity: [row] }];

    expect(await reconcileBrokerActivity(store, participants)).toBe(1);
    expect(await reconcileBrokerActivity(store, participants)).toBe(0);
    expect(await store.list("sauron")).toHaveLength(1);
  });
});

// #8251: a reopened fill stream re-reads the broker's recent window; it pages back only while
// that window is still newer than the drop.
describe("recoverStreamGap", () => {
  const DROP = "2026-11-24T14:30:00Z";

  it("journals a fill that landed in the gap exactly once, however often it is re-read", async () => {
    const store = new InMemoryActivityStore();
    // The stream saw the order accepted before it dropped…
    await store.record({
      orderId: "o1",
      participantId: "day-trader",
      symbol: "NVDA",
      side: "buy",
      quantity: 10,
      filledQuantity: 0,
      status: "new",
      at: "2026-11-24T14:00:00Z",
      source: "stream",
    });
    // …and the broker filled it during the gap.
    const filled = order("o1", "2026-11-24T14:00:00Z", { filled_at: "2026-11-24T14:31:00Z" });
    const listOrders = () => Promise.resolve([filled]);

    const first = await recoverStreamGap({
      participantId: "day-trader",
      store,
      listOrders,
      droppedAt: DROP,
    });
    const again = await recoverStreamGap({
      participantId: "day-trader",
      store,
      listOrders,
      droppedAt: DROP,
    });

    expect(first.appended).toBe(1);
    expect(again.appended).toBe(0);
    const held = collapseActivity(await store.list("day-trader"));
    expect(held).toHaveLength(1);
    expect(held[0]).toMatchObject({ status: "filled", filledQuantity: 10, source: "broker" });
  });

  it("reads one recent window when its oldest order is already older than the drop", async () => {
    const calls: Array<{ limit: number; until?: string }> = [];
    const window = Array.from({ length: 15 }, (_, i) =>
      order(`w${i}`, `2026-11-24T14:${String(59 - i * 3).padStart(2, "0")}:00Z`),
    );
    await recoverStreamGap({
      participantId: "day-trader",
      store: new InMemoryActivityStore(),
      listOrders: (params) => {
        calls.push(params);
        return Promise.resolve(window);
      },
      droppedAt: "2026-11-24T14:45:00Z",
    });
    expect(calls).toEqual([{ limit: 15 }]);
  });

  it("pages back while the window is still newer than the drop, then stops", async () => {
    const calls: Array<string | undefined> = [];
    const page = (prefix: string, minute: number) =>
      Array.from({ length: 15 }, (_, i) =>
        order(`${prefix}${i}`, `2026-11-24T15:${String(minute - i).padStart(2, "0")}:00Z`),
      );
    const pages = [page("a", 59), page("b", 44), page("c", 29)];
    const result = await recoverStreamGap({
      participantId: "day-trader",
      store: new InMemoryActivityStore(),
      listOrders: (params) => {
        calls.push(params.until);
        return Promise.resolve(pages[calls.length - 1] ?? []);
      },
      droppedAt: "2026-11-24T15:35:00Z",
    });
    // Page a ends 15:45 (newer than the drop), page b ends 15:30 (past it): stop there.
    expect(calls).toEqual([undefined, "2026-11-24T15:45:00Z"]);
    expect(result.pages).toBe(2);
  });
});
