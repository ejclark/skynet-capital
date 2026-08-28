import type { ServerResponse } from "node:http";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { serveDeskJson } from "../../src/server/desk-json-routes.js";

/**
 * The desk JSON family's contract (`/api/desk/:id[/activity|/decisions|/pulse]`): an unknown desk
 * is a plain 404, every wired-store absence says so in the body (never an empty lie), and the
 * decisions trail stays bots-only.
 */

interface Answer {
  status?: number;
  body?: string;
}

function fakeRes(): { res: ServerResponse; out: Answer } {
  const out: Answer = {};
  const res = {
    writeHead(status: number) {
      out.status = status;
      return res;
    },
    end(body?: string) {
      out.body = body ?? "";
    },
  } as unknown as ServerResponse;
  return { res, out };
}

const bot = {
  id: "sauron",
  displayName: "Sauron",
  kind: "bot" as const,
  cash: 5_000,
  equity: 10_000,
  positions: [{ symbol: "NVDA", quantity: 10, avgPrice: 150, marketValue: 1_760 }],
  activity: [],
};

const human = { ...bot, id: "human-eric", displayName: "Eric", kind: "human" as const };

function configWith(over: Partial<DashboardServerConfig> = {}): DashboardServerConfig {
  return {
    hub: { getState: () => ({ generatedAt: "t", participants: [bot, human], collisions: [] }) },
    ...over,
  } as unknown as DashboardServerConfig;
}

const answered = (out: Answer): Record<string, unknown> => JSON.parse(out.body ?? "{}");

describe("serveDeskJson", () => {
  it("answers an unknown desk with a plain 404", async () => {
    const { res, out } = fakeRes();
    await serveDeskJson(res, "/api/desk/nobody", configWith());
    expect(out.status).toBe(404);
    expect(answered(out).error).toBe("no such desk");
  });

  it("serves the blotter view for a known desk", async () => {
    const { res, out } = fakeRes();
    await serveDeskJson(res, "/api/desk/sauron", configWith());
    expect(out.status).toBe(200);
    expect(answered(out).desk).toMatchObject({ id: "sauron", kind: "bot" });
  });

  it("says when no activity ledger is wired — never an empty lie", async () => {
    const { res, out } = fakeRes();
    await serveDeskJson(res, "/api/desk/sauron/activity", configWith());
    expect(answered(out)).toEqual({ available: false, activity: [] });

    const wired = fakeRes();
    await serveDeskJson(
      wired.res,
      "/api/desk/sauron/activity",
      configWith({ readTradeActivity: async () => [] }),
    );
    expect(answered(wired.out).available).toBe(true);
  });

  it("keeps the decisions trail bots-only, and honest about an unwired store", async () => {
    const { res, out } = fakeRes();
    await serveDeskJson(res, "/api/desk/human-eric/decisions", configWith());
    expect(answered(out)).toMatchObject({ available: false, kind: "human" });

    const unwired = fakeRes();
    await serveDeskJson(unwired.res, "/api/desk/sauron/decisions", configWith());
    expect(answered(unwired.out)).toMatchObject({ available: false, kind: "bot" });
  });

  it("serves the pulse with each section owning its empty state", async () => {
    const { res, out } = fakeRes();
    await serveDeskJson(res, "/api/desk/sauron/pulse", configWith());
    const pulse = answered(out).pulse as Record<string, unknown>;
    expect(pulse.curve).toBeNull(); // no history wired — still accruing
    expect(pulse.weeks).toEqual([]); // no closed trade
    expect(Array.isArray(pulse.tiles)).toBe(true); // the live snapshot still speaks
  });
});
