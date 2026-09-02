import type { IncomingMessage, ServerResponse } from "node:http";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { servePlaybooksApi } from "../../src/server/playbooks-api-routes.js";

function fakeRes() {
  const out: { status?: number; body?: string } = {};
  const res = {
    writeHead: (status: number) => {
      out.status = status;
      return res;
    },
    end: (body?: string) => {
      out.body = body;
    },
  } as unknown as ServerResponse;
  return { res, out };
}
const get = () => ({ method: "GET", headers: {} }) as unknown as IncomingMessage;
const session = { email: "joe@example.com" } as never;
const configWith = (over: Record<string, unknown> = {}) =>
  ({
    hub: { getState: () => ({ participants: [] }) },
    auth: {},
    ...over,
  }) as unknown as DashboardServerConfig;

async function body(config: DashboardServerConfig) {
  const { res, out } = fakeRes();
  const answered = await servePlaybooksApi(get(), res, "/api/playbooks", config, session);
  return { answered, ...JSON.parse(out.body ?? "{}") };
}

describe("servePlaybooksApi", () => {
  it("ignores other paths and refuses non-GET", async () => {
    const { res, out } = fakeRes();
    expect(await servePlaybooksApi(get(), res, "/api/learn", configWith(), session)).toBe(false);
    const post = { method: "POST", headers: {} } as unknown as IncomingMessage;
    expect(await servePlaybooksApi(post, res, "/api/playbooks", configWith(), session)).toBe(true);
    expect(out.status).toBe(405);
  });

  it("serves the catalog with nothing unlocked when no desk is linked", async () => {
    const view = await body(configWith({ resolveOwnerId: () => undefined }));
    expect(view.answered).toBe(true);
    expect(view.linked).toBe(false);
    expect(view.milestone.code).toBe("M·03");
    expect(view.arming).toBe("season-1");
    expect(view.total).toBe(4);
    expect(view.unlocked).toBe(0);
  });

  it("unlocks from the viewer's own earned rungs", async () => {
    const view = await body(
      configWith({
        resolveOwnerId: () => "human-joe",
        progression: {
          view: () =>
            Promise.resolve({
              earned: [
                { milestoneId: "first-buy", code: "101", orderId: "a", at: "t" },
                { milestoneId: "first-sell", code: "102", orderId: "b", at: "t" },
              ],
            }),
        },
      }),
    );
    expect(view.linked).toBe(true);
    expect(view.unlocked).toBe(1);
    expect(view.playbooks[0]).toMatchObject({
      id: "accumulator",
      unlocked: true,
      unlocksAfterName: "Sell stock",
    });
  });
});
