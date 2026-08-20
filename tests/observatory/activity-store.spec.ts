import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AlpacaOrder } from "../../src/alpaca/alpaca-trading-client.js";
import {
  collapseActivity,
  createActivityStore,
  filterActivity,
  InMemoryActivityStore,
  JsonlActivityStore,
  parseActivityType,
  parseActivityWindow,
  recordFromOrder,
  recordsFromActivity,
  type TradeActivityRecord,
  windowCutoff,
} from "../../src/observatory/activity-store.js";

const NOW = new Date("2026-08-20T15:00:00.000Z");

const record = (overrides: Partial<TradeActivityRecord> = {}): TradeActivityRecord => ({
  orderId: "ord-1",
  participantId: "sauron",
  symbol: "NVDA",
  side: "buy",
  quantity: 10,
  filledQuantity: 10,
  price: 120,
  status: "filled",
  at: "2026-08-19T14:30:00.000Z",
  source: "stream",
  ...overrides,
});

describe("InMemoryActivityStore", () => {
  it("records entries and filters by participant", async () => {
    const store = new InMemoryActivityStore();
    await store.record(record({ participantId: "sauron" }));
    await store.record(record({ participantId: "human-eric", orderId: "ord-2" }));

    expect(await store.list()).toHaveLength(2);
    expect(await store.list("sauron")).toHaveLength(1);
  });
});

describe("JsonlActivityStore", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-activity-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("appends per participant and reads back", async () => {
    const store = new JsonlActivityStore(dir);
    await store.record(record());
    await store.record(record({ orderId: "ord-2", side: "sell" }));

    const sauron = await store.list("sauron");
    expect(sauron).toHaveLength(2);
    expect(sauron[1]).toMatchObject({ orderId: "ord-2", side: "sell" });
  });

  it("returns nothing for an unknown participant (missing file, not an error)", async () => {
    const store = new JsonlActivityStore(dir);
    expect(await store.list("nobody")).toEqual([]);
  });
});

describe("createActivityStore", () => {
  it("uses SKYNET_ACTIVITY_DIR when set", async () => {
    const dir = await mkdtemp(join(tmpdir(), "skynet-activity-env-"));
    try {
      const store = createActivityStore({ SKYNET_ACTIVITY_DIR: dir } as NodeJS.ProcessEnv);
      await store.record(record());
      expect(await store.list("sauron")).toHaveLength(1);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe("collapseActivity", () => {
  it("folds a progressing order to its most-filled line", () => {
    const lines = [
      record({ status: "new", filledQuantity: 0, at: "2026-08-19T14:00:00.000Z" }),
      record({ status: "partially_filled", filledQuantity: 4, at: "2026-08-19T14:01:00.000Z" }),
      record({ status: "filled", filledQuantity: 10, at: "2026-08-19T14:02:00.000Z" }),
    ];
    const collapsed = collapseActivity(lines);
    expect(collapsed).toHaveLength(1);
    expect(collapsed[0]).toMatchObject({ status: "filled", filledQuantity: 10 });
  });

  it("never lets a backfill line regress a live-captured fill", () => {
    const live = record({ source: "stream", filledQuantity: 10, at: "2026-08-19T14:02:00.000Z" });
    const stale = record({ source: "backfill", filledQuantity: 4, at: "2026-08-19T14:01:00.000Z" });
    // Backfill appended after live capture: the fuller line still wins.
    expect(collapseActivity([live, stale])[0]).toMatchObject({ source: "stream" });
  });

  it("keeps distinct orders and returns them newest-first", () => {
    const collapsed = collapseActivity([
      record({ orderId: "old", at: "2026-08-10T14:00:00.000Z" }),
      record({ orderId: "new", at: "2026-08-19T14:00:00.000Z" }),
    ]);
    expect(collapsed.map((r) => r.orderId)).toEqual(["new", "old"]);
  });
});

describe("windows and type filters", () => {
  it("parses window and type params, defaulting to 30d / all", () => {
    expect(parseActivityWindow("7d")).toBe("7d");
    expect(parseActivityWindow("garbage")).toBe("30d");
    expect(parseActivityWindow(null)).toBe("30d");
    expect(parseActivityType("sell")).toBe("sell");
    expect(parseActivityType(undefined)).toBe("all");
  });

  it("computes cutoffs relative to now, and no cutoff for all", () => {
    expect(windowCutoff("7d", NOW)).toBe("2026-08-13T15:00:00.000Z");
    expect(windowCutoff("all", NOW)).toBeUndefined();
  });

  it("filters by window and side together", () => {
    const records = [
      record({ orderId: "recent-buy", side: "buy", at: "2026-08-19T14:00:00.000Z" }),
      record({ orderId: "recent-sell", side: "sell", at: "2026-08-18T14:00:00.000Z" }),
      record({ orderId: "ancient-buy", side: "buy", at: "2026-05-01T14:00:00.000Z" }),
    ];
    const week = filterActivity(records, { window: "7d", type: "all", now: NOW });
    expect(week.map((r) => r.orderId)).toEqual(["recent-buy", "recent-sell"]);

    const sells = filterActivity(records, { window: "all", type: "sell", now: NOW });
    expect(sells.map((r) => r.orderId)).toEqual(["recent-sell"]);
  });
});

describe("recordFromOrder", () => {
  const order: AlpacaOrder = {
    id: "abc-123",
    symbol: "NVDA",
    qty: "10",
    side: "buy",
    status: "filled",
    filled_qty: "10",
    filled_avg_price: "120.50",
    submitted_at: "2026-08-19T14:29:00.000Z",
    filled_at: "2026-08-19T14:30:00.000Z",
  };

  it("maps a filled order, preferring the fill time", () => {
    expect(recordFromOrder(order, "sauron", "backfill")).toMatchObject({
      orderId: "abc-123",
      participantId: "sauron",
      price: 120.5,
      at: "2026-08-19T14:30:00.000Z",
      source: "backfill",
    });
  });

  it("keeps an unfilled order without inventing a price", () => {
    const unfilled = recordFromOrder(
      { ...order, status: "canceled", filled_qty: "0", filled_avg_price: null, filled_at: null },
      "sauron",
      "backfill",
    );
    expect(unfilled).toMatchObject({ status: "canceled", filledQuantity: 0 });
    expect(unfilled?.price).toBeUndefined();
    expect(unfilled?.at).toBe("2026-08-19T14:29:00.000Z");
  });

  it("refuses orders it cannot honestly hold", () => {
    expect(
      recordFromOrder(
        { ...order, side: "sell_short" as AlpacaOrder["side"] },
        "sauron",
        "backfill",
      ),
    ).toBeNull();
    const noTime = { ...order } as { filled_at?: string | null; submitted_at?: string };
    noTime.filled_at = null;
    delete noTime.submitted_at;
    expect(recordFromOrder(noTime as AlpacaOrder, "sauron", "backfill")).toBeNull();
  });
});

describe("recordsFromActivity", () => {
  it("converts broker-window rows with ids and skips rows without", () => {
    const rows = recordsFromActivity(
      [
        {
          orderId: "ord-1",
          symbol: "NVDA",
          side: "buy",
          quantity: 10,
          filledQuantity: 10,
          price: 120,
          status: "filled",
          at: "2026-08-19T14:30:00.000Z",
        },
        {
          symbol: "AAPL",
          side: "buy",
          quantity: 1,
          filledQuantity: 1,
          status: "filled",
          at: "2026-08-19T14:31:00.000Z",
        },
      ],
      "sauron",
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ orderId: "ord-1", participantId: "sauron", source: "broker" });
  });
});
