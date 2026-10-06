import { mkdtempSync, rmSync } from "node:fs";
import type { ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type DecisionDb, openDecisionDb } from "../../src/autonomous/decision-db.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { OrderIntent } from "../../src/domain/types.js";
import type { TradeActivityRecord } from "../../src/observatory/activity-record.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { serveDeskJson } from "../../src/server/desk-json-routes.js";
import { anOptionIntent } from "../support/builders.js";

/** `/api/desk/:id/activity` over the real decision store (#4650): a bot's spread and a sold put both
 *  recorded `working` — the broker's answer listed no legs, and neither cancel was confirmed — then
 *  filled after the wait. Once the settle loop reports them, Activity reads them as it would have
 *  had they filled in time: the spread as one row with its net and legs, the put with its dollars. */

const LOW = "NVDA261113C00185000";
const HIGH = "NVDA261113C00200000";
const PUT = "CRWV261106P00085000";

const spread = anOptionIntent({
  symbol: "NVDA",
  side: "buy",
  playbookId: "NVDA-CALL-SPREAD",
  option: {
    structure: "call-debit-spread",
    legs: [
      { occSymbol: LOW, side: "buy", ratio: 1 },
      { occSymbol: HIGH, side: "sell", ratio: 1 },
    ],
    limitPrice: 3.4,
  },
});
const put = anOptionIntent();

const working = (at: string, intent: OrderIntent, orderId: string): DecisionRecord => ({
  at: Date.parse(at),
  personaId: "sauron",
  mode: "live",
  rawIntents: [intent],
  guardedIntents: [intent],
  outcomes: [{ intent, action: "placed", result: { intent, status: "working", orderId } }],
});

const fill = (over: Partial<TradeActivityRecord>): TradeActivityRecord => ({
  orderId: "x",
  participantId: "sauron",
  symbol: LOW,
  side: "buy",
  quantity: 1,
  filledQuantity: 1,
  status: "filled",
  at: "2026-10-27T15:01:00.000Z",
  source: "stream",
  ...over,
});

const ledger = [
  fill({ orderId: "leg-low", symbol: LOW, side: "buy", price: 5.1 }),
  fill({ orderId: "leg-high", symbol: HIGH, side: "sell", price: 1.75 }),
  fill({ orderId: "opt-1", symbol: PUT, side: "sell", price: 2.05, at: "2026-10-27T14:31:00Z" }),
];

const bot = {
  id: "sauron",
  displayName: "Sauron",
  kind: "bot" as const,
  cash: 5_000,
  equity: 10_000,
  positions: [],
  activity: [],
};

type Row = {
  orderId: string;
  reasoning?: Record<string, unknown>;
  net?: string;
  legs?: { orderId: string }[];
};

async function activityOf(db: DecisionDb): Promise<Row[]> {
  let body = "";
  const res = {
    writeHead: () => res,
    end: (text?: string) => {
      body = text ?? "";
    },
  } as unknown as ServerResponse;
  const config = {
    hub: { getState: () => ({ generatedAt: "t", participants: [bot], collisions: [] }) },
    readTradeActivity: async () => ledger,
    findByOrderId: (id: string) => db.findByOrderId(id),
    findSpreadLeg: (id: string) => db.findSpreadLeg(id),
  } as unknown as DashboardServerConfig;
  await serveDeskJson(res, "/api/desk/sauron/activity", "/api/desk/sauron/activity", config);
  return JSON.parse(body).activity;
}

describe("Activity — orders that filled after the wait", () => {
  let dir: string;
  let db: DecisionDb;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "desk-activity-late-"));
    db = openDecisionDb(join(dir, "decisions.db"));
    db.record(working("2026-10-27T15:00:00.000Z", spread, "mleg-1"));
    db.record(working("2026-10-27T14:30:00.000Z", put, "opt-1"));
  });
  afterEach(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("before the settle loop reports them: the legs are loose fills and the put has no dollars", async () => {
    const activity = await activityOf(db);
    expect(activity.map((row) => row.orderId)).toEqual(["leg-high", "leg-low", "opt-1"]);
    expect(activity[2]?.reasoning).not.toHaveProperty("cost");
  });

  it("after: the spread is one row with its decision, net and legs; the put shows what it brought in", async () => {
    db.recordSettlements([
      {
        orderId: "mleg-1",
        status: "filled",
        filledQuantity: 1,
        filledPrice: 3.35,
        legs: [
          { occSymbol: LOW, orderId: "leg-low", filledQuantity: 1, filledPrice: 5.1 },
          { occSymbol: HIGH, orderId: "leg-high", filledQuantity: 1, filledPrice: 1.75 },
        ],
        settledAt: "2026-10-27T15:01:30.000Z",
      },
      {
        orderId: "opt-1",
        status: "filled",
        filledQuantity: 1,
        filledPrice: 2.05,
        legs: [{ occSymbol: PUT, filledQuantity: 1, filledPrice: 2.05 }],
        settledAt: "2026-10-27T14:31:30.000Z",
      },
    ]);

    const activity = await activityOf(db);
    expect(activity.map((row) => row.orderId)).toEqual(["mleg-1", "opt-1"]);
    const [spreadRow, putRow] = activity;
    expect(spreadRow?.reasoning).toMatchObject({ playbookId: "NVDA-CALL-SPREAD" });
    expect(spreadRow?.net).toBe("$335.00 paid");
    expect(spreadRow?.legs?.map((leg) => leg.orderId)).toEqual(["leg-low", "leg-high"]);
    expect(putRow?.reasoning).toMatchObject({
      playbookId: "CRWV-WHEEL",
      cost: "$205.00 received — 1 contract × 100 shares × $2.05",
    });
  });
});
