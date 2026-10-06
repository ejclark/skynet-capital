import { mkdtempSync, rmSync } from "node:fs";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type DecisionDb, openDecisionDb } from "../../src/autonomous/decision-db.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import { resolveDecisionReplication } from "../../src/autonomous/decision-replication-client.js";
import {
  DECISION_BATCH_KIND_V2,
  type DecisionBatch,
  parseDecisionBatch,
  storeDecisionBatch,
} from "../../src/autonomous/decision-wire.js";
import { parseOrderSettlement } from "../../src/autonomous/decision-wire-settlements.js";
import type { OrderSettlement } from "../../src/domain/order-settlement.js";
import { createInsightsListener } from "../../src/server/insights-listener.js";
import { anOptionIntent } from "../support/builders.js";

/**
 * Late settlements reach the dashboard's copy of the store (#4650). The decision itself crossed the
 * bridge long before its order ended, and the dashboard keeps the first copy of every record — so a
 * settlement rides the batch envelope on a field of its own, which a dashboard that predates it
 * simply ignores.
 */

const PUT = "CRWV261106P00085000";
const sold = { ...anOptionIntent(), clientOrderId: "sk1-sauron-CRWV-k9x2-0" };

const workingRecord: DecisionRecord = {
  at: Date.parse("2026-10-07T14:30:00.000Z"),
  personaId: "sauron",
  mode: "live",
  rawIntents: [anOptionIntent()],
  guardedIntents: [anOptionIntent()],
  outcomes: [
    {
      intent: sold,
      action: "placed",
      result: { intent: sold, status: "working", orderId: "opt-1" },
    },
  ],
};

const settlement: OrderSettlement = {
  orderId: "opt-1",
  clientOrderId: "sk1-sauron-CRWV-k9x2-0",
  status: "filled",
  filledQuantity: 1,
  filledPrice: 2.05,
  legs: [{ occSymbol: PUT, filledQuantity: 1, filledPrice: 2.05 }],
  settledAt: "2026-10-07T14:31:00.000Z",
};

/** A JSON round trip — what the bridge actually carries. */
const wire = <T>(value: T): unknown => JSON.parse(JSON.stringify(value));

describe("parseOrderSettlement", () => {
  it("reads a settlement back exactly as it was sent", () => {
    expect(parseOrderSettlement(wire(settlement))).toEqual(settlement);
  });

  it("refuses one missing what it is keyed or scored by, or carrying a leg it cannot read", () => {
    for (const bad of [
      { ...settlement, orderId: "" },
      { ...settlement, status: "working" },
      { ...settlement, settledAt: "yesterday" },
      { ...settlement, filledQuantity: -1 },
      { ...settlement, legs: [{ occSymbol: PUT }] },
      { ...settlement, legs: Array.from({ length: 5 }, () => settlement.legs?.[0]) },
      null,
      "opt-1",
    ]) {
      expect(parseOrderSettlement(wire(bad))).toBeUndefined();
    }
  });
});

describe("parseDecisionBatch — the settlements field", () => {
  const batch = { kind: DECISION_BATCH_KIND_V2, personaId: "sauron", records: [workingRecord] };

  it("carries the settlements riding a batch, dropping a malformed one alone", () => {
    const parsed = parseDecisionBatch(
      wire({ ...batch, settlements: [settlement, { orderId: "junk" }] }),
    );
    expect(parsed?.settlements).toEqual([settlement]);
    expect(parsed?.records).toHaveLength(1);
  });

  it("never changes which records a batch keeps — a dashboard reading only the records sees the same batch", () => {
    const without = parseDecisionBatch(wire(batch));
    for (const settlements of [[settlement], "garbage", [{ orderId: 7 }]]) {
      expect(parseDecisionBatch(wire({ ...batch, settlements }))?.records).toEqual(
        without?.records,
      );
    }
    expect(without).not.toHaveProperty("settlements");
  });
});

describe("a late fill reaching the dashboard's copy", () => {
  let dir: string;
  let botsDb: DecisionDb;
  let appDb: DecisionDb;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "decision-wire-settlements-"));
    botsDb = openDecisionDb(join(dir, "bots.db"));
    appDb = openDecisionDb(join(dir, "app.db"));
  });
  afterEach(() => {
    botsDb.close();
    appDb.close();
    rmSync(dir, { recursive: true, force: true });
  });

  /** The real listener, wired as the dashboard wires it, keeping every batch it accepted. */
  async function listening(
    db: DecisionDb,
  ): Promise<{ server: Server; url: string; batches: DecisionBatch[] }> {
    const batches: DecisionBatch[] = [];
    const server = createInsightsListener({
      record: () => Promise.resolve(),
      decisions: {
        recordBatch: (batch) => {
          batches.push(batch);
          storeDecisionBatch(db, batch);
        },
      },
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const { port } = server.address() as AddressInfo;
    return { server, url: `http://127.0.0.1:${port}`, batches };
  }

  it("WHEN the decision was replicated while working, the next poll's settlement makes it read as filled there", async () => {
    const bots = botsDb;
    const app = appDb;
    bots.record(workingRecord);
    const bridge = await listening(app);
    try {
      const client = resolveDecisionReplication(
        { SKYNET_INSIGHTS_BRIDGE_URL: bridge.url },
        () => bots,
      );
      await client.replicate({});
      expect(app.listByPersona("sauron")[0]?.outcomes[0]?.result?.status).toBe("working");

      bots.recordSettlements([settlement]);
      await client.replicate({});

      expect(app.listByPersona("sauron")[0]?.outcomes[0]?.result).toMatchObject({
        status: "filled",
        filledQuantity: 1,
        filledPrice: 2.05,
      });
      // Once per poll, on its first batch only — never once per persona or per leg.
      const carrying = bridge.batches.filter((b) => b.settlements !== undefined);
      expect(carrying.map((b) => b.settlements)).toEqual([[settlement]]);
      // And a resend on every later poll stores nothing twice.
      await client.replicate({});
      expect(app.recentSettlements()).toHaveLength(1);
    } finally {
      await new Promise<void>((resolve) => bridge.server.close(() => resolve()));
    }
  });
});
