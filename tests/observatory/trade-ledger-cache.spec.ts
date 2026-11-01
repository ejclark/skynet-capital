import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { publishingActivityStore } from "../../src/observatory/activity-publishing.js";
import type { ActivityStore, TradeActivityRecord } from "../../src/observatory/activity-record.js";
import { JsonlActivityStore } from "../../src/observatory/activity-store.js";
import { deskLedger } from "../../src/observatory/desk-data.js";
import { InMemoryActivityEventBus } from "../../src/observatory/in-memory-activity-event-bus.js";
import { InMemoryActivityStore } from "../../src/observatory/in-memory-activity-store.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import { pulseTradesOf } from "../../src/observatory/pulse-json-view.js";
import { heldLedgerReader } from "../../src/observatory/trade-ledger-cache.js";

/** What Pulse and the blotter read off a ledger is held while its inputs are unchanged, and is
 *  always what a fresh build of the same ledger and broker window would return (#4619). */

const snapshot = (over: Partial<ParticipantSnapshot> = {}): ParticipantSnapshot => ({
  id: "sauron",
  displayName: "Sauron",
  kind: "bot",
  cash: 50_000,
  equity: 120_000,
  positions: [],
  activity: [],
  ...over,
});

const fill = (over: Partial<TradeActivityRecord> & { orderId: string }): TradeActivityRecord => ({
  participantId: "sauron",
  symbol: "NVDA",
  side: "buy",
  quantity: 10,
  filledQuantity: 10,
  status: "filled",
  price: 100,
  at: "2026-08-03T14:00:00Z",
  source: "stream",
  ...over,
});

/** A store that counts whole-ledger reads (`since` from byte 0, or `list`). */
function counting(store: ActivityStore): { store: ActivityStore; wholeReads: () => number } {
  let whole = 0;
  const since = store.since?.bind(store);
  return {
    store: {
      record: (e) => store.record(e),
      list: (id) => {
        whole += 1;
        return store.list(id);
      },
      latest: (id) => store.latest(id),
      ...(since
        ? {
            since: (id: string, offset: number) => {
              if (offset === 0) whole += 1;
              return since(id, offset);
            },
          }
        : {}),
    },
    wholeReads: () => whole,
  };
}

describe("heldLedgerReader", () => {
  let dir: string;
  let jsonl: JsonlActivityStore;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "held-ledger-"));
    jsonl = new JsonlActivityStore(dir);
    await jsonl.record(fill({ orderId: "b1", at: "2026-08-03T14:00:00Z" }));
    await jsonl.record(
      fill({ orderId: "s1", side: "sell", price: 110, at: "2026-08-04T14:00:00Z" }),
    );
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const fresh = async (snap: ParticipantSnapshot) => {
    const durable = await jsonl.list(snap.id);
    return { trades: pulseTradesOf(snap, durable), open: deskLedger(snap, durable).open };
  };

  it("answers exactly what a fresh build of the same ledger returns", async () => {
    const read = heldLedgerReader(jsonl);
    const snap = snapshot();
    expect(await read(snap)).toEqual(await fresh(snap));
    expect((await read(snap)).trades.stats.netRealized).toBe(100);
  });

  it("holds the lots still open, as a fresh match leaves them", async () => {
    await jsonl.record(
      fill({
        orderId: "b2",
        quantity: 4,
        filledQuantity: 4,
        price: 120,
        at: "2026-08-05T14:00:00Z",
      }),
    );
    const read = heldLedgerReader(jsonl);
    const held = await read(snapshot());
    expect(held).toEqual(await fresh(snapshot()));
    expect(held.open).toMatchObject([
      { symbol: "NVDA", quantity: 4, price: 120, entryOrderId: "b2" },
    ]);
  });

  it("does not re-read the ledger while nothing was appended and the broker window is unchanged", async () => {
    const { store, wholeReads } = counting(jsonl);
    const read = heldLedgerReader(store);
    const first = await read(snapshot());
    const second = await read(snapshot());
    expect(second).toBe(first);
    expect(wholeReads()).toBe(1);
  });

  it("rebuilds after a new fill is appended, and matches a fresh build", async () => {
    const read = heldLedgerReader(jsonl);
    await read(snapshot());
    await jsonl.record(fill({ orderId: "b2", price: 200, at: "2026-08-05T14:00:00Z" }));
    await jsonl.record(
      fill({ orderId: "s2", side: "sell", price: 150, at: "2026-08-06T14:00:00Z" }),
    );
    const after = await read(snapshot());
    expect(after).toEqual(await fresh(snapshot()));
    expect(after.trades.stats.trades).toBe(2);
    expect(after.trades.stats.netRealized).toBe(100 - 500);
  });

  it("rebuilds when the broker window changes, even with the ledger untouched", async () => {
    const read = heldLedgerReader(jsonl);
    await read(snapshot());
    // A close the broker reports before the stream journaled it — the merge counts it.
    const windowed = snapshot({
      activity: [
        {
          orderId: "b3",
          symbol: "AMD",
          side: "buy",
          quantity: 5,
          filledQuantity: 5,
          price: 50,
          status: "filled",
          at: "2026-08-07T14:00:00Z",
        },
        {
          orderId: "s3",
          symbol: "AMD",
          side: "sell",
          quantity: 5,
          filledQuantity: 5,
          price: 60,
          status: "filled",
          at: "2026-08-08T14:00:00Z",
        },
      ],
    });
    const after = await read(windowed);
    expect(after).toEqual(await fresh(windowed));
    expect(after.trades.stats.trades).toBe(2);
  });

  it("rebuilds when the ledger file was replaced by a shorter one", async () => {
    const read = heldLedgerReader(jsonl);
    expect((await read(snapshot())).trades.stats.trades).toBe(1);
    await writeFile(join(dir, "sauron.jsonl"), `${JSON.stringify(fill({ orderId: "b9" }))}\n`);
    const after = await read(snapshot());
    expect(after).toEqual(await fresh(snapshot()));
    expect(after.trades.stats.trades).toBe(0);
  });

  it("keeps each participant's answer apart", async () => {
    const read = heldLedgerReader(jsonl);
    const sauron = await read(snapshot());
    const member = await read(snapshot({ id: "eric", kind: "human" }));
    expect(sauron.trades.stats.trades).toBe(1);
    expect(member.trades.stats.trades).toBe(0);
  });

  it("re-lists on every read from a store with no append-aware read", async () => {
    const memory = new InMemoryActivityStore();
    await memory.record(fill({ orderId: "b1" }));
    const { store, wholeReads } = counting(memory);
    const read = heldLedgerReader(store);
    await read(snapshot());
    await memory.record(
      fill({ orderId: "s1", side: "sell", price: 90, at: "2026-08-04T14:00:00Z" }),
    );
    expect((await read(snapshot())).trades.stats.netRealized).toBe(-100);
    expect(wholeReads()).toBe(2);
  });

  it("reaches the append-aware read through the publishing wrapper the server boots", async () => {
    const wrapped = publishingActivityStore(jsonl, new InMemoryActivityEventBus());
    expect(wrapped.since).toBeDefined();
    const { store, wholeReads } = counting(wrapped);
    const read = heldLedgerReader(store);
    await read(snapshot());
    await read(snapshot());
    expect(wholeReads()).toBe(1);
  });
});
