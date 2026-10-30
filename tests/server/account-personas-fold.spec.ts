import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type DecisionDb, openDecisionDb } from "../../src/autonomous/decision-db.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { OrderIntent, OrderResult } from "../../src/domain/types.js";
import type { ActivityStore, TradeActivityRecord } from "../../src/observatory/activity-record.js";
import { JsonlActivityStore } from "../../src/observatory/activity-store.js";
import { InMemoryActivityStore } from "../../src/observatory/in-memory-activity-store.js";
import { accountPersonasReader } from "../../src/server/account-personas-fold.js";
import { anOptionIntent } from "../support/builders.js";

/** Who trades on an account is kept per account and advanced by only what moved, and is always
 *  what a fresh whole read of the same ledger and decision store would return (#4619). */

const shares: OrderIntent = {
  symbol: "NVDA",
  side: "buy",
  quantity: 10,
  type: "market",
  reason: "test",
};

let at = 0;
/** One live pass by `personaId` that placed `intent` with `result`. */
const cycle = (
  personaId: string,
  intent: OrderIntent,
  result: Omit<OrderResult, "intent">,
): DecisionRecord => {
  at += 1;
  return {
    at,
    personaId,
    mode: "live",
    rawIntents: [intent],
    guardedIntents: [intent],
    outcomes: [{ intent, action: "placed", result: { intent, ...result } }],
  };
};
const placed = (personaId: string, orderId: string) =>
  cycle(personaId, shares, { status: "filled", orderId });
/** A pass that looked and placed nothing — what every bot writes every 15 s. */
const observed = (personaId: string): DecisionRecord => {
  at += 1;
  return {
    at,
    personaId,
    mode: "live",
    rawIntents: [shares],
    guardedIntents: [],
    outcomes: [{ intent: shares, action: "observed" }],
  };
};

const fill = (orderId: string): TradeActivityRecord => ({
  participantId: "sauron",
  orderId,
  symbol: "NVDA",
  side: "buy",
  quantity: 10,
  filledQuantity: 10,
  status: "filled",
  price: 100,
  at: "2026-08-03T14:00:00Z",
  source: "stream",
});

describe("accountPersonasReader", () => {
  let dir: string;
  let ledger: JsonlActivityStore;
  let db: DecisionDb;
  let wholeReads: number;
  let asked: string[][];

  /** The ledger, counting reads from byte 0 — the whole-ledger read this fold exists to avoid. */
  const counted = (): ActivityStore => ({
    record: (e) => ledger.record(e),
    list: (id) => ledger.list(id),
    latest: (id) => ledger.latest(id),
    since: (id, offset) => {
      if (offset === 0) wholeReads += 1;
      return ledger.since(id, offset);
    },
  });
  const deps = () => ({
    personasOfOrders: (ids: readonly string[]) => {
      asked.push([...ids]);
      return db.personasOfOrders(ids);
    },
    orderJoinMark: () => db.orderJoinMark(),
  });
  /** What the Decisions tab computed on every open before this fold. */
  const fresh = async () =>
    db.personasOfOrders([...new Set((await ledger.list("sauron")).map((t) => t.orderId))]).sort();

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "account-personas-"));
    ledger = new JsonlActivityStore(join(dir, "activity"));
    db = openDecisionDb(join(dir, "decisions.db"));
    wholeReads = 0;
    asked = [];
    db.record(placed("sauron", "s-1"));
    await ledger.record(fill("s-1"));
  });

  afterEach(async () => {
    db.close();
    await rm(dir, { recursive: true, force: true });
  });

  it("WHEN neither the ledger nor a joinable decision moved, it answers without reading or asking", async () => {
    const read = accountPersonasReader(counted(), deps());
    expect(await read("sauron")).toEqual(["sauron"]);
    db.record(observed("sauron"));
    db.record(observed("beta-scout"));

    expect(await read("sauron")).toEqual(["sauron"]);
    expect(wholeReads).toBe(1);
    expect(asked).toHaveLength(1);
  });

  it("WHEN another persona's fill is appended, only the new order is asked about and that persona joins", async () => {
    const read = accountPersonasReader(counted(), deps());
    await read("sauron");
    db.record(placed("beta-scout", "b-1"));
    // The mark moved too, so this read asks about every held id; the next append is the narrow one.
    await ledger.record(fill("b-1"));
    expect([...(await read("sauron"))].sort()).toEqual(await fresh());

    await ledger.record(fill("s-2"));
    expect([...(await read("sauron"))].sort()).toEqual(["beta-scout", "sauron"]);
    expect(asked.at(-1)).toEqual(["s-2"]);
    expect(wholeReads).toBe(1);
  });

  it("WHEN a decision replicates after its fill is already on the ledger, the next read names its persona", async () => {
    await ledger.record(fill("b-late"));
    const read = accountPersonasReader(counted(), deps());
    expect(await read("sauron")).toEqual(["sauron"]);

    db.record(placed("beta-scout", "b-late"));

    expect([...(await read("sauron"))].sort()).toEqual(["beta-scout", "sauron"]);
    expect(wholeReads).toBe(1);
  });

  it("WHEN an option order recorded without an id settles later, its settlement names the persona", async () => {
    const put = { ...anOptionIntent(), clientOrderId: "sk1-beta-put" };
    db.record(cycle("beta-scout", put, { status: "working", reason: "cancel not confirmed" }));
    await ledger.record(fill("opt-1"));
    const read = accountPersonasReader(counted(), deps());
    expect(await read("sauron")).toEqual(["sauron"]);

    db.recordSettlements([
      {
        orderId: "opt-1",
        clientOrderId: "sk1-beta-put",
        status: "filled",
        filledQuantity: 1,
        filledPrice: 2.05,
        legs: [],
        settledAt: "2026-10-07T14:31:00.000Z",
      },
    ]);

    expect([...(await read("sauron"))].sort()).toEqual(["beta-scout", "sauron"]);
    expect(await fresh()).toEqual(["beta-scout", "sauron"]);
  });

  it("WHEN the ledger file is replaced by a shorter one, it starts over from what the file now holds", async () => {
    db.record(placed("beta-scout", "b-1"));
    await ledger.record(fill("b-1"));
    const read = accountPersonasReader(counted(), deps());
    expect([...(await read("sauron"))].sort()).toEqual(["beta-scout", "sauron"]);

    await writeFile(join(dir, "activity", "sauron.jsonl"), `${JSON.stringify(fill("s-1"))}\n`);

    expect(await read("sauron")).toEqual(await fresh());
    expect(await read("sauron")).toEqual(["sauron"]);
  });

  it("WHEN the store cannot read a tail (offline's in-memory one), it reads the whole ledger each time", async () => {
    const memory = new InMemoryActivityStore();
    await memory.record(fill("b-1"));
    db.record(placed("beta-scout", "b-1"));
    const read = accountPersonasReader(memory, deps());

    expect(await read("sauron")).toEqual(["beta-scout"]);
    expect(await read("sauron")).toEqual(["beta-scout"]);
    expect(asked).toHaveLength(2);
  });
});

describe("DecisionDb.orderJoinMark", () => {
  let dir: string;
  let db: DecisionDb;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "order-join-mark-"));
    db = openDecisionDb(join(dir, "decisions.db"));
  });
  afterEach(async () => {
    db.close();
    await rm(dir, { recursive: true, force: true });
  });

  it("stays put across passes that placed nothing, and moves on a placed order and on a settlement", () => {
    const empty = db.orderJoinMark();
    db.record(observed("sauron"));
    expect(db.orderJoinMark()).toBe(empty);

    db.record(placed("sauron", "s-1"));
    const afterPlaced = db.orderJoinMark();
    expect(afterPlaced).not.toBe(empty);

    const put = { ...anOptionIntent(), clientOrderId: "sk1-put" };
    db.record(cycle("sauron", put, { status: "working", reason: "cancel not confirmed" }));
    const afterWorking = db.orderJoinMark();
    expect(afterWorking).not.toBe(afterPlaced);

    db.recordSettlements([
      {
        orderId: "opt-1",
        clientOrderId: "sk1-put",
        status: "filled",
        filledQuantity: 1,
        filledPrice: 2.05,
        legs: [],
        settledAt: "2026-10-07T14:31:00.000Z",
      },
    ]);
    expect(db.orderJoinMark()).not.toBe(afterWorking);
  });
});
