import type { ServerResponse } from "node:http";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { OrderIntent } from "../../src/domain/types.js";
import type { TradeActivityRecord } from "../../src/observatory/activity-record.js";
import { serveContentApi } from "../../src/server/content-api-routes.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { serveDeskJson } from "../../src/server/desk-json-routes.js";
import { anOptionIntent } from "../support/builders.js";

/**
 * What the broker said about a bot's order (#4650 leftover, plan #4642) — "partial fill; remainder
 * canceled", a rejection's cause — is its owner's alone: a broker's message can name the account's
 * specifics. Every route that reads a bot's order carries it to the owner and withholds it from
 * anyone else, the way the playbook's name is withheld (#885, `desk-owner-gate.ts`): the pass log
 * (`/decisions`), Activity's why (`/activity`), the Thesis markers (`/thesis`) and the league Wire.
 */

const PUT = "CRWV261113P00085000";
const WORDS = "partial fill; remainder canceled";

const sold: OrderIntent = {
  ...anOptionIntent({
    quantity: 2,
    option: { legs: [{ occSymbol: PUT, side: "sell", ratio: 1 }] },
  }),
  clientOrderId: "sk1-sauron-CRWV-k9x2-0",
};

const pass: DecisionRecord = {
  at: Date.parse("2026-10-07T14:30:00.000Z"),
  personaId: "sauron",
  mode: "live",
  rawIntents: [sold],
  guardedIntents: [sold],
  outcomes: [
    {
      intent: sold,
      action: "placed",
      result: {
        intent: sold,
        status: "filled",
        orderId: "opt-1",
        filledQuantity: 1,
        filledPrice: 2.12,
        legFills: [{ occSymbol: PUT, filledQuantity: 1, filledPrice: 2.12 }],
        reason: WORDS,
      },
    },
  ],
};

const fill: TradeActivityRecord = {
  orderId: "opt-1",
  participantId: "sauron",
  symbol: PUT,
  side: "sell",
  quantity: 2,
  filledQuantity: 1,
  price: 2.12,
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

const config = {
  hub: { getState: () => ({ generatedAt: "t", participants: [sauron], collisions: [] }) },
  auth: {},
  resolveOwnerIds: (email: string) => (email === "owner@x" ? ["sauron"] : ["human-eric"]),
  readDecisions: () => Promise.resolve([pass]),
  readTradeActivity: async () => [fill],
  readAllTradeActivity: async () => [fill],
  findByOrderId: (orderId: string) =>
    orderId === "opt-1" ? { record: pass, intent: sold } : undefined,
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
  it("gives the owner the words on the pass log, Activity's why, the Thesis marker and the Wire", async () => {
    const decisions = JSON.parse(await desk("decisions", "owner@x"));
    expect(decisions.cycles[0].outcomes[0].brokerReason).toBe(WORDS);
    const activity = JSON.parse(await desk("activity", "owner@x"));
    expect(activity.activity[0].reasoning.brokerReason).toBe(WORDS);
    const thesis = JSON.parse(await desk("thesis", "owner@x"));
    expect(thesis.thesis.markers[0].reasoning.brokerReason).toBe(WORDS);
    const league = JSON.parse(await wire("owner@x"));
    expect(league.wire.trades[0].reasoning.brokerReason).toBe(WORDS);
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
    // The rest of the order still rides: the fill and the bot's own sentence.
    const decisions = JSON.parse(await desk("decisions", "guest@x"));
    expect(decisions.cycles[0].outcomes[0]).toMatchObject({
      action: "placed",
      resultStatus: "filled",
    });
    const activity = JSON.parse(await desk("activity", "guest@x"));
    expect(activity.activity[0].reasoning).toMatchObject({
      reason: sold.reason,
      personaId: "sauron",
    });
  });

  it("never attaches a working order's words to the why, which the row's own status outlives", async () => {
    const working: DecisionRecord = {
      ...pass,
      outcomes: [
        {
          intent: sold,
          action: "placed",
          result: {
            intent: sold,
            status: "working",
            orderId: "opt-1",
            reason: "cancel not confirmed — rechecked next cycle",
          },
        },
      ],
    };
    const { res, body } = capture();
    const path = "/api/desk/sauron/activity";
    await serveDeskJson(
      res,
      path,
      path,
      {
        ...config,
        findByOrderId: () => ({ record: working, intent: sold }),
      } as DashboardServerConfig,
      session("owner@x"),
    );
    expect(JSON.parse(body()).activity[0].reasoning).not.toHaveProperty("brokerReason");
  });
});
