import type { ServerResponse } from "node:http";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { OrderIntent } from "../../src/domain/types.js";
import { deskHealthPayload } from "../../src/server/book-health-payload.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { serveDeskJson } from "../../src/server/desk-json-routes.js";
import { aSubscription } from "../support/builders.js";

/**
 * `GET /api/desk/:id` carries the book's health (#5493 slice 1) as a field, not a route: every
 * finding for the account's owner, the counts alone for anyone else (#885).
 */

const ask: OrderIntent = {
  symbol: "NVDA",
  side: "buy",
  quantity: 1,
  type: "market",
  reason: "the pre-print run-up",
  playbookId: "S1-NVDA",
};
const refused = (minute: number): DecisionRecord => ({
  at: Date.parse(`2026-10-16T17:${String(minute).padStart(2, "0")}:00.000Z`),
  personaId: "sauron",
  mode: "live",
  rawIntents: [ask],
  guardedIntents: [],
  outcomes: [],
  refusals: [{ intent: ask, reason: "options-level" }],
});
const passes = [59, 58, 57, 56, 55, 54].map(refused);

const bot = {
  id: "sauron",
  displayName: "Sauron",
  kind: "bot" as const,
  cash: 5_500,
  equity: 10_000,
  positions: [{ symbol: "NVDA", quantity: 25, avgPrice: 170, marketValue: 4_500 }],
  activity: [],
};

const configFor = (participant: object) =>
  ({
    hub: { getState: () => ({ generatedAt: "t", participants: [participant], collisions: [] }) },
    auth: {} as never,
    resolveOwnerIds: (email: string) => (email === "owner@x" ? ["sauron"] : ["human-eric"]),
    readDecisions: async () => passes,
    subscriptions: {
      loadIfReadable: () => ({
        sauron: [aSubscription("sauron", "S1-NVDA", { capitalAllocated: 5_000 })],
      }),
    },
    now: () => new Date("2026-10-16T18:00:00.000Z"),
  }) as unknown as DashboardServerConfig;

const health = async (who: string, participant: object = bot) => {
  let body = "";
  const res = {
    writeHead: () => res,
    end: (text?: string) => {
      body = text ?? "";
    },
  } as unknown as ServerResponse;
  await serveDeskJson(res, "/api/desk/sauron", "/api/desk/sauron", configFor(participant), {
    email: who,
    provider: "google",
    exp: 0,
  });
  return (JSON.parse(body) as { health: Record<string, unknown> }).health;
};

describe("the desk payload's health field", () => {
  it("gives the owner every finding with the play behind it, and each play's numbers", async () => {
    const view = await health("owner@x");
    expect(view.available).toBe(true);
    const findings = view.findings as { detector: string; level: string; playbookId?: string }[];
    expect(findings.map((f) => `${f.level}:${f.detector}`)).toEqual([
      "gate:concentrated",
      "signal:looping",
    ]);
    expect(findings[1]?.playbookId).toBe("S1-NVDA");
    expect(view.plays).toEqual([
      expect.objectContaining({ playbookId: "S1-NVDA", committed: 4_500, idle: 500 }),
    ]);
  });

  it("gives anyone else the counts alone — no findings, no plays, no playbook names", async () => {
    const view = await health("guest@x");
    expect(view).toEqual({
      available: true,
      counts: { signal: 1, gate: 1, byDetector: { concentrated: 1, looping: 1 } },
    });
    expect(JSON.stringify(view)).not.toContain("S1-NVDA");
  });

  it("says it has nothing to judge when the broker read failed", async () => {
    const payload = await deskHealthPayload(
      { ...bot, error: "broker read failed" },
      configFor(bot),
      true,
      undefined,
    );
    expect(payload).toEqual({ available: false });
  });
});
