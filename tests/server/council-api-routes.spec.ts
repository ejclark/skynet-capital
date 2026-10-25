import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import { serveCouncilApi } from "../../src/server/council-api-routes.js";
import type { CouncilDeps } from "../../src/server/council-form.js";

/**
 * `/api/council`'s HTTP layer since the Council retired (#5992): unwired answers `{enabled:false}`,
 * a signed-out GET still sees the stored week (the auth gate already ran), and no write of any kind
 * reaches the store.
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
  const retracts: { week: string; memberId: string }[] = [];
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
    retract: (week, memberId) => {
      retracts.push({ week, memberId });
      const { [memberId]: _gone, ...rest } = weeks[week] ?? {};
      weeks[week] = rest;
    },
    now: () => new Date("2026-09-07T12:00:00.000Z"),
  };
  return { deps, submits, retracts };
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

  // #5992 — the Council is retired: every write answers 410 and touches no store, while the stored
  // lines stay readable (archived, never deleted).
  it("refuses every write with 410, signed in or out, and leaves the stored lines in place", async () => {
    const stored = { abc: { text: "bullish", at: "2026-09-07T12:00:00.000Z" } };
    const { deps, submits, retracts } = depsWith({ "2026-W37": stored });
    for (const [body, session] of [
      [{ text: "bullish" }, member],
      [{ text: "bullish", playbookId: "S1-NVDA" }, member],
      [{ retract: true }, member],
      [{ text: "bullish" }, undefined],
    ] as const) {
      const { res, out } = fakeRes();
      expect(await serveCouncilApi(postReq(body), res, "/api/council", deps, session)).toBe(true);
      expect(out.status).toBe(410);
      expect(JSON.parse(out.body ?? "{}")).toEqual({
        ok: false,
        error: "The Council is retired — write your thesis into a playbook, where it gets tested.",
      });
    }
    expect(submits).toEqual([]);
    expect(retracts).toEqual([]);
    const read = fakeRes();
    await serveCouncilApi(getReq(), read.res, "/api/council", deps, member);
    expect(JSON.parse(read.out.body ?? "{}").entries).toHaveLength(1);
  });

  it("refuses a write even where no store is wired", async () => {
    const { res, out } = fakeRes();
    await serveCouncilApi(postReq({ text: "bullish" }), res, "/api/council", undefined, member);
    expect(out.status).toBe(410);
  });
});
