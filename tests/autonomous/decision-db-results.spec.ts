import { mkdtempSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { type DecisionDb, openDecisionDb } from "../../src/autonomous/decision-db.js";
import { RESULT_REASON_MAX } from "../../src/autonomous/decision-db-results.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import { resolveDecisionReplication } from "../../src/autonomous/decision-replication-client.js";
import { type DecisionBatch, storeDecisionBatch } from "../../src/autonomous/decision-wire.js";
import type { OrderIntent, OrderResult } from "../../src/domain/types.js";
import { createInsightsListener } from "../../src/server/insights-listener.js";
import { anOptionIntent } from "../support/builders.js";

/**
 * What the broker said about an order's result (#4650 leftover, plan #4642): the adapter's
 * `OrderResult.reason` — "limit $2.10 not reached in 15s; canceled", a rejection's cause. It used to
 * reach the console line only: the store rebuilt every result without it, so the replication sender
 * (which replays rows read back from SQLite) dropped it before the wire ever saw it. Kept now in a
 * side table on both copies of the store, and read back onto the result.
 */

const CANCELED = "limit $2.10 not reached in 15s; canceled";

const sold = { ...anOptionIntent(), clientOrderId: "sk1-sauron-CRWV-k9x2-0" };
const share: OrderIntent = {
  symbol: "NVDA",
  side: "buy",
  quantity: 4,
  type: "market",
  reason: "the pre-earnings run-up window opened",
};

function passWith(
  at: number,
  results: readonly [OrderIntent, Omit<OrderResult, "intent">][],
): DecisionRecord {
  return {
    at,
    personaId: "sauron",
    mode: "live",
    rawIntents: results.map(([intent]) => intent),
    guardedIntents: results.map(([intent]) => intent),
    outcomes: results.map(([intent, result]) => ({
      intent,
      action: "placed" as const,
      result: { intent, ...result },
    })),
  };
}

const AT = Date.parse("2026-10-07T14:30:00.000Z");
const canceledPut = passWith(AT, [
  [sold, { status: "unfilled", orderId: "opt-1", reason: CANCELED }],
  [share, { status: "rejected", orderId: "shr-1", reason: "order rejected" }],
]);

const resultOf = (db: DecisionDb, orderId: string): OrderResult | undefined =>
  db.findByOrderId(orderId)?.record.outcomes.find((o) => o.result?.orderId === orderId)?.result;

describe("DecisionDb — the broker's words on an order's result", () => {
  let dir: string;
  let db: DecisionDb;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "decision-db-results-"));
    db = openDecisionDb(join(dir, "decisions.db"));
  });
  afterEach(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("WHEN a result carries the broker's words, every read gives them back on that result", () => {
    db.record(canceledPut);
    expect(resultOf(db, "opt-1")).toMatchObject({ status: "unfilled", reason: CANCELED });
    expect(resultOf(db, "shr-1")).toMatchObject({ status: "rejected", reason: "order rejected" });
    const [listed] = db.listByPersona("sauron");
    expect(listed?.outcomes.map((o) => o.result?.reason)).toEqual([CANCELED, "order rejected"]);
    expect(db.listSince("sauron", 0)[0]?.outcomes[0]?.result?.reason).toBe(CANCELED);
  });

  it("WHEN a result carries no words, it reads back with none — never a placeholder", () => {
    db.record(passWith(AT, [[share, { status: "filled", orderId: "shr-2", filledQuantity: 4 }]]));
    expect(resultOf(db, "shr-2")).not.toHaveProperty("reason");
  });

  it("reads a decision stored before the words were kept exactly as it read then", () => {
    const path = join(dir, "decisions.db");
    db.record(canceledPut);
    const before = db.listByPersona("sauron");
    db.close();
    // The database an older build left: the same rows, and no table for the words at all.
    const older = new DatabaseSync(path);
    older.exec("DROP TABLE intent_results");
    older.close();
    db = openDecisionDb(path);
    const strip = (records: DecisionRecord[]) =>
      records.map((r) => ({
        ...r,
        outcomes: r.outcomes.map(({ result, ...o }) => {
          if (!result) return o;
          const { reason: _reason, ...rest } = result;
          return { ...o, result: rest };
        }),
      }));
    expect(db.listByPersona("sauron")).toEqual(strip(before));
    expect(resultOf(db, "opt-1")).not.toHaveProperty("reason");
  });

  it(`keeps at most ${RESULT_REASON_MAX} characters, cut with an ellipsis, and nothing for blank words`, () => {
    const exact = "x".repeat(RESULT_REASON_MAX);
    const long = `Error: 422 ${"{".repeat(2)}"message":"${"y".repeat(2000)}"}`;
    db.record(
      passWith(AT, [
        [share, { status: "rejected", orderId: "a", reason: long }],
        [
          { ...share, symbol: "AMD" },
          { status: "rejected", orderId: "b", reason: exact },
        ],
        [
          { ...share, symbol: "MSFT" },
          { status: "rejected", orderId: "c", reason: "   " },
        ],
        [
          { ...share, symbol: "AAPL" },
          { status: "rejected", orderId: "d", reason: "  order rejected " },
        ],
      ]),
    );
    const cut = resultOf(db, "a")?.reason ?? "";
    expect(Array.from(cut)).toHaveLength(RESULT_REASON_MAX);
    expect(cut).toBe(`${long.slice(0, RESULT_REASON_MAX - 1)}…`);
    expect(resultOf(db, "b")?.reason).toBe(exact);
    expect(resultOf(db, "c")).not.toHaveProperty("reason");
    expect(resultOf(db, "d")?.reason).toBe("order rejected");
  });

  it("WHEN a working order later settles, its result reads without the words the submit came back with", () => {
    db.record(
      passWith(AT, [
        [
          sold,
          {
            status: "working",
            orderId: "opt-2",
            reason: "cancel not confirmed — rechecked next cycle",
          },
        ],
      ]),
    );
    expect(resultOf(db, "opt-2")?.reason).toBe("cancel not confirmed — rechecked next cycle");
    db.recordSettlements([
      {
        orderId: "opt-2",
        status: "filled",
        filledQuantity: 1,
        filledPrice: 2.05,
        settledAt: "2026-10-07T14:31:00.000Z",
      },
    ]);
    expect(resultOf(db, "opt-2")).toMatchObject({ status: "filled", filledQuantity: 1 });
    expect(resultOf(db, "opt-2")).not.toHaveProperty("reason");
  });
});

describe("the broker's words reaching the dashboard's copy of the store", () => {
  let dir: string;
  let botsDb: DecisionDb;
  let appDb: DecisionDb;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "decision-db-results-wire-"));
    botsDb = openDecisionDb(join(dir, "bots.db"));
    appDb = openDecisionDb(join(dir, "app.db"));
  });
  afterEach(() => {
    botsDb.close();
    appDb.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("WHEN the bots store a result with words, the replication batch carries them and the dashboard's copy reads them back", async () => {
    const bots = botsDb;
    const app = appDb;
    bots.record(canceledPut);
    const batches: DecisionBatch[] = [];
    const server = createInsightsListener({
      record: () => Promise.resolve(),
      decisions: {
        recordBatch: (batch) => {
          batches.push(batch);
          storeDecisionBatch(app, batch);
        },
      },
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const { port } = server.address() as AddressInfo;
    try {
      const env = { SKYNET_INSIGHTS_BRIDGE_URL: `http://127.0.0.1:${port}` };
      await resolveDecisionReplication(env, () => bots).replicate({});
      // What crossed the bridge was read back out of the bots' SQLite, not the record in memory.
      expect(batches[0]?.records[0]?.outcomes.map((o) => o.result?.reason)).toEqual([
        CANCELED,
        "order rejected",
      ]);
      expect(resultOf(app, "opt-1")).toMatchObject({ status: "unfilled", reason: CANCELED });
      expect(resultOf(app, "shr-1")?.reason).toBe("order rejected");
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
