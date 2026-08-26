import type { IncomingMessage, ServerResponse } from "node:http";
import type { NavContext, NavView } from "../../src/observatory/render-dashboard.js";
import { serveIndividualProfile } from "../../src/server/dashboard-profile-routes.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";

function fakeResponse(): {
  res: ServerResponse;
  out: { status?: number; body: string };
} {
  const out: { status?: number; body: string } = { body: "" };
  const res = {
    writeHead(status: number) {
      out.status = status;
      return res;
    },
    end(chunk?: string) {
      out.body = chunk ?? "";
    },
  } as unknown as ServerResponse;
  return { res, out };
}

const navFor = (active: NavView): NavContext => ({ active, canAdd: false, authed: true });

function baseConfig(participants: Record<string, unknown>[]): DashboardServerConfig {
  return {
    hub: { getState: () => ({ participants, generatedAt: "2026-08-26T00:00:00Z" }) },
  } as unknown as DashboardServerConfig;
}

describe("serveIndividualProfile", () => {
  it("answers 404 for an id not on the board", async () => {
    const { res, out } = fakeResponse();
    await serveIndividualProfile(
      {} as IncomingMessage,
      res,
      "/u/ghost",
      "/u/ghost",
      baseConfig([]),
      navFor,
      undefined,
    );
    expect(out.status).toBe(404);
  });

  it("re-syncs the account from the broker before rendering, when wired (#591)", async () => {
    let refreshedId: string | undefined;
    const config = {
      ...baseConfig([
        {
          id: "acct-1",
          displayName: "Ann",
          kind: "human",
          cash: 1000,
          equity: 1000,
          positions: [],
        },
      ]),
      refreshParticipant: (id: string) => {
        refreshedId = id;
        return Promise.resolve();
      },
    } as unknown as DashboardServerConfig;

    const { res, out } = fakeResponse();
    await serveIndividualProfile(
      {} as IncomingMessage,
      res,
      "/u/acct-1",
      "/u/acct-1",
      config,
      navFor,
      undefined,
    );

    expect(refreshedId).toBe("acct-1");
    expect(out.status).toBe(200);
    expect(out.body).toContain("Ann — Skynet Capital");
  });

  it("renders the overview by default, escaping the account's display name", async () => {
    const config = baseConfig([
      {
        id: "acct-1",
        displayName: "<b>Ann</b>",
        kind: "human",
        cash: 1000,
        equity: 1000,
        positions: [],
      },
    ]);
    const { res, out } = fakeResponse();

    await serveIndividualProfile(
      {} as IncomingMessage,
      res,
      "/u/acct-1",
      "/u/acct-1",
      config,
      navFor,
      undefined,
    );

    expect(out.body).not.toContain("<b>Ann</b>");
    expect(out.body).toContain("&lt;b&gt;Ann&lt;/b&gt;");
  });

  it("downgrades an unowned ?tab=settings request to the overview rather than leaking an owner tell", async () => {
    const config = baseConfig([
      { id: "acct-1", displayName: "Ann", kind: "human", cash: 1000, equity: 1000, positions: [] },
    ]);
    const { res: overviewRes, out: overviewOut } = fakeResponse();
    const { res: settingsRes, out: settingsOut } = fakeResponse();

    // No `controls` on the config and no owner session — parseDeskTab should fold "settings" back
    // to the same overview render `?tab=` normally produces, never the Mission Control branch
    // (which would need req.method/config.controls and throw here if reached in error).
    await serveIndividualProfile(
      {} as IncomingMessage,
      overviewRes,
      "/u/acct-1",
      "/u/acct-1",
      config,
      navFor,
      undefined,
    );
    await serveIndividualProfile(
      {} as IncomingMessage,
      settingsRes,
      "/u/acct-1",
      "/u/acct-1?tab=settings",
      config,
      navFor,
      undefined,
    );

    expect(settingsOut.status).toBe(200);
    expect(settingsOut.body).toBe(overviewOut.body);
  });
});
