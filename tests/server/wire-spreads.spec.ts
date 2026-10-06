import { mkdtempSync, rmSync } from "node:fs";
import type { ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type DecisionDb, openDecisionDb } from "../../src/autonomous/decision-db.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { TradeActivityRecord } from "../../src/observatory/activity-record.js";
import { serveWireJson, type WireRouteDeps } from "../../src/server/wire-routes.js";
import { anOptionIntent } from "../support/builders.js";

/** `/api/wire` over the real decision store (#4650): a bot's spread fills as two leg lines, each
 *  under its leg's own order id. The league Wire lists it as ONE row — the spread in words, whole
 *  spreads, its net per share and its net cash once — and the why joins, because the row carries
 *  the spread's own order id. An option contract reads in words, as the account's Activity says it. */

const LOW = "NVDA261113C00185000";
const HIGH = "NVDA261113C00200000";
const PUT = "CRWV261106P00085000";
const INVALIDATOR =
  "NVDA's D-20→D-5 return ≤ 0 on 2 of the next 3 prints, or this spread exits below its cost";

const spread = anOptionIntent({
  symbol: "NVDA",
  side: "buy",
  playbookId: "NVDA-CALL-SPREAD",
  reason: "the options form of S1-NVDA's pre-earnings run-up",
  forecast: { direction: "up", invalidator: INVALIDATOR },
  option: {
    structure: "call-debit-spread",
    legs: [
      { occSymbol: LOW, side: "buy", ratio: 1 },
      { occSymbol: HIGH, side: "sell", ratio: 1 },
    ],
    limitPrice: 3.4,
  },
});

const record: DecisionRecord = {
  at: Date.parse("2026-10-27T15:00:00.000Z"),
  personaId: "sauron",
  mode: "live",
  rawIntents: [spread],
  guardedIntents: [spread],
  outcomes: [
    {
      intent: spread,
      action: "placed",
      result: {
        intent: spread,
        status: "filled",
        orderId: "mleg-1",
        filledQuantity: 1,
        filledPrice: 3.35,
        legFills: [
          { occSymbol: LOW, filledQuantity: 1, filledPrice: 5.1 },
          { occSymbol: HIGH, filledQuantity: 1, filledPrice: 1.75 },
        ],
        legOrders: [
          { occSymbol: LOW, orderId: "leg-low" },
          { occSymbol: HIGH, orderId: "leg-high" },
        ],
      },
    },
  ],
};

const fill = (over: Partial<TradeActivityRecord>): TradeActivityRecord => ({
  orderId: "x",
  participantId: "sauron",
  symbol: LOW,
  side: "buy",
  quantity: 1,
  filledQuantity: 1,
  status: "filled",
  at: "2026-10-27T15:00:05.000Z",
  source: "stream",
  ...over,
});

const ledger = [
  fill({ orderId: "leg-low", symbol: LOW, side: "buy", price: 5.1 }),
  fill({
    orderId: "leg-high",
    symbol: HIGH,
    side: "sell",
    price: 1.75,
    at: "2026-10-27T15:00:06.000Z",
  }),
  // A member's own put, sold by hand — no decision, but still a contract in words.
  fill({
    orderId: "put-1",
    participantId: "eric",
    symbol: PUT,
    side: "sell",
    price: 2.12,
    at: "2026-10-27T14:00:00.000Z",
  }),
  fill({ orderId: "stray", symbol: "NVDA", price: 181.4, at: "2026-10-26T15:00:00.000Z" }),
];

const participants = [
  { id: "sauron", displayName: "Sauron", kind: "bot" as const, cash: 0, equity: 0, positions: [] },
  { id: "eric", displayName: "Eric", kind: "human" as const, cash: 0, equity: 0, positions: [] },
];

interface WireRow {
  symbol: string;
  display?: string;
  side: string;
  quantity: number;
  price: string;
  net?: string;
  reasoning?: Record<string, unknown>;
}

async function wireTrades(config: Partial<WireRouteDeps>): Promise<WireRow[]> {
  let body = "";
  const res = {
    writeHead: () => res,
    end: (text?: string) => {
      body = text ?? "";
    },
  } as unknown as ServerResponse;
  const full = {
    hub: { getState: () => ({ generatedAt: "t", participants, collisions: [] }) },
    readAllTradeActivity: async () => ledger,
    ...config,
  } as unknown as WireRouteDeps;
  await serveWireJson(res, "/api/wire", full, false, () => true);
  return JSON.parse(body).wire.trades;
}

describe("a bot's spread on the league Wire", () => {
  let dir: string;
  let db: DecisionDb;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "wire-spreads-"));
    db = openDecisionDb(join(dir, "decisions.db"));
    db.record(record);
  });
  afterEach(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("lists the spread once, in words, at its net, with the decision that placed it", async () => {
    const trades = await wireTrades({
      findByOrderId: (id) => db.findByOrderId(id),
      findSpreadLeg: (id) => db.findSpreadLeg(id),
    });
    expect(trades).toHaveLength(3);
    const [row] = trades;
    expect(row).toMatchObject({
      symbol: "",
      display: "NVDA $185/$200 CALL SPREAD · 13 NOV 26",
      side: "buy",
      quantity: 1,
      price: "$3.35",
      net: "$335.00 paid",
    });
    expect(row?.reasoning).toMatchObject({
      reason: "the options form of S1-NVDA's pre-earnings run-up",
      invalidator: INVALIDATOR,
      contract: "BUY 1 NVDA $185/$200 CALL SPREAD · 13 NOV 26 · limit $3.40 debit",
    });
  });

  it("names a single contract in words and a share by its ticker, neither carrying a net", async () => {
    const trades = await wireTrades({
      findByOrderId: (id) => db.findByOrderId(id),
      findSpreadLeg: (id) => db.findSpreadLeg(id),
    });
    expect(trades.slice(1).map((t) => [t.symbol, t.display, t.price])).toEqual([
      [PUT, "CRWV $85 PUT · 6 NOV 26", "$2.12"],
      ["NVDA", "NVDA", "$181.40"],
    ]);
    expect(trades.slice(1).some((t) => t.net !== undefined)).toBe(false);
  });

  it("lists the legs as the separate fills they always were when the store has no leg map", async () => {
    const trades = await wireTrades({ findByOrderId: (id) => db.findByOrderId(id) });
    expect(trades.map((t) => t.symbol)).toEqual([HIGH, LOW, PUT, "NVDA"]);
    expect(trades.some((t) => t.reasoning)).toBe(false);
  });
});
