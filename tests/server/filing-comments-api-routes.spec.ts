import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import { opaqueMemberId } from "../../src/server/feedback-issue.js";
import type { FeedbackLogEntry } from "../../src/server/feedback-log.js";
import { serveFilingCommentsApi } from "../../src/server/filing-comments-api-routes.js";
import {
  type FilingCommentsDeps,
  MAX_COMMENTS_PER_FILING,
} from "../../src/server/filing-comments-form.js";
import type { FilingComment } from "../../src/server/filing-comments-store.js";

/**
 * Issue #2224 shape 3, the EARS criterion: WHEN a member comments on a filing they did not file,
 * the system SHALL store it in the app's own store and render it on that filing's card, and SHALL
 * NOT post it to the GitHub issue or change its labels. WHERE the member is the filer, the
 * existing follow-up route SHALL remain the only in-app path onto the thread.
 *
 * The "never GitHub" half is asserted two ways: the deps carry no issue client at all, and a
 * `fetch` spy proves the whole request made zero network calls.
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

const filer = { email: "filer@example.com" } as never;
const filerId = opaqueMemberId("filer@example.com");

const filing = (issueNumber: number, by = filerId): FeedbackLogEntry => ({
  uuid: `u${issueNumber}`,
  opaqueMemberId: by,
  issueNumber,
  url: `https://github.com/ejclark/skynet-capital/issues/${issueNumber}`,
  kind: "feature",
  title: "Dark mode for the chain",
  filedAt: "2026-09-29T10:00:00.000Z",
});

function depsWith(issues: Record<string, FilingComment[]> = {}) {
  let n = 0;
  const deps: FilingCommentsDeps = {
    load: () => ({ issues }),
    add: (issue, c) => {
      issues[String(issue)] = [...(issues[String(issue)] ?? []), c];
    },
    remove: (issue, id, authorId) => {
      issues[String(issue)] = (issues[String(issue)] ?? []).filter(
        (c) => !(c.id === id && c.authorId === authorId),
      );
    },
    readFilings: () => Promise.resolve([filing(42), filing(43, "someone-else")]),
    now: () => new Date("2026-09-30T12:00:00.000Z"),
    newId: () => `c${++n}`,
  };
  return { deps, issues };
}

// Each spec posts as its own member so the shared in-memory throttle stays out of it.
let seq = 0;
const freshMember = () => {
  const email = `member${++seq}@example.com`;
  return { session: { email } as never, id: opaqueMemberId(email) };
};

describe("serveFilingCommentsApi", () => {
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

  it("ignores other paths, and answers enabled:false unwired", async () => {
    const { res, json } = fakeRes();
    expect(await serveFilingCommentsApi(getReq(), res, "/api/feedback", undefined, filer)).toBe(
      false,
    );
    expect(
      await serveFilingCommentsApi(getReq(), res, "/api/feedback/comments", undefined, filer),
    ).toBe(true);
    expect(json()).toEqual({ enabled: false });
  });

  it("stores a comment on someone else's filing with ZERO GitHub fetches", async () => {
    const { deps, issues } = depsWith();
    const { session, id } = freshMember();
    const { res, json } = fakeRes();
    await serveFilingCommentsApi(
      postReq({ issueNumber: 42, text: "  I want this too  " }),
      res,
      "/api/feedback/comments",
      deps,
      session,
    );
    expect(json()).toEqual({ ok: true });
    expect(issues["42"]).toEqual([
      { id: "c1", authorId: id, text: "I want this too", at: "2026-09-30T12:00:00.000Z" },
    ]);
    expect(fetches).toBe(0);
  });

  it("renders it back on the filing, marked mine only for its author", async () => {
    const { deps } = depsWith({
      "42": [{ id: "c1", authorId: "x", text: "older", at: "2026-09-30T09:00:00.000Z" }],
    });
    const { session, id } = freshMember();
    await serveFilingCommentsApi(
      postReq({ issueNumber: 42, text: "newer" }),
      fakeRes().res,
      "/api/feedback/comments",
      deps,
      session,
    );
    const { res, json } = fakeRes();
    await serveFilingCommentsApi(getReq(), res, "/api/feedback/comments", deps, session);
    const view = json();
    expect(view.enabled).toBe(true);
    expect(
      view.comments["42"].map((c: { text: string; mine: boolean }) => [c.text, c.mine]),
    ).toEqual([
      ["older", false],
      ["newer", true],
    ]);
    // No author id ever leaves the server — `mine` is the only authorship on the wire.
    expect(JSON.stringify(view)).not.toContain(id);
    expect(view.ownFilings).toEqual([]);
    expect(fetches).toBe(0);
  });

  it("refuses the filer — their words go on the thread via Follow up, not here", async () => {
    const { deps, issues } = depsWith();
    const { res, json } = fakeRes();
    await serveFilingCommentsApi(
      postReq({ issueNumber: 42, text: "adding context" }),
      res,
      "/api/feedback/comments",
      deps,
      filer,
    );
    expect(json().ok).toBe(false);
    expect(json().error).toMatch(/Follow up/);
    expect(issues["42"]).toBeUndefined();
    const view = fakeRes();
    await serveFilingCommentsApi(getReq(), view.res, "/api/feedback/comments", deps, filer);
    expect(view.json().ownFilings).toEqual([42]);
  });

  it("refuses an unknown filing, empty text, over-length text and a full thread", async () => {
    const full = Array.from({ length: MAX_COMMENTS_PER_FILING }, (_, i) => ({
      id: `f${i}`,
      authorId: "x",
      text: "t",
      at: "2026-09-30T09:00:00.000Z",
    }));
    const { deps } = depsWith({ "43": full });
    const cases = [
      { issueNumber: 999, text: "hi" },
      { issueNumber: 42, text: "‮\n " },
      { issueNumber: 42, text: "x".repeat(501) },
      { issueNumber: 43, text: "one more" },
    ];
    for (const body of cases) {
      const { res, json } = fakeRes();
      await serveFilingCommentsApi(
        postReq(body),
        res,
        "/api/feedback/comments",
        deps,
        freshMember().session,
      );
      expect(json().ok).toBe(false);
    }
  });

  it("strips bidi overrides and folds control characters to one line", async () => {
    const { deps, issues } = depsWith();
    await serveFilingCommentsApi(
      postReq({ issueNumber: 42, text: "a‮b\n\nc" }),
      fakeRes().res,
      "/api/feedback/comments",
      deps,
      freshMember().session,
    );
    expect(issues["42"]?.[0]?.text).toBe("ab c");
  });

  it("refuses a signed-out post and a malformed body", async () => {
    const { deps } = depsWith();
    const signedOut = fakeRes();
    await serveFilingCommentsApi(
      postReq({ issueNumber: 42, text: "hi" }),
      signedOut.res,
      "/api/feedback/comments",
      deps,
      undefined,
    );
    expect(signedOut.out.status).toBe(403);
    for (const body of [
      { issueNumber: "42", text: "hi" },
      { issueNumber: 42 },
      { issueNumber: -1 },
    ]) {
      const { res, out } = fakeRes();
      await serveFilingCommentsApi(
        postReq(body),
        res,
        "/api/feedback/comments",
        deps,
        freshMember().session,
      );
      expect(out.status).toBe(400);
    }
  });

  it("lets a member delete only their own comment", async () => {
    const { deps, issues } = depsWith();
    const author = freshMember();
    await serveFilingCommentsApi(
      postReq({ issueNumber: 42, text: "mine" }),
      fakeRes().res,
      "/api/feedback/comments",
      deps,
      author.session,
    );
    await serveFilingCommentsApi(
      postReq({ issueNumber: 42, remove: "c1" }),
      fakeRes().res,
      "/api/feedback/comments",
      deps,
      freshMember().session,
    );
    expect(issues["42"]).toHaveLength(1);
    await serveFilingCommentsApi(
      postReq({ issueNumber: 42, remove: "c1" }),
      fakeRes().res,
      "/api/feedback/comments",
      deps,
      author.session,
    );
    expect(issues["42"]).toEqual([]);
    expect(fetches).toBe(0);
  });

  it("throttles a burst from one member", async () => {
    const { deps } = depsWith();
    const { session } = freshMember();
    const statuses: (number | undefined)[] = [];
    for (let i = 0; i < 6; i += 1) {
      const { res, out } = fakeRes();
      await serveFilingCommentsApi(
        postReq({ issueNumber: 42, text: `n${i}` }),
        res,
        "/api/feedback/comments",
        deps,
        session,
      );
      statuses.push(out.status);
    }
    expect(statuses.at(-1)).toBe(429);
  });
});
