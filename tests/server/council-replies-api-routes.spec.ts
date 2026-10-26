import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import { serveCouncilRepliesApi } from "../../src/server/council-replies-api-routes.js";
import type { CouncilRepliesDeps } from "../../src/server/council-replies-form.js";
import type { CouncilReply } from "../../src/server/council-replies-store.js";
import { opaqueMemberId } from "../../src/server/feedback-issue.js";

/**
 * `/api/council/replies` (#5097, #2224 option A) — the HTTP layer since the Council retired
 * (#5992): unwired answers `{enabled:false}`, the stored threads still read back pseudonymous, no
 * write of any kind reaches the store, and nothing here reaches the network.
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
  return { res, out, json: () => JSON.parse(out.body ?? "{}") };
}

const getReq = () => ({ method: "GET", headers: {} }) as unknown as IncomingMessage;

function postReq(body: unknown): IncomingMessage {
  const req = Readable.from([Buffer.from(JSON.stringify(body))]) as unknown as IncomingMessage;
  req.method = "POST";
  req.headers = { "content-type": "application/json" };
  return req;
}

const PATH = "/api/council/replies";
const LINE_AT = "2026-10-05T09:00:00.000Z";
const lineWriter = opaqueMemberId("writer@example.com");

function depsWith(seed: Record<string, CouncilReply[]> = {}) {
  const replies: Record<string, CouncilReply[]> = { ...seed };
  let n = 0;
  const deps: CouncilRepliesDeps = {
    load: () => ({ weeks: { "2026-W41": replies } }),
    add: (_week, lineId, r) => {
      replies[lineId] = [...(replies[lineId] ?? []), r];
    },
    remove: (_week, lineId, replyId, authorId) => {
      replies[lineId] = (replies[lineId] ?? []).filter(
        (r) => !(r.id === replyId && r.authorId === authorId),
      );
    },
    loadCouncil: () => ({
      weeks: { "2026-W41": { [lineWriter]: { text: "GOOG chops all week", at: LINE_AT } } },
    }),
    now: () => new Date("2026-10-07T12:00:00.000Z"),
    newId: () => `r${++n}`,
  };
  return { deps, replies };
}

// Each spec posts as its own member so the shared in-memory throttle stays out of it.
let seq = 0;
const freshMember = () => {
  const email = `replier${++seq}@example.com`;
  return { session: { email } as never, id: opaqueMemberId(email) };
};

describe("serveCouncilRepliesApi", () => {
  const realFetch = globalThis.fetch;
  let fetches = 0;
  beforeEach(() => {
    fetches = 0;
    globalThis.fetch = (() => {
      fetches += 1;
      return Promise.reject(new Error("no network in this route"));
    }) as typeof fetch;
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("ignores other paths — the Council's own included — and answers enabled:false unwired", async () => {
    const { deps } = depsWith();
    const { res, json } = fakeRes();
    expect(await serveCouncilRepliesApi(getReq(), res, "/api/council", deps, undefined)).toBe(
      false,
    );
    expect(await serveCouncilRepliesApi(getReq(), res, PATH, undefined, undefined)).toBe(true);
    expect(json()).toEqual({ enabled: false });
  });

  it("reads back the stored threads, pseudonymous", async () => {
    const { deps } = depsWith({
      [lineWriter]: [
        {
          id: "r1",
          authorId: "someone",
          text: "The ruling isn't until November",
          at: LINE_AT,
          lineAt: LINE_AT,
        },
      ],
    });
    const read = fakeRes();
    await serveCouncilRepliesApi(getReq(), read.res, PATH, deps, freshMember().session);
    const view = read.json();
    expect(view.enabled).toBe(true);
    expect(view.week).toBe("2026-W41");
    expect(view.replies[lineWriter]).toHaveLength(1);
    expect(JSON.stringify(view)).not.toContain("someone");
    expect(fetches).toBe(0);
  });

  // #5992 — retired with the Council: a new reply and a take-back both answer 410, the store
  // untouched, whether or not it is wired.
  it("refuses every write with 410 and leaves the stored replies in place", async () => {
    const stored: CouncilReply = {
      id: "r1",
      authorId: "someone",
      text: "kept",
      at: LINE_AT,
      lineAt: LINE_AT,
    };
    const { deps, replies } = depsWith({ [lineWriter]: [stored] });
    const author = freshMember();
    for (const [body, session] of [
      [{ lineId: lineWriter, lineAt: LINE_AT, text: "hi" }, author.session],
      [{ lineId: lineWriter, remove: "r1" }, author.session],
      [{ lineId: lineWriter, lineAt: LINE_AT, text: "hi" }, undefined],
    ] as const) {
      const { res, out } = fakeRes();
      expect(await serveCouncilRepliesApi(postReq(body), res, PATH, deps, session)).toBe(true);
      expect(out.status).toBe(410);
    }
    const unwired = fakeRes();
    await serveCouncilRepliesApi(postReq({}), unwired.res, PATH, undefined, author.session);
    expect(unwired.out.status).toBe(410);
    expect(replies[lineWriter]).toEqual([stored]);
    expect(fetches).toBe(0);
  });
});
