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
 * `/api/desk/:id/activity?symbol=&playbook=` over the real decision store (#4650, plan #4642): the
 * owner watches the trades a bot makes through each playbook it runs. The filter is decided on the
 * server before the page is cut, and a playbook filter is the owner's alone — anyone else's
 * `?playbook=` would name the bot's playbooks by inference (#885), so it is ignored for them.
 */

const LOW = "NVDA261113C00185000";
const HIGH = "NVDA261113C00200000";
const PUT = "CRWV261113P00085000";

const spread = anOptionIntent({
  symbol: "NVDA",
  side: "buy",
  playbookId: "NVDA-CALL-SPREAD",
  reason: "the options form of the pre-earnings run-up",
  option: {
    structure: "call-debit-spread",
    legs: [
      { occSymbol: LOW, side: "buy", ratio: 1 },
      { occSymbol: HIGH, side: "sell", ratio: 1 },
    ],
    limitPrice: 3.4,
  },
});
const put = anOptionIntent({ option: { legs: [{ occSymbol: PUT, side: "sell", ratio: 1 }] } });
const shares: OrderIntent = {
  symbol: "NVDA",
  side: "buy",
  quantity: 1,
  type: "market",
  playbookId: "S1-NVDA",
  reason: "a fade",
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
  fill({ orderId: "put-1", symbol: PUT, side: "sell", price: 2.1, at: "2026-10-27T14:00:00.000Z" }),
  fill({ orderId: "shr-1", price: 181.4, at: "2026-10-26T15:00:00.000Z" }),
  // An order no decision placed (a hand trade on the bot's account): no playbook.
  fill({ orderId: "hand-1", price: 180.2, at: "2026-10-25T15:00:00.000Z" }),
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

interface Page {
  activity: { orderId: string; symbol: string; reasoning?: Record<string, unknown> }[];
  nextCursor?: string;
  playbooks?: string[];
}

describe("narrowing a bot's Activity on the server", () => {
  let dir: string;
  let db: DecisionDb;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "desk-activity-filters-"));
    db = openDecisionDb(join(dir, "decisions.db"));
    db.record(record);
  });
  afterEach(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  const read = async (query: string, who = "owner@x"): Promise<{ page: Page; body: string }> => {
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
    const path = "/api/desk/sauron/activity";
    await serveDeskJson(res, path, `${path}${query}`, config, {
      email: who,
      provider: "google",
      exp: 0,
    });
    return { page: JSON.parse(body) as Page, body };
  };
  const ids = (page: Page) => page.activity.map((row) => row.orderId);

  it("narrows to one stock — the spread by its underlying, the share by its ticker", async () => {
    const { page } = await read("?symbol=nvda");
    expect(ids(page)).toEqual(["mleg-1", "shr-1", "hand-1"]);
    expect(page.activity[0]?.symbol).toBe("");
  });

  it("narrows the owner's copy to one playbook's orders", async () => {
    expect(ids((await read("?playbook=NVDA-CALL-SPREAD")).page)).toEqual(["mleg-1"]);
    expect(ids((await read("?playbook=CRWV-WHEEL")).page)).toEqual(["put-1"]);
    expect(ids((await read("?symbol=NVDA&playbook=S1-NVDA")).page)).toEqual(["shr-1"]);
  });

  it("gives the owner every playbook the ledger was placed under, for the chips", async () => {
    const { page } = await read("?symbol=CRWV");
    expect(page.playbooks).toEqual(["CRWV-WHEEL", "NVDA-CALL-SPREAD", "S1-NVDA"]);
  });

  it("ignores a non-owner's ?playbook= and returns the unfiltered page, naming no playbook", async () => {
    const { page, body } = await read("?playbook=NVDA-CALL-SPREAD", "guest@x");
    expect(ids(page)).toEqual(["mleg-1", "put-1", "shr-1", "hand-1"]);
    expect(page).not.toHaveProperty("playbooks");
    for (const name of ["NVDA-CALL-SPREAD", "CRWV-WHEEL", "S1-NVDA"]) {
      expect(body).not.toContain(name);
    }
    // A stock filter is no secret: it still narrows a non-owner's copy.
    expect(ids((await read("?symbol=CRWV", "guest@x")).page)).toEqual(["put-1"]);
  });

  it("continues a filtered list from the cursor the filtered page handed back", async () => {
    const first = (await read("?symbol=NVDA&per_page=2")).page;
    expect(ids(first)).toEqual(["mleg-1", "shr-1"]);
    expect(first.nextCursor).toBe("2026-10-26T15:00:00.000Z");
    const cursor = encodeURIComponent(first.nextCursor ?? "");
    const next = (await read(`?symbol=NVDA&per_page=2&before=${cursor}`)).page;
    expect(ids(next)).toEqual(["hand-1"]);
    expect(next).not.toHaveProperty("nextCursor");
  });
});
