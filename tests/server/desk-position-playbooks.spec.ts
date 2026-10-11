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

/**
 * `/api/desk/:id` names the playbook that opened each position (#5073 slice 4b — #5037 round 2,
 * R2-pos), over the real decision store: the owner's copy only (#885), and only when one playbook's
 * orders account for the whole position.
 */

const LOW = "NVDA261113C00185000";
const HIGH = "NVDA261113C00200000";
const PUT = "CRWV261113P00080000";

const spread = anOptionIntent({
  symbol: "NVDA",
  side: "buy",
  playbookId: "NVDA-CALL-SPREAD",
  playbookMode: "conservative",
  option: {
    structure: "call-debit-spread",
    legs: [
      { occSymbol: LOW, side: "buy", ratio: 1 },
      { occSymbol: HIGH, side: "sell", ratio: 1 },
    ],
    limitPrice: 3.4,
  },
});
const put = anOptionIntent({
  playbookId: "CRWV-WHEEL",
  playbookMode: "aggressive",
  option: { legs: [{ occSymbol: PUT, side: "sell", ratio: 1 }] },
});
const shares: OrderIntent = {
  symbol: "NVDA",
  side: "buy",
  quantity: 1,
  type: "market",
  playbookId: "S1-NVDA",
  reason: "the pre-print run-up",
};

const placed = (intent: OrderIntent, orderId: string, extra: object = {}) => ({
  intent,
  action: "placed" as const,
  result: { intent, status: "filled" as const, orderId, filledQuantity: 1, ...extra },
});

const record: DecisionRecord = {
  at: Date.parse("2026-10-27T15:00:00.000Z"),
  personaId: "sauron",
  mode: "live",
  rawIntents: [spread, put, shares],
  guardedIntents: [spread, put, shares],
  outcomes: [
    placed(spread, "mleg-1", {
      legOrders: [
        { occSymbol: LOW, orderId: "leg-low" },
        { occSymbol: HIGH, orderId: "leg-high" },
      ],
    }),
    placed(put, "put-1"),
    placed(shares, "shr-1"),
  ],
};

const fill = (over: Partial<TradeActivityRecord>): TradeActivityRecord => ({
  orderId: "x",
  participantId: "sauron",
  symbol: "NVDA",
  side: "buy",
  quantity: 1,
  filledQuantity: 1,
  status: "filled",
  at: "2026-10-27T15:00:05.000Z",
  source: "stream",
  ...over,
});

const ledger = [
  fill({ orderId: "leg-low", symbol: LOW, price: 5.1 }),
  fill({ orderId: "leg-high", symbol: HIGH, side: "sell", price: 1.75 }),
  fill({ orderId: "put-1", symbol: PUT, side: "sell", price: 2.55 }),
  fill({ orderId: "shr-1", price: 181.4, at: "2026-10-26T15:00:00.000Z" }),
  // A share no decision placed (a hand trade on the bot's account): the NVDA holding is then
  // half S1-NVDA's and half nobody's, so it names no playbook.
  fill({ orderId: "hand-1", price: 180.2, at: "2026-10-25T15:00:00.000Z" }),
];

const bot = {
  id: "sauron",
  displayName: "Sauron",
  kind: "bot" as const,
  cash: 5_000,
  equity: 10_000,
  positions: [
    { symbol: "NVDA", quantity: 2, avgPrice: 180.8, marketValue: 364 },
    { symbol: LOW, quantity: 1, avgPrice: 510, marketValue: 600 },
    { symbol: HIGH, quantity: -1, avgPrice: 175, marketValue: -220 },
    { symbol: PUT, quantity: -1, avgPrice: 255, marketValue: -550 },
  ],
  activity: [],
};

interface Desk {
  desk: { positions: { symbol: string; playbookId?: string; playbookMode?: string }[] };
}

describe("a bot's positions name the playbook that opened them", () => {
  let dir: string;
  let db: DecisionDb;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "desk-position-playbooks-"));
    db = openDecisionDb(join(dir, "decisions.db"));
    db.record(record);
  });
  afterEach(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  const read = async (who: string): Promise<Desk> => {
    let body = "";
    const res = {
      writeHead: () => res,
      end: (text?: string) => {
        body = text ?? "";
      },
    } as unknown as ServerResponse;
    const config = {
      hub: { getState: () => ({ generatedAt: "t", participants: [bot], collisions: [] }) },
      auth: {} as never,
      resolveOwnerIds: (email: string) => (email === "owner@x" ? ["sauron"] : ["human-eric"]),
      readTradeActivity: async () => ledger,
      findByOrderId: (id: string) => db.findByOrderId(id),
      findSpreadLeg: (id: string) => db.findSpreadLeg(id),
    } as unknown as DashboardServerConfig;
    await serveDeskJson(res, "/api/desk/sauron", "/api/desk/sauron", config, {
      email: who,
      provider: "google",
      exp: 0,
    });
    return JSON.parse(body) as Desk;
  };
  const tagOf = (desk: Desk["desk"], symbol: string) => {
    const p = desk.positions.find((row) => row.symbol === symbol);
    return { playbookId: p?.playbookId, playbookMode: p?.playbookMode };
  };

  it("names the written put's playbook and the mode it ran in, for the owner", async () => {
    const { desk } = await read("owner@x");
    expect(tagOf(desk, PUT)).toEqual({ playbookId: "CRWV-WHEEL", playbookMode: "aggressive" });
  });

  it("names a spread's playbook on each of its legs — the long one and the written one", async () => {
    const { desk } = await read("owner@x");
    expect(tagOf(desk, LOW).playbookId).toBe("NVDA-CALL-SPREAD");
    expect(tagOf(desk, HIGH).playbookId).toBe("NVDA-CALL-SPREAD");
  });

  it("names nothing on a holding a playbook opened only part of", async () => {
    const { desk } = await read("owner@x");
    expect(tagOf(desk, "NVDA")).toEqual({ playbookId: undefined, playbookMode: undefined });
  });

  // The house's playbook ideas (`considerations`) are public catalogue entries and may name
  // S1-NVDA for anyone; only the positions must not say which ones this bot runs.
  it("names no playbook on any position of a non-owner's copy", async () => {
    const { desk } = await read("guest@x");
    const rows = JSON.stringify(desk.positions);
    for (const name of ["NVDA-CALL-SPREAD", "CRWV-WHEEL", "S1-NVDA", "playbook"]) {
      expect(rows).not.toContain(name);
    }
  });
});
