import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import { serveCouncilRepliesApi } from "../../src/server/council-replies-api-routes.js";
import type { CouncilRepliesDeps } from "../../src/server/council-replies-form.js";
import type { CouncilReply } from "../../src/server/council-replies-store.js";
import { opaqueMemberId } from "../../src/server/feedback-issue.js";

/**
 * `/api/council/replies` (#5097, #2224 option A) — the HTTP layer: unwired answers
 * `{enabled:false}`, the session's own email is the only identity a reply is ever attributed to,
 * a signed-out post is refused, the body is bounded, a burst is throttled, and nothing here
 * reaches the network (no AI, no GitHub — the same posture as comments on a filing).
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

function depsWith() {
  const replies: Record<string, CouncilReply[]> = {};
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

  it("stores a reply under the line as the session's member, and reads it back", async () => {
    const { deps, replies } = depsWith();
    const { session, id } = freshMember();
    const post = fakeRes();
    await serveCouncilRepliesApi(
      postReq({ lineId: lineWriter, lineAt: LINE_AT, text: " The ruling isn't until November " }),
      post.res,
      PATH,
      deps,
      session,
    );
    expect(post.json()).toEqual({ ok: true });
    expect(replies[lineWriter]?.[0]).toMatchObject({
      authorId: id,
      text: "The ruling isn't until November",
      lineAt: LINE_AT,
    });

    const read = fakeRes();
    await serveCouncilRepliesApi(getReq(), read.res, PATH, deps, session);
    const view = read.json();
    expect(view.enabled).toBe(true);
    expect(view.week).toBe("2026-W41");
    expect(view.replies[lineWriter]).toEqual([
      {
        id: "r1",
        text: "The ruling isn't until November",
        at: "2026-10-07T12:00:00.000Z",
        mine: true,
        byLineAuthor: false,
        earlierLine: false,
      },
    ]);
    expect(JSON.stringify(view)).not.toContain(id);
    expect(fetches).toBe(0);
  });

  it("never takes the author from the body", async () => {
    const { deps, replies } = depsWith();
    const { session, id } = freshMember();
    await serveCouncilRepliesApi(
      postReq({ lineId: lineWriter, lineAt: LINE_AT, text: "hi", authorId: "forged" }),
      fakeRes().res,
      PATH,
      deps,
      session,
    );
    expect(replies[lineWriter]?.[0]?.authorId).toBe(id);
  });

  it("refuses a signed-out post and a malformed body", async () => {
    const { deps, replies } = depsWith();
    const signedOut = fakeRes();
    await serveCouncilRepliesApi(
      postReq({ lineId: lineWriter, lineAt: LINE_AT, text: "hi" }),
      signedOut.res,
      PATH,
      deps,
      undefined,
    );
    expect(signedOut.out.status).toBe(403);
    for (const body of [
      { lineAt: LINE_AT, text: "hi" },
      { lineId: 7, lineAt: LINE_AT, text: "hi" },
      { lineId: lineWriter, text: "hi" },
      { lineId: lineWriter, lineAt: LINE_AT },
      { lineId: "x".repeat(101), lineAt: LINE_AT, text: "hi" },
    ]) {
      const { res, out } = fakeRes();
      await serveCouncilRepliesApi(postReq(body), res, PATH, deps, freshMember().session);
      expect(out.status).toBe(400);
    }
    expect(replies).toEqual({});
  });

  it("lets a member delete only their own reply", async () => {
    const { deps, replies } = depsWith();
    const author = freshMember();
    await serveCouncilRepliesApi(
      postReq({ lineId: lineWriter, lineAt: LINE_AT, text: "mine" }),
      fakeRes().res,
      PATH,
      deps,
      author.session,
    );
    await serveCouncilRepliesApi(
      postReq({ lineId: lineWriter, remove: "r1" }),
      fakeRes().res,
      PATH,
      deps,
      freshMember().session,
    );
    expect(replies[lineWriter]).toHaveLength(1);
    const removed = fakeRes();
    await serveCouncilRepliesApi(
      postReq({ lineId: lineWriter, remove: "r1" }),
      removed.res,
      PATH,
      deps,
      author.session,
    );
    expect(removed.json()).toEqual({ ok: true });
    expect(replies[lineWriter]).toEqual([]);
  });

  it("throttles a burst from one member", async () => {
    const { deps } = depsWith();
    const { session } = freshMember();
    const statuses: (number | undefined)[] = [];
    for (let i = 0; i < 6; i += 1) {
      const { res, out } = fakeRes();
      await serveCouncilRepliesApi(
        postReq({ lineId: lineWriter, lineAt: LINE_AT, text: `n${i}` }),
        res,
        PATH,
        deps,
        session,
      );
      statuses.push(out.status);
    }
    expect(statuses.at(-1)).toBe(429);
  });
});
