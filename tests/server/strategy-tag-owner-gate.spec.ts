import type { ServerResponse } from "node:http";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { OrderIntent } from "../../src/domain/types.js";
import type { TradeActivityRecord } from "../../src/observatory/activity-record.js";
import { serveContentApi } from "../../src/server/content-api-routes.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { serveDeskJson } from "../../src/server/desk-json-routes.js";
import { anOptionIntent } from "../support/builders.js";

/**
 * #4971: a bot's strategy tag is a playbook's own slug (`crwv-wheel-put`), so it names the playbook
 * #885 withholds ("we do not show what playbooks others are using") as plainly as the playbook id
 * does. Every route that hands a non-owner a bot's decision — Activity's why, the pass log's
 * outcomes and refused ideas, the Thesis markers and the league Wire — strips it server-side; the
 * owner keeps it. The order's own words (the why, the expectation) still ride for everyone.
 */

const PUT = "CRWV261113P00085000";
const TAG = "crwv-wheel-put";

const sold: OrderIntent = {
  ...anOptionIntent({
    option: { legs: [{ occSymbol: PUT, side: "sell", ratio: 1 }] },
  }),
  strategy: TAG,
  expectation: "CRWV stays above $80 into expiry",
  clientOrderId: "sk1-sauron-CRWV-k9x2-0",
};

// A second idea the same pass raised and the guards refused outright — the pass log lists it too.
const refused: OrderIntent = {
  ...anOptionIntent({
    option: { legs: [{ occSymbol: PUT, side: "sell", ratio: 1 }] },
  }),
  quantity: 5,
  strategy: TAG,
  reason: "a second put at the same strike",
};

const pass: DecisionRecord = {
  at: Date.parse("2026-10-07T14:30:00.000Z"),
  personaId: "sauron",
  mode: "live",
  rawIntents: [sold, refused],
  guardedIntents: [sold],
  refusals: [{ intent: refused, reason: "put-not-secured" }],
  outcomes: [
    {
      intent: sold,
      action: "placed",
      result: {
        intent: sold,
        status: "filled",
        orderId: "opt-1",
        filledQuantity: 1,
        filledPrice: 2.1,
      },
    },
  ],
};

const fill: TradeActivityRecord = {
  orderId: "opt-1",
  participantId: "sauron",
  symbol: PUT,
  side: "sell",
  quantity: 1,
  filledQuantity: 1,
  price: 2.1,
  status: "filled",
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

const session = (email: string) => ({
  email,
  provider: "google" as const,
  exp: 0,
});

const config = {
  hub: {
    getState: () => ({
      generatedAt: "t",
      participants: [sauron],
      collisions: [],
    }),
  },
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

describe("a bot's strategy tag is its owner's alone (#4971)", () => {
  it("gives the owner the tag on Activity's why, the pass log, the Thesis markers and the Wire", async () => {
    const activity = JSON.parse(await desk("activity", "owner@x"));
    expect(activity.activity[0].reasoning.strategy).toBe(TAG);
    const decisions = JSON.parse(await desk("decisions", "owner@x"));
    expect(decisions.cycles[0].outcomes[0].strategy).toBe(TAG);
    expect(decisions.cycles[0].refusedIntents[0].strategy).toBe(TAG);
    const thesis = JSON.parse(await desk("thesis", "owner@x"));
    expect(thesis.thesis.markers[0].reasoning.strategy).toBe(TAG);
    expect(await wire("owner@x")).toContain(TAG);
  });

  it("withholds it from a member who does not own the bot, and from a signed-out read", async () => {
    for (const who of ["guest@x", undefined]) {
      for (const sub of ["activity", "decisions", "thesis", "heartbeat"]) {
        const body = await desk(sub, who);
        expect(body).not.toContain(TAG);
        expect(body).not.toContain('"strategy"');
      }
      expect(await wire(who)).not.toContain(TAG);
    }
  });

  it.each(["guest@x", undefined])(
    "keeps the order's own words for a non-owner (%s) — only the tag goes",
    async (who) => {
      const activity = JSON.parse(await desk("activity", who));
      expect(activity.activity[0].reasoning).toMatchObject({
        reason: sold.reason,
        expectation: sold.expectation,
        personaId: "sauron",
      });
      const decisions = JSON.parse(await desk("decisions", who));
      expect(decisions.cycles[0].outcomes[0]).toMatchObject({
        reason: sold.reason,
        action: "placed",
      });
      expect(decisions.cycles[0].refusedIntents[0]).toMatchObject({
        reason: refused.reason,
        guardReason: "not enough free cash to secure the sold put",
      });
      const thesis = JSON.parse(await desk("thesis", who));
      expect(thesis.thesis.markers[0].reasoning.reason).toBe(sold.reason);
    },
  );
});
