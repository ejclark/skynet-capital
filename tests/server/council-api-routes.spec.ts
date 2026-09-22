import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import { serveCouncilApi } from "../../src/server/council-api-routes.js";
import type { CouncilDeps } from "../../src/server/council-form.js";

/**
 * `/api/council`'s HTTP layer: unwired answers `{enabled:false}`, a signed-out GET still sees the
 * week (the auth gate already ran), a signed-out POST is refused, and the session's own email is
 * the ONLY identity a submitted line is ever attributed to.
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

function getReq(): IncomingMessage {
  return { method: "GET", headers: {} } as unknown as IncomingMessage;
}

function postReq(body: unknown, contentType = "application/json"): IncomingMessage {
  const req = Readable.from([Buffer.from(JSON.stringify(body))]) as unknown as IncomingMessage;
  req.method = "POST";
  req.headers = { "content-type": contentType };
  return req;
}

function depsWith(
  weeks: Record<string, Record<string, { text: string; at: string; playbookId?: string }>> = {},
) {
  const submits: { week: string; memberId: string; text: string; playbookId?: string }[] = [];
  const deps: CouncilDeps = {
    load: () => ({ weeks }),
    submit: (week, memberId, text, _at, playbookId) => {
      submits.push({ week, memberId, text, ...(playbookId ? { playbookId } : {}) });
      weeks[week] = {
        ...weeks[week],
        [memberId]: {
          text,
          at: "2026-09-07T12:00:00.000Z",
          ...(playbookId ? { playbookId } : {}),
        },
      };
    },
    now: () => new Date("2026-09-07T12:00:00.000Z"),
  };
  return { deps, submits };
}

const member = { email: "member@example.com" } as never;

describe("serveCouncilApi", () => {
  it("ignores other paths", async () => {
    const { res } = fakeRes();
    const { deps } = depsWith();
    expect(await serveCouncilApi(getReq(), res, "/api/wire", deps, member)).toBe(false);
  });

  it("answers enabled:false with no deps, and never touches the request further", async () => {
    const { res, out } = fakeRes();
    expect(await serveCouncilApi(getReq(), res, "/api/council", undefined, member)).toBe(true);
    expect(JSON.parse(out.body ?? "{}")).toEqual({ enabled: false });
  });

  it("a signed-out GET still sees this week's lines — the auth gate already ran", async () => {
    const { res, out } = fakeRes();
    const { deps } = depsWith({
      "2026-W37": { abc: { text: "bullish", at: "2026-09-07T12:00:00.000Z" } },
    });
    await serveCouncilApi(getReq(), res, "/api/council", deps, undefined);
    const body = JSON.parse(out.body ?? "{}");
    expect(body.enabled).toBe(true);
    expect(body.entries).toHaveLength(1);
    expect(body.mine).toBeUndefined();
  });

  it("refuses a signed-out POST", async () => {
    const { res, out } = fakeRes();
    const { deps, submits } = depsWith();
    const req = postReq({ text: "bullish" });
    await serveCouncilApi(req, res, "/api/council", deps, undefined);
    expect(out.status).toBe(403);
    expect(submits).toEqual([]);
  });

  it("requires application/json", async () => {
    const { res, out } = fakeRes();
    const { deps, submits } = depsWith();
    const req = postReq({ text: "bullish" }, "application/x-www-form-urlencoded");
    await serveCouncilApi(req, res, "/api/council", deps, member);
    expect(out.status).toBe(415);
    expect(submits).toEqual([]);
  });

  it("attributes a submitted line to the SESSION's email, never a body field", async () => {
    const { res, out } = fakeRes();
    const { deps, submits } = depsWith();
    const req = postReq({ text: "bullish", opaqueMemberId: "attacker-supplied" });
    await serveCouncilApi(req, res, "/api/council", deps, member);
    expect(submits).toHaveLength(1);
    expect(submits[0]?.memberId).not.toBe("attacker-supplied");
    expect(JSON.parse(out.body ?? "{}")).toEqual({ ok: true });
  });

  it("forwards a tagged playbookId to submitThesis", async () => {
    const { res, out } = fakeRes();
    const { deps, submits } = depsWith();
    const req = postReq({ text: "bullish", playbookId: "S1-NVDA" });
    await serveCouncilApi(req, res, "/api/council", deps, member);
    expect(submits[0]?.playbookId).toBe("S1-NVDA");
    expect(JSON.parse(out.body ?? "{}")).toEqual({ ok: true });
  });

  it("refuses an unknown playbookId via submitThesis's own validation", async () => {
    const { res, out } = fakeRes();
    const { deps, submits } = depsWith();
    const req = postReq({ text: "bullish", playbookId: "NOT-A-REAL-PLAY" });
    await serveCouncilApi(req, res, "/api/council", deps, member);
    expect(JSON.parse(out.body ?? "{}")).toEqual({
      ok: false,
      error: "Unknown play — pick one from the list.",
    });
    expect(submits).toEqual([]);
  });

  it("rejects a malformed body with 400", async () => {
    const { res, out } = fakeRes();
    const { deps } = depsWith();
    const req = postReq({ text: 7 });
    await serveCouncilApi(req, res, "/api/council", deps, member);
    expect(out.status).toBe(400);
  });
});
