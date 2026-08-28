import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { serveLearnApi } from "../../src/server/learn-api-routes.js";

/**
 * The journey's write half: the participant is the SESSION'S (the body names nobody), grading
 * verdicts come only from the service, and every refusal is an honest sentence.
 */

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

function jsonReq(body: unknown, contentType = "application/json"): IncomingMessage {
  const req = Readable.from([Buffer.from(JSON.stringify(body))]) as unknown as IncomingMessage;
  req.method = "POST";
  req.headers = { "content-type": contentType };
  return req;
}

const session = { email: "eric@example.com", name: "Eric Clark" } as never;

function configWith(overrides: Partial<DashboardServerConfig>): DashboardServerConfig {
  return {
    hub: { getState: () => ({ participants: [] }) },
    auth: { providerIds: ["google"] },
    resolveOwnerId: () => "human-eric",
    ...overrides,
  } as unknown as DashboardServerConfig;
}

describe("serveLearnApi", () => {
  it("ignores paths outside the learn writes", async () => {
    const { res } = fakeRes();
    const handled = await serveLearnApi(jsonReq({}), res, "/api/learn", configWith({}), session);
    expect(handled).toBe(false); // the GET twin belongs to the content API
  });

  it("refuses a non-JSON content type before reading anything", async () => {
    const { res, out } = fakeRes();
    const req = jsonReq({ ack: ["first-buy"] }, "application/x-www-form-urlencoded");
    const acked: string[][] = [];
    const config = configWith({
      progression: { acknowledge: (_: string, ids: string[]) => acked.push(ids) } as never,
    });
    await serveLearnApi(req, res, "/api/learn/claim", config, session);
    expect(out.status).toBe(415); // the CSRF seam: cross-site form posts can't speak JSON
    expect(acked).toEqual([]);
  });

  it("claims for the SESSION's resolved account — the body cannot name a journey", async () => {
    const { res, out } = fakeRes();
    const seen: { id: string; ids: readonly string[] }[] = [];
    const config = configWith({
      progression: {
        acknowledge: (id: string, ids: readonly string[]) => {
          seen.push({ id, ids });
          return Promise.resolve();
        },
      } as never,
    });
    const body = { ack: ["first-buy"], participantId: "attacker" }; // the extra field is dropped
    await serveLearnApi(jsonReq(body), res, "/api/learn/claim", config, session);
    expect(seen).toEqual([{ id: "human-eric", ids: ["first-buy"] }]);
    expect(JSON.parse(out.body ?? "{}")).toEqual({ ok: true });
  });

  it("rejects a malformed claim body with 400, never coercing", async () => {
    const { res, out } = fakeRes();
    const config = configWith({ progression: { acknowledge: () => Promise.resolve() } as never });
    await serveLearnApi(jsonReq({ ack: [42] }), res, "/api/learn/claim", config, session);
    expect(out.status).toBe(400);
  });

  it("grades through the service and relays its verdict whole — reasons included", async () => {
    const { res, out } = fakeRes();
    const seen: { id: string; milestoneId: string; answers: ReadonlyMap<string, string> }[] = [];
    const verdict = {
      milestoneId: "first-buy",
      title: "Owning a share",
      correct: 2,
      total: 3,
      needed: 2,
      passed: true,
      answers: [],
      verdict: "2 of 3 — you've got what owning a share means.",
    };
    const config = configWith({
      progression: {
        submitCheck: (id: string, milestoneId: string, answers: ReadonlyMap<string, string>) => {
          seen.push({ id, milestoneId, answers });
          return Promise.resolve(verdict);
        },
      } as never,
    });
    const body = { milestoneId: "first-buy", answers: { q1: "0", q2: "2" } };
    await serveLearnApi(jsonReq(body), res, "/api/learn/check", config, session);
    expect(seen[0]?.id).toBe("human-eric");
    expect(seen[0]?.answers.get("q2")).toBe("2");
    expect(JSON.parse(out.body ?? "{}")).toEqual({ ok: true, result: verdict });
  });

  it("answers honestly when the id gates nothing — no verdict is invented", async () => {
    const { res, out } = fakeRes();
    const config = configWith({
      progression: { submitCheck: () => Promise.resolve(undefined) } as never,
    });
    const body = { milestoneId: "not-a-gate", answers: {} };
    await serveLearnApi(jsonReq(body), res, "/api/learn/check", config, session);
    const parsed = JSON.parse(out.body ?? "{}");
    expect(parsed.ok).toBe(false);
    expect(parsed.error).toContain("gates nothing");
  });

  it("refuses an unlinked session before touching the service", async () => {
    const { res, out } = fakeRes();
    const called: string[] = [];
    const config = configWith({
      resolveOwnerId: () => undefined,
      progression: { acknowledge: () => called.push("ack") } as never,
    });
    await serveLearnApi(jsonReq({ ack: ["x"] }), res, "/api/learn/claim", config, session);
    const parsed = JSON.parse(out.body ?? "{}");
    expect(parsed.ok).toBe(false);
    expect(parsed.error).toContain("isn't linked");
    expect(called).toEqual([]);
  });

  it("says so when the journey isn't wired at all", async () => {
    const { res, out } = fakeRes();
    await serveLearnApi(jsonReq({ ack: ["x"] }), res, "/api/learn/claim", configWith({}), session);
    expect(JSON.parse(out.body ?? "{}").error).toContain("isn't wired");
  });
});
