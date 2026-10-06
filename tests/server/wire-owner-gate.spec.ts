import type { ServerResponse } from "node:http";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { OrderIntent } from "../../src/domain/types.js";
import type { TradeActivityRecord } from "../../src/observatory/activity-record.js";
import { serveContentApi } from "../../src/server/content-api-routes.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";

/**
 * #885 (Eric, 2026-08-29): "at this time, we do not show what playbooks others are using". The
 * league Wire (`/api/wire`) attaches each bot fill's decision through the same join the desk routes
 * use — so it must withhold the playbook from a viewer who does not own that account, exactly as
 * `/api/desk/:id/activity` does (`desk-owner-gate.ts`). The why, the persona and the fill still ride.
 */

const intent: OrderIntent = {
  symbol: "NVDA",
  side: "buy",
  quantity: 4,
  type: "market",
  reason: "the pre-earnings run-up window opened",
  playbookId: "S1-NVDA",
  playbookMode: "standard",
};

const decision: DecisionRecord = {
  at: Date.parse("2026-10-05T15:00:00.000Z"),
  personaId: "sauron",
  mode: "live",
  rawIntents: [intent],
  guardedIntents: [intent],
  outcomes: [
    {
      intent,
      action: "placed",
      result: { intent, status: "filled", orderId: "ord-1", filledQuantity: 4, filledPrice: 181.4 },
    },
  ],
};

const fill: TradeActivityRecord = {
  orderId: "ord-1",
  participantId: "sauron",
  symbol: "NVDA",
  side: "buy",
  quantity: 4,
  filledQuantity: 4,
  price: 181.4,
  status: "filled",
  at: "2026-10-05T15:00:02.000Z",
  source: "stream",
};

const sauron = {
  id: "sauron",
  displayName: "Sauron",
  kind: "bot" as const,
  cash: 5_000,
  equity: 10_000,
  positions: [],
};

const session = (email: string) => ({ email, provider: "google" as const, exp: 0 });

async function wireReasoning(
  config: Partial<DashboardServerConfig>,
  viewer?: ReturnType<typeof session>,
): Promise<Record<string, unknown> | undefined> {
  let body = "";
  const res = {
    writeHead: () => res,
    end: (text?: string) => {
      body = text ?? "";
    },
  } as unknown as ServerResponse;
  const full = {
    hub: { getState: () => ({ generatedAt: "t", participants: [sauron], collisions: [] }) },
    readAllTradeActivity: async () => [fill],
    findByOrderId: (id: string) => (id === "ord-1" ? { record: decision, intent } : undefined),
    ...config,
  } as unknown as DashboardServerConfig;
  if (!(await serveContentApi(res, "/api/wire", "/api/wire", full, viewer))) {
    throw new Error("/api/wire went unanswered");
  }
  return JSON.parse(body).wire.trades[0]?.reasoning;
}

const signedIn = {
  auth: {},
  resolveOwnerIds: (email: string) => (email === "owner@x" ? ["human-eric", "sauron"] : []),
} as unknown as Partial<DashboardServerConfig>;

describe("the league Wire withholds a bot's playbook from anyone but its owner (#885)", () => {
  it("strips the playbook from a fill on an account the viewer does not own, keeping the why", async () => {
    const reasoning = await wireReasoning(signedIn, session("guest@x"));
    expect(reasoning).toMatchObject({
      reason: "the pre-earnings run-up window opened",
      personaId: "sauron",
    });
    expect(reasoning).not.toHaveProperty("playbookId");
    expect(reasoning).not.toHaveProperty("playbookMode");
  });

  it("keeps it for the account's owner", async () => {
    const reasoning = await wireReasoning(signedIn, session("owner@x"));
    expect(reasoning).toMatchObject({ playbookId: "S1-NVDA", playbookMode: "standard" });
  });

  it("strips it for a request with no session at all once sign-in is configured", async () => {
    expect(await wireReasoning(signedIn)).not.toHaveProperty("playbookId");
  });

  it("keeps it on a deployment with no sign-in, where the single operator owns every account", async () => {
    expect(await wireReasoning({})).toMatchObject({ playbookId: "S1-NVDA" });
  });
});
