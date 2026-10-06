import { mkdtempSync, rmSync } from "node:fs";
import type { ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type DecisionDb, openDecisionDb } from "../../src/autonomous/decision-db.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { TradeActivityRecord } from "../../src/observatory/activity-record.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { serveDeskJson } from "../../src/server/desk-json-routes.js";
import { anOptionIntent } from "../support/builders.js";

/** `/api/desk/:id/activity` over the real decision store (#4650): a bot's spread fills as two leg
 *  lines in the account's ledger; the bot's Activity shows ONE spread row carrying the decision that
 *  placed it — playbook and invalidator — with its net once and each leg beneath. The Thesis
 *  drawer's fill markers (`/thesis`) read the same ledger, so they fold the same way. */

const LOW = "NVDA261113C00185000";
const HIGH = "NVDA261113C00200000";
const INVALIDATOR =
  "NVDA's D-20→D-5 return ≤ 0 on 2 of the next 3 prints, or this spread exits below its cost";

const spread = anOptionIntent({
  symbol: "NVDA",
  side: "buy",
  playbookId: "NVDA-CALL-SPREAD",
  reason: "the options form of the pre-earnings run-up",
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
  fill({ orderId: "stray", symbol: "NVDA", price: 181.4, at: "2026-10-26T15:00:00.000Z" }),
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

async function deskPayload(
  sub: "activity" | "thesis",
  config: Partial<DashboardServerConfig>,
): Promise<Record<string, unknown>> {
  let body = "";
  const res = {
    writeHead: () => res,
    end: (text?: string) => {
      body = text ?? "";
    },
  } as unknown as ServerResponse;
  const full = {
    hub: { getState: () => ({ generatedAt: "t", participants: [bot], collisions: [] }) },
    readTradeActivity: async () => ledger,
    ...config,
  } as unknown as DashboardServerConfig;
  const path = `/api/desk/sauron/${sub}`;
  await serveDeskJson(res, path, path, full);
  return JSON.parse(body);
}

async function activityOf(config: Partial<DashboardServerConfig>): Promise<
  {
    orderId: string;
    reasoning?: Record<string, unknown>;
    net?: string;
    legs?: { orderId: string; cost?: string }[];
  }[]
> {
  return (await deskPayload("activity", config)).activity as never;
}

async function markersOf(
  config: Partial<DashboardServerConfig>,
): Promise<{ label: string; activityAnchor: string; reasoning?: Record<string, unknown> }[]> {
  const payload = await deskPayload("thesis", { readDecisions: async () => [record], ...config });
  return (payload.thesis as { markers: never }).markers;
}

describe("a bot's spread on its Activity", () => {
  let dir: string;
  let db: DecisionDb;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "desk-activity-spreads-"));
    db = openDecisionDb(join(dir, "decisions.db"));
    db.record(record);
  });
  afterEach(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("shows one spread row with the decision that placed it, its net once and each leg beneath", async () => {
    const activity = await activityOf({
      findByOrderId: (id) => db.findByOrderId(id),
      findSpreadLeg: (id) => db.findSpreadLeg(id),
    });
    expect(activity.map((row) => row.orderId)).toEqual(["mleg-1", "stray"]);
    const [row] = activity;
    expect(row?.reasoning).toMatchObject({
      playbookId: "NVDA-CALL-SPREAD",
      invalidator: INVALIDATOR,
      contract: "BUY 1 NVDA $185/$200 CALL SPREAD · 13 NOV 26 · limit $3.40 debit",
    });
    expect(row?.net).toBe("$335.00 paid");
    expect(row?.legs?.map((leg) => [leg.orderId, leg.cost])).toEqual([
      ["leg-low", "$510.00 paid — 1 contract × 100 shares × $5.10"],
      ["leg-high", "$175.00 received — 1 contract × 100 shares × $1.75"],
    ]);
    // The unrelated share fill is untouched: no decision, no legs.
    expect(activity[1]).not.toHaveProperty("reasoning");
    expect(activity[1]).not.toHaveProperty("legs");
  });

  it("renders the legs as the separate fills they always were when the store has no leg map", async () => {
    const activity = await activityOf({ findByOrderId: (id) => db.findByOrderId(id) });
    expect(activity.map((row) => row.orderId)).toEqual(["leg-high", "leg-low", "stray"]);
    expect(activity.some((row) => row.reasoning || row.legs)).toBe(false);
  });
});

describe("a bot's spread on its Thesis drawer", () => {
  let dir: string;
  let db: DecisionDb;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "desk-thesis-spreads-"));
    db = openDecisionDb(join(dir, "decisions.db"));
    db.record(record);
  });
  afterEach(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("marks the spread once, linked to its Activity row, with the decision that placed it", async () => {
    const markers = await markersOf({
      findByOrderId: (id) => db.findByOrderId(id),
      findSpreadLeg: (id) => db.findSpreadLeg(id),
    });
    expect(markers.map((m) => [m.label, m.activityAnchor])).toEqual([
      ["Buy 1 NVDA", "act-stray"],
      ["Buy 1 NVDA $185/$200 CALL SPREAD · 13 NOV 26", "act-mleg-1"],
    ]);
    expect(markers[1]?.reasoning).toMatchObject({
      playbookId: "NVDA-CALL-SPREAD",
      invalidator: INVALIDATOR,
    });
    expect(markers[0]).not.toHaveProperty("reasoning");
  });

  it("marks each leg as the separate fill it always was when the store has no leg map", async () => {
    const markers = await markersOf({ findByOrderId: (id) => db.findByOrderId(id) });
    expect(markers.map((m) => m.activityAnchor)).toEqual([
      "act-stray",
      "act-leg-low",
      "act-leg-high",
    ]);
    expect(markers.some((m) => m.reasoning)).toBe(false);
  });
});
