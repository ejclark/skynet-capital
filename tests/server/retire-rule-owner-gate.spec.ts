import type { ServerResponse } from "node:http";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { OrderIntent } from "../../src/domain/types.js";
import type { TradeActivityRecord } from "../../src/observatory/activity-record.js";
import { serveContentApi } from "../../src/server/content-api-routes.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { serveDeskJson } from "../../src/server/desk-json-routes.js";
import { anOptionIntent } from "../support/builders.js";

/**
 * A playbook's retire rule is its owner's alone (#5828, sibling of #5043; privacy rule #885). The
 * call spread's "Proves it wrong" line once led with the play's own multi-print retire test — its
 * D-20→D-5 window names the playbook's parameters by inference, the way the strategy tag did
 * (#4971). The test now rides in `forecast.retireRule`, which every non-owner strip drops; the
 * order's own falsifier stays public. A decision stored before the move keeps its words, so the
 * same strips cut the old leading clause on read (`playbook-name-redaction.ts`).
 */

const LOW = "NVDA261113C00185000";
const HIGH = "NVDA261113C00200000";
const FALSIFIER = "this spread exits below its cost";
const RETIRE = "The playbook retires if NVDA's D-20→D-5 return is ≤ 0 on 2 of the next 3 prints.";
const LEGACY = `NVDA's D-20→D-5 return ≤ 0 on 2 of the next 3 prints, or ${FALSIFIER}`;

const spreadWith = (forecast: OrderIntent["forecast"]): OrderIntent =>
  anOptionIntent({
    symbol: "NVDA",
    side: "buy",
    playbookId: "NVDA-CALL-SPREAD",
    reason: "the options form of the pre-earnings run-up",
    expectation: "NVDA keeps rising into the print",
    ...(forecast ? { forecast } : {}),
    option: {
      structure: "call-debit-spread",
      legs: [
        { occSymbol: LOW, side: "buy", ratio: 1 },
        { occSymbol: HIGH, side: "sell", ratio: 1 },
      ],
      limitPrice: 3.4,
    },
  });

const passFor = (intent: OrderIntent): DecisionRecord => ({
  at: Date.parse("2026-10-27T15:00:00.000Z"),
  personaId: "sauron",
  mode: "live",
  rawIntents: [intent],
  guardedIntents: [intent],
  outcomes: [
    {
      intent,
      action: "placed",
      result: { intent, status: "filled", orderId: "mleg-1", filledQuantity: 1, filledPrice: 3.35 },
    },
  ],
});

const filled: TradeActivityRecord = {
  orderId: "mleg-1",
  participantId: "sauron",
  symbol: "NVDA",
  side: "buy",
  quantity: 1,
  filledQuantity: 1,
  status: "filled",
  at: "2026-10-27T15:00:02.000Z",
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

function configFor(intent: OrderIntent): DashboardServerConfig {
  const pass = passFor(intent);
  return {
    hub: { getState: () => ({ generatedAt: "t", participants: [sauron], collisions: [] }) },
    auth: {},
    resolveOwnerIds: (email: string) => (email === "owner@x" ? ["sauron"] : ["human-eric"]),
    readDecisions: () => Promise.resolve([pass]),
    readTradeActivity: async () => [filled],
    readAllTradeActivity: async () => [filled],
    findByOrderId: (orderId: string) =>
      orderId === "mleg-1" ? { record: pass, intent } : undefined,
  } as unknown as DashboardServerConfig;
}

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

async function desk(config: DashboardServerConfig, sub: string, who?: string): Promise<string> {
  const { res, body } = capture();
  const path = `/api/desk/sauron/${sub}`;
  await serveDeskJson(res, path, path, config, who ? session(who) : undefined);
  return body();
}

async function wire(config: DashboardServerConfig, who?: string): Promise<string> {
  const { res, body } = capture();
  const path = "/api/wire";
  if (!(await serveContentApi(res, path, path, config, who ? session(who) : undefined))) {
    throw new Error("/api/wire went unanswered");
  }
  return body();
}

describe("a spread's retire rule is its owner's alone", () => {
  const config = configFor(
    spreadWith({ direction: "up", invalidator: FALSIFIER, retireRule: RETIRE }),
  );

  it("gives the owner the retire rule on the pass log and Activity's why", async () => {
    const decisions = JSON.parse(await desk(config, "decisions", "owner@x"));
    expect(decisions.cycles[0].outcomes[0].forecast).toEqual({
      direction: "up",
      invalidator: FALSIFIER,
      retireRule: RETIRE,
    });
    const activity = JSON.parse(await desk(config, "activity", "owner@x"));
    expect(activity.activity[0].reasoning).toMatchObject({
      invalidator: FALSIFIER,
      retireRule: RETIRE,
    });
  });

  it("withholds it from a member who does not own the bot, and from a signed-out read", async () => {
    for (const who of ["guest@x", undefined]) {
      for (const sub of ["decisions", "activity", "thesis"]) {
        const body = await desk(config, sub, who);
        expect(body).not.toContain("retireRule");
        expect(body).not.toContain("prints");
      }
      const league = await wire(config, who);
      expect(league).not.toContain("retireRule");
      expect(league).not.toContain("prints");
    }
    // The order's own falsifier still rides to everyone.
    const decisions = JSON.parse(await desk(config, "decisions", "guest@x"));
    expect(decisions.cycles[0].outcomes[0].forecast).toEqual({
      direction: "up",
      invalidator: FALSIFIER,
    });
    const activity = JSON.parse(await desk(config, "activity", "guest@x"));
    expect(activity.activity[0].reasoning.invalidator).toBe(FALSIFIER);
  });
});

describe("a spread decision stored before the retire rule moved", () => {
  const config = configFor(spreadWith({ direction: "up", invalidator: LEGACY }));

  it("reads as the order's own falsifier to a non-owner", async () => {
    for (const sub of ["decisions", "activity", "thesis"]) {
      expect(await desk(config, sub, "guest@x")).not.toContain("prints");
    }
    expect(await wire(config, "guest@x")).not.toContain("prints");
    const decisions = JSON.parse(await desk(config, "decisions", "guest@x"));
    expect(decisions.cycles[0].outcomes[0].forecast.invalidator).toBe(FALSIFIER);
    const activity = JSON.parse(await desk(config, "activity", "guest@x"));
    expect(activity.activity[0].reasoning.invalidator).toBe(FALSIFIER);
  });

  it("keeps the words the bot wrote for its owner", async () => {
    const decisions = JSON.parse(await desk(config, "decisions", "owner@x"));
    expect(decisions.cycles[0].outcomes[0].forecast.invalidator).toBe(LEGACY);
  });
});
