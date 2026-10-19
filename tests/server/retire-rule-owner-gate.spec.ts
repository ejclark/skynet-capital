import type { ServerResponse } from "node:http";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { OrderIntent } from "../../src/domain/types.js";
import type { TradeActivityRecord } from "../../src/observatory/activity-record.js";
import { serveContentApi } from "../../src/server/content-api-routes.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { serveDeskJson } from "../../src/server/desk-json-routes.js";
import { anOptionIntent } from "../support/builders.js";

/**
 * #5043: a wheel order's "Proves it wrong" line used to end with the playbook's own retire rule
 * ("…; the play retires if its net P/L is below 0 on 2027-01-29 …"), and every gate kept the
 * invalidator, so a member who does not own the bot read the playbook's falsifier on Activity, the
 * pass log, the Thesis markers and the Wire. The retire rule now rides its own field
 * (`forecast.retireRule`) that every non-owner strip removes beside the strategy tag (#4971); the
 * order's own falsifier stays everyone's, and the owner keeps both.
 */

const PUT = "CRWV261113P00085000";
const INVALIDATOR = "CRWV settles below $80 on 2026-11-06 — the bot buys 100 shares at $80";
const RETIRE =
  "The playbook retires if its net P/L is below 0 on 2027-01-29 or more than 1 in 3 sold puts finish " +
  "in the money.";

function soldWith(forecast: OrderIntent["forecast"]): OrderIntent {
  return {
    ...anOptionIntent({
      option: { legs: [{ occSymbol: PUT, side: "sell", ratio: 1 }] },
    }),
    strategy: "crwv-wheel-put",
    playbookId: "CRWV-WHEEL",
    playbookMode: "standard",
    expectation: "CRWV stays above $80 into expiry",
    forecast,
    clientOrderId: "sk1-sauron-CRWV-k9x2-0",
  };
}

function passFor(sold: OrderIntent): DecisionRecord {
  return {
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
          filledPrice: 2.1,
        },
      },
    ],
  };
}

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

function configFor(sold: OrderIntent): DashboardServerConfig {
  const pass = passFor(sold);
  return {
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
}

const config = configFor(
  soldWith({ direction: "up", invalidator: INVALIDATOR, retireRule: RETIRE }),
);

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

async function desk(sub: string, who?: string, world = config): Promise<string> {
  const { res, body } = capture();
  const path = `/api/desk/sauron/${sub}`;
  await serveDeskJson(res, path, path, world, who ? session(who) : undefined);
  return body();
}

async function wire(who?: string, world = config): Promise<string> {
  const { res, body } = capture();
  if (
    !(await serveContentApi(res, "/api/wire", "/api/wire", world, who ? session(who) : undefined))
  ) {
    throw new Error("/api/wire went unanswered");
  }
  return body();
}

describe("a playbook's retire rule is its owner's alone (#5043)", () => {
  it("gives the owner the retire rule on Activity's why, the pass log, the Thesis markers and the Wire", async () => {
    const activity = JSON.parse(await desk("activity", "owner@x"));
    expect(activity.activity[0].reasoning.retireRule).toBe(RETIRE);
    const decisions = JSON.parse(await desk("decisions", "owner@x"));
    expect(decisions.cycles[0].outcomes[0].forecast.retireRule).toBe(RETIRE);
    const thesis = JSON.parse(await desk("thesis", "owner@x"));
    expect(thesis.thesis.markers[0].reasoning.retireRule).toBe(RETIRE);
    expect(await wire("owner@x")).toContain("retires if");
  });

  it("withholds it from a member who does not own the bot, and from a signed-out read", async () => {
    for (const who of ["guest@x", undefined]) {
      for (const sub of ["activity", "decisions", "thesis", "heartbeat"]) {
        const body = await desk(sub, who);
        expect(body).not.toContain("retires if");
        expect(body).not.toContain('"retireRule"');
      }
      expect(await wire(who)).not.toContain("retires if");
    }
  });

  it.each(["guest@x", undefined])(
    "keeps the order's own falsifier for a non-owner (%s) — only the retire rule goes",
    async (who) => {
      const activity = JSON.parse(await desk("activity", who));
      expect(activity.activity[0].reasoning.invalidator).toBe(INVALIDATOR);
      const decisions = JSON.parse(await desk("decisions", who));
      expect(decisions.cycles[0].outcomes[0].forecast).toEqual({
        direction: "up",
        invalidator: INVALIDATOR,
      });
      const thesis = JSON.parse(await desk("thesis", who));
      expect(thesis.thesis.markers[0].reasoning.invalidator).toBe(INVALIDATOR);
    },
  );

  // Wheel orders stored before this fix (CRWV-WHEEL live since 2026-10-05) still carry the rule
  // inside the invalidator, as "the wheel buys …; the play retires if …". The read-time walk cuts
  // it for a non-owner (`withoutLegacyRetireRule`); the stored row and the owner's copy keep it.
  const LEGACY =
    "CRWV settles below $80 on 2026-11-06 — the wheel buys 100 shares at $80; the play retires if " +
    "its net P/L is below 0 on 2027-01-29 or more than 1 in 3 sold puts finish in the money";
  const legacy = configFor(soldWith({ direction: "up", invalidator: LEGACY }));

  it.each(["guest@x", undefined])(
    "cuts a stored wheel order's old retire rule out of a non-owner's (%s) invalidator",
    async (who) => {
      for (const sub of ["activity", "decisions", "thesis"]) {
        const body = await desk(sub, who, legacy);
        expect(body).not.toContain("retires if");
        expect(body).not.toContain("the wheel");
      }
      const wired = await wire(who, legacy);
      expect(wired).not.toContain("retires if");
      expect(wired).not.toContain("the wheel");
      const activity = JSON.parse(await desk("activity", who, legacy));
      expect(activity.activity[0].reasoning.invalidator).toBe(INVALIDATOR);
      const decisions = JSON.parse(await desk("decisions", who, legacy));
      expect(decisions.cycles[0].outcomes[0].forecast.invalidator).toBe(INVALIDATOR);
      const thesis = JSON.parse(await desk("thesis", who, legacy));
      expect(thesis.thesis.markers[0].reasoning.invalidator).toBe(INVALIDATOR);
    },
  );

  it("leaves the owner's copy of a stored order in the words the bot wrote", async () => {
    const activity = JSON.parse(await desk("activity", "owner@x", legacy));
    expect(activity.activity[0].reasoning.invalidator).toBe(LEGACY);
  });
});
