import type { ServerResponse } from "node:http";
import { serveContentApi } from "../../src/server/content-api-routes.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";

/** The content JSON family's dispatch: claims exactly its own paths, the journey resolves the
 *  VIEWER's own progression from the session — never anyone else's — and ops status answers every
 *  member alike, since #1296 moved it out of the owner-gated admin family. */

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
    expect(await serveContentApi(res, "/api/board", "/api/board", configWith(), undefined)).toBe(
      false,
    );
    expect(
      await serveContentApi(res, "/api/settings", "/api/settings", configWith(), undefined),
    ).toBe(false);
  });

  it("serves ops status to any member — fleet health is the group's, not the owner's (#1296)", async () => {
    const status = {
      generatedAt: "2026-09-05T12:00:00Z",
      degraded: false,
      signals: [{ id: "bridge", label: "Controls bridge", verdict: "attention", detail: "quiet" }],
    };
    const config = configWith({ opsStatus: { status: () => Promise.resolve(status) } });
    const { res, out } = fakeRes();
    // A plain member's session — the old `/api/admin/ops-status` answered this one `{owner:false}`.
    expect(
      await serveContentApi(res, "/api/ops-status", "/api/ops-status", config, {
        email: "m@x.z",
      } as never),
    ).toBe(true);
    expect(JSON.parse(out.body ?? "{}")).toEqual({ available: true, status });
  });

  it("says so plainly when no ops panel is wired — never a silent empty panel", async () => {
    const { res, out } = fakeRes();
    expect(
      await serveContentApi(res, "/api/ops-status", "/api/ops-status", configWith(), undefined),
    ).toBe(true);
    expect(JSON.parse(out.body ?? "{}")).toEqual({ available: false });
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
    await serveContentApi(res, "/api/learn", "/api/learn", config, { email: "x@y.z" } as never);
    const body = JSON.parse(out.body ?? "{}");
    expect(body.linked).toBe(false); // no resolved account → the browsable journey
    expect(seen).toEqual([]); // progression never asked about anyone else
  });
});

describe("serveContentApi — the calendar's slice (#3977 slice 5)", () => {
  const serve = async (path: string) => {
    const { res, out } = fakeRes();
    const claimed = await serveContentApi(res, path, path, configWith(), undefined);
    return { claimed, status: out.status, body: out.body ?? "" };
  };

  it("serves the shelf's own events, narrowed, at a fraction of the shelf's bytes", async () => {
    const shelf = await serve("/api/research");
    const calendar = await serve("/api/research/calendar");
    expect(calendar.claimed).toBe(true);
    expect(calendar.status).toBe(200);
    const full = JSON.parse(shelf.body);
    const slim = JSON.parse(calendar.body);
    expect(slim.events.map((e: { id: string }) => e.id)).toEqual(
      full.events.map((e: { id: string }) => e.id),
    );
    expect(slim.closures).toEqual(full.closures);
    expect(slim.calls.some((c: object) => "tldr" in c || "adjacent" in c)).toBe(false);
    // 2.58 MB → ~0.21 MB on 2026-09-30; a quarter is the loose line a regression would cross.
    expect(calendar.body.length).toBeLessThan(shelf.body.length / 4);
  });
});
