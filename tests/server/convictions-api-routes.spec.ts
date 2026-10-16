import type { IncomingMessage, ServerResponse } from "node:http";
import { AI_DIP_2026_10 } from "../../src/playbooks/conviction-seeds.js";
import { ConvictionStore } from "../../src/playbooks/conviction-store.js";
import { serveConvictionsApi } from "../../src/server/convictions-api-routes.js";

/** #5482 slice 2 — `GET /api/convictions`: the stored records, read-only, labelled SIM. */

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
const req = (url = "/api/convictions", method = "GET") =>
  ({ method, url, headers: {} }) as unknown as IncomingMessage;

function serve(url?: string, store?: ConvictionStore) {
  const { res, out } = fakeRes();
  const answered = serveConvictionsApi(req(url), res, "/api/convictions", store);
  return { answered, status: out.status, body: JSON.parse(out.body ?? "{}") };
}

describe("serveConvictionsApi", () => {
  it("ignores other paths and refuses anything but GET", () => {
    const { res, out } = fakeRes();
    expect(serveConvictionsApi(req(), res, "/api/playbooks")).toBe(false);
    expect(serveConvictionsApi(req("/api/convictions", "POST"), res, "/api/convictions")).toBe(
      true,
    );
    expect(out.status).toBe(405);
  });

  it("lists every stored conviction, labelled SIM", () => {
    const { answered, status, body } = serve();
    expect(answered).toBe(true);
    expect(status).toBe(200);
    expect(body.label).toBe("SIM");
    expect(body.convictions.map((c: { id: string }) => c.id)).toEqual(["ai-dip-2026-10"]);
    expect(body.convictions[0].steers).toEqual(["CRWV-WHEEL", "CRWV-LONG-CALL"]);
  });

  it("answers one by id", () => {
    const { status, body } = serve("/api/convictions?id=ai-dip-2026-10");
    expect(status).toBe(200);
    expect(body).toEqual({ label: "SIM", conviction: JSON.parse(JSON.stringify(AI_DIP_2026_10)) });
  });

  it("404s an id no record holds", () => {
    const { status, body } = serve("/api/convictions?id=nope");
    expect(status).toBe(404);
    expect(body.error).toBe("no such conviction");
  });

  it("never serves a record the store refused", () => {
    const store = new ConvictionStore([{ ...AI_DIP_2026_10, claims: [] }]);
    expect(serve(undefined, store).body.convictions).toEqual([]);
    expect(serve("/api/convictions?id=ai-dip-2026-10", store).status).toBe(404);
  });
});
