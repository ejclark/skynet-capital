import type { ServerResponse } from "node:http";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { OrderIntent } from "../../src/domain/types.js";
import type { TradeActivityRecord } from "../../src/observatory/activity-record.js";
import { attachWireReasoning } from "../../src/observatory/wire-reasoning.js";
import { serveContentApi } from "../../src/server/content-api-routes.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { serveDeskJson } from "../../src/server/desk-json-routes.js";
import { anOptionIntent } from "../support/builders.js";

/**
 * What the broker said about a bot's order (#4650 leftover, plan #4642) — "limit $2.10 not reached
 * in 15s; canceled", a rejection's cause — is its owner's alone: a broker's message can name the
 * account's specifics. Every route that reads a bot's order carries it to the owner and withholds it
 * from anyone else, the way the playbook's name is withheld (#885, `desk-owner-gate.ts`): the pass
 * log (`/decisions`), Activity's why (`/activity`), the Thesis markers (`/thesis`) and the league
 * Wire. The words ride only on an order that never traded (`brokerWordsFor`), so the two surfaces
 * that list fills alone — the Wire and the Thesis markers — are gated, not shown.
 */

const PUT = "CRWV261113P00085000";
const WORDS = "limit $2.10 not reached in 15s; canceled";

const sold: OrderIntent = {
  ...anOptionIntent({ option: { legs: [{ occSymbol: PUT, side: "sell", ratio: 1 }] } }),
  clientOrderId: "sk1-sauron-CRWV-k9x2-0",
};

// An unfilled order is recorded as rejected downstream (`option-cycle.ts`'s `actionFor`).
const pass: DecisionRecord = {
  at: Date.parse("2026-10-07T14:30:00.000Z"),
  personaId: "sauron",
  mode: "live",
  rawIntents: [sold],
  guardedIntents: [sold],
  outcomes: [
    {
      intent: sold,
      action: "rejected",
      result: { intent: sold, status: "unfilled", orderId: "opt-1", reason: WORDS },
    },
  ],
};

const canceled: TradeActivityRecord = {
  orderId: "opt-1",
  participantId: "sauron",
  symbol: PUT,
  side: "sell",
  quantity: 1,
  filledQuantity: 0,
  status: "canceled",
  at: "2026-10-07T14:30:16.000Z",
  source: "stream",
};

const sauron = {
  id: "sauron",
  displayName: "Sauron",
  kind: "bot" as const,
  cash: 5_000,
  equity: 10_000,
  positions: [],
  activity: [],
};

const session = (email: string) => ({ email, provider: "google" as const, exp: 0 });

const findByOrderId = (orderId: string) =>
  orderId === "opt-1" ? { record: pass, intent: sold } : undefined;

const config = {
  hub: { getState: () => ({ generatedAt: "t", participants: [sauron], collisions: [] }) },
  auth: {},
  resolveOwnerIds: (email: string) => (email === "owner@x" ? ["sauron"] : ["human-eric"]),
  readDecisions: () => Promise.resolve([pass]),
  readTradeActivity: async () => [canceled],
  readAllTradeActivity: async () => [canceled],
  findByOrderId,
} as unknown as DashboardServerConfig;

function capture(): { res: ServerResponse; body: () => string } {
  let text = "";
  const res = {
    writeHead: () => res,
    end: (out?: string) => {
      text = out ?? "";
    },
  } as unknown as ServerResponse;
  return { res, body: () => text };
}

async function desk(sub: string, who?: string): Promise<string> {
  const { res, body } = capture();
  const path = `/api/desk/sauron/${sub}`;
  await serveDeskJson(res, path, path, config, who ? session(who) : undefined);
  return body();
}

async function wire(who?: string): Promise<string> {
  const { res, body } = capture();
  if (
    !(await serveContentApi(res, "/api/wire", "/api/wire", config, who ? session(who) : undefined))
  ) {
    throw new Error("/api/wire went unanswered");
  }
  return body();
}

describe("the broker's words on a bot's order are its owner's alone", () => {
  it("gives the owner the words on the pass log and Activity's why", async () => {
    const decisions = JSON.parse(await desk("decisions", "owner@x"));
    expect(decisions.cycles[0].outcomes[0].brokerReason).toBe(WORDS);
    const activity = JSON.parse(await desk("activity", "owner@x"));
    expect(activity.activity[0].reasoning.brokerReason).toBe(WORDS);
  });

  it("withholds them from a member who does not own the bot, and from a signed-out read", async () => {
    for (const who of ["guest@x", undefined]) {
      for (const sub of ["decisions", "activity", "thesis", "heartbeat"]) {
        const body = await desk(sub, who);
        expect(body).not.toContain(WORDS);
        expect(body).not.toContain("brokerReason");
      }
      expect(await wire(who)).not.toContain(WORDS);
    }
    // The rest of the order still rides: its result and the bot's own sentence.
    const decisions = JSON.parse(await desk("decisions", "guest@x"));
    expect(decisions.cycles[0].outcomes[0]).toMatchObject({
      action: "rejected",
      resultStatus: "unfilled",
      resultLabel: "limit not reached — canceled",
    });
    const activity = JSON.parse(await desk("activity", "guest@x"));
    expect(activity.activity[0].reasoning).toMatchObject({
      reason: sold.reason,
      personaId: "sauron",
    });
  });

  it("gates the Wire's why per account the same way", () => {
    const row = {
      participantId: "sauron",
      participantName: "Sauron",
      kind: "bot" as const,
      symbol: PUT,
      side: "sell" as const,
      quantity: 1,
      at: canceled.at,
      reconstructed: false,
      orderId: "opt-1",
    };
    const owned = attachWireReasoning([row], { findByOrderId, ownsAccount: () => true });
    expect(owned[0]?.reasoning?.brokerReason).toBe(WORDS);
    const other = attachWireReasoning([row], { findByOrderId, ownsAccount: () => false });
    expect(other[0]?.reasoning).not.toHaveProperty("brokerReason");
    expect(other[0]?.reasoning?.reason).toBe(sold.reason);
  });
});
