import type { ServerResponse } from "node:http";
import { serveContentApi } from "../../src/server/content-api-routes.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";

/** The content JSON family's dispatch: claims exactly its own paths, and the journey resolves
 *  the VIEWER's own progression from the session — never anyone else's. */

function fakeRes(): { res: ServerResponse; out: { status?: number; body?: string } } {
  const out: { status?: number; body?: string } = {};
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

function configWith(over: Record<string, unknown> = {}): DashboardServerConfig {
  return {
    hub: { getState: () => ({ generatedAt: "t", participants: [], collisions: [] }) },
    ...over,
  } as unknown as DashboardServerConfig;
}

describe("serveContentApi", () => {
  it("claims only its own paths", async () => {
    const { res } = fakeRes();
    expect(await serveContentApi(res, "/api/board", configWith(), undefined)).toBe(false);
    expect(await serveContentApi(res, "/api/settings", configWith(), undefined)).toBe(false);
  });

  it("serves the Outpost's card catalog with its browse facets", async () => {
    const { res, out } = fakeRes();
    expect(await serveContentApi(res, "/api/outpost", configWith(), undefined)).toBe(true);
    const body = JSON.parse(out.body ?? "{}");
    expect(body.cards.length).toBeGreaterThan(0);
    expect(body.authors.length).toBeGreaterThan(0);
    expect(body.cards[0].author.kind).toBe("house");
  });

  it("serves the collections shelves without auth context — discovery is for every member", async () => {
    const { res, out } = fakeRes();
    expect(await serveContentApi(res, "/api/collections", configWith(), undefined)).toBe(true);
    const body = JSON.parse(out.body ?? "{}");
    expect(Array.isArray(body.collections)).toBe(true);
  });

  it("resolves the journey from the SESSION — an unlinked one browses from zero", async () => {
    const seen: string[] = [];
    const config = configWith({
      auth: { providerIds: ["google"] },
      resolveOwnerId: () => undefined,
      progression: {
        view: (id: string) => {
          seen.push(id);
          return Promise.resolve(undefined);
        },
      },
    });
    const { res, out } = fakeRes();
    await serveContentApi(res, "/api/learn", config, { email: "x@y.z" } as never);
    const body = JSON.parse(out.body ?? "{}");
    expect(body.linked).toBe(false); // no resolved account → the browsable journey
    expect(seen).toEqual([]); // progression never asked about anyone else
  });
});
