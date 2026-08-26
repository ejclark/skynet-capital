import type { ServerResponse } from "node:http";
import type { NavContext, NavView } from "../../src/observatory/render-dashboard.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { serveInfoRoute, serveLearnRoute } from "../../src/server/dashboard-view-routes.js";

function fakeResponse(): {
  res: ServerResponse;
  out: { status?: number; headers?: Record<string, string>; body: string };
} {
  const out: { status?: number; headers?: Record<string, string>; body: string } = { body: "" };
  const res = {
    writeHead(status: number, headers?: Record<string, string>) {
      out.status = status;
      out.headers = headers;
      return res;
    },
    end(chunk?: string) {
      out.body = chunk ?? "";
    },
  } as unknown as ServerResponse;
  return { res, out };
}

const navFor = (active: NavView): NavContext => ({ active, canAdd: false, authed: true });

describe("serveInfoRoute", () => {
  it("redirects the retired /calendar to /research, carrying a ?month= param over", () => {
    const { res, out } = fakeResponse();
    const handled = serveInfoRoute(res, "/calendar", "/calendar?month=2026-08", navFor);
    expect(handled).toBe(true);
    expect(out.status).toBe(302);
    expect(out.headers?.location).toBe("/research?month=2026-08");
  });

  it("redirects a bare /calendar to /research", () => {
    const { res, out } = fakeResponse();
    serveInfoRoute(res, "/calendar", "/calendar", navFor);
    expect(out.headers?.location).toBe("/research");
  });

  it("serves the research shelf at /research", () => {
    const { res, out } = fakeResponse();
    const handled = serveInfoRoute(res, "/research", "/research", navFor);
    expect(handled).toBe(true);
    expect(out.status).toBe(200);
  });

  it("serves the collections browse index at /collections", () => {
    const { res, out } = fakeResponse();
    const handled = serveInfoRoute(res, "/collections", "/collections", navFor);
    expect(handled).toBe(true);
    expect(out.status).toBe(200);
    expect(out.body).toContain("Collections — Skynet Capital");
  });

  it("serves one collection, resolving the desk index only for that route", () => {
    const { res, out } = fakeResponse();
    let reads = 0;
    const desks = () => {
      reads += 1;
      return new Map([["sauron", { participantId: "sauron", displayName: "Sauron" }]]);
    };

    serveInfoRoute(res, "/research", "/research", navFor, desks);
    expect(reads).toBe(0);

    serveInfoRoute(
      res,
      "/collections/against-the-crowd",
      "/collections/against-the-crowd",
      navFor,
      desks,
    );
    expect(reads).toBe(1);
    expect(out.body).toContain('href="/u/sauron"');
  });

  it("leaves an unrecognized path unhandled", () => {
    const { res } = fakeResponse();
    expect(serveInfoRoute(res, "/nope", "/nope", navFor)).toBe(false);
  });
});

describe("serveLearnRoute", () => {
  it("renders the browsable journey at zero with no auth configured", async () => {
    const { res, out } = fakeResponse();
    const config = {} as unknown as DashboardServerConfig;
    await serveLearnRoute(res, config, undefined, navFor);
    expect(out.status).toBe(200);
    expect(out.body).toContain("Milestones — Skynet Capital");
  });

  it("resolves the viewer's real progression when auth and progression are both wired", async () => {
    const { res, out } = fakeResponse();
    let askedFor: string | undefined;
    const config = {
      auth: {},
      resolveOwnerId: () => "ann-id",
      progression: {
        view: (id: string) => {
          askedFor = id;
          return {
            wheels: false,
            earned: [],
            earnedByCode: new Map(),
            unlocked: new Set(),
            points: 42,
            rank: { title: "Apprentice", atPoints: 25 },
            unlockedLevels: new Set([100]),
            celebrating: [],
            pendingChecks: [],
          };
        },
      },
    } as unknown as DashboardServerConfig;
    await serveLearnRoute(res, config, { email: "ann@example.com" } as never, navFor);
    expect(askedFor).toBe("ann-id");
    expect(out.status).toBe(200);
  });
});
