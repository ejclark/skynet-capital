import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { serveFeedbackApi } from "../../src/server/feedback-api-routes.js";
import { opaqueMemberId } from "../../src/server/feedback-issue.js";

/**
 * Feedback's JSON twin: the member's history resolves through their own opaque id, a missing
 * kind is refused (never guessed — #645), follow-ups bind to the member's own filings, and the
 * submitter identity is the session's, never the body's.
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

function post(body: unknown): IncomingMessage {
  const req = Readable.from([Buffer.from(JSON.stringify(body))]) as unknown as IncomingMessage;
  req.method = "POST";
  req.headers = { "content-type": "application/json" };
  return req;
}

function get(): IncomingMessage {
  return { method: "GET", headers: {} } as unknown as IncomingMessage;
}

// A distinct email per suite run keeps the module-level throttle from crossing specs.
const email = `spec-${Math.random().toString(36).slice(2)}@example.com`;
const session = { email, name: "Eric Clark" } as never;

function configWith(over: Record<string, unknown> = {}): DashboardServerConfig {
  return { hub: { getState: () => ({ participants: [] }) }, ...over } as never;
}

const entry = (issueNumber: number, title: string) => ({
  uuid: `u${issueNumber}`,
  opaqueMemberId: opaqueMemberId(email),
  issueNumber,
  url: `https://github.com/x/y/issues/${issueNumber}`,
  kind: "bug" as const,
  title,
  filedAt: "2026-08-28T12:00:00Z",
});

describe("serveFeedbackApi", () => {
  it("serves the member's own history with statuses on GET", async () => {
    const asked: string[] = [];
    const config = configWith({
      submitFeedback: () => undefined,
      readFeedback: (id: string) => {
        asked.push(id);
        return Promise.resolve([entry(7, "It broke")]);
      },
      fetchFeedbackStatus: () => Promise.resolve(new Map([[7, "shipped"]])),
    });
    const { res, out } = fakeRes();
    await serveFeedbackApi(get(), res, "/api/feedback", config, session);
    const body = JSON.parse(out.body ?? "{}");
    expect(asked).toEqual([opaqueMemberId(email)]); // the session's opaque id, never a client value
    expect(body.enabled).toBe(true);
    expect(body.recent).toEqual([
      {
        issueNumber: 7,
        title: "It broke",
        kind: "bug",
        filedAt: "2026-08-28T12:00:00Z",
        url: "https://github.com/x/y/issues/7",
        status: "shipped",
      },
    ]);
  });

  it("refuses a missing kind instead of guessing (#645)", async () => {
    const filed: unknown[] = [];
    const config = configWith({ submitFeedback: (i: unknown) => filed.push(i) });
    const { res, out } = fakeRes();
    await serveFeedbackApi(
      post({ title: "x", details: "y" }),
      res,
      "/api/feedback",
      config,
      session,
    );
    expect(out.status).toBe(400);
    expect(filed).toEqual([]);
  });

  it("files with the SESSION's identity and records the log entry", async () => {
    const filed: { submitterEmail?: string }[] = [];
    const recorded: { opaqueMemberId: string }[] = [];
    const config = configWith({
      submitFeedback: (input: { submitterEmail?: string }) => {
        filed.push(input);
        return Promise.resolve({ ok: true, url: "https://github.com/x/y/issues/9", number: 9 });
      },
      recordFeedback: (e: { opaqueMemberId: string }) => {
        recorded.push(e);
        return Promise.resolve();
      },
    });
    const { res, out } = fakeRes();
    const body = { kind: "bug", title: "It broke", details: "how", submitterEmail: "attacker@x" };
    await serveFeedbackApi(post(body), res, "/api/feedback", config, session);
    expect(filed[0]?.submitterEmail).toBe(email); // the body's claim is dropped
    expect(recorded[0]?.opaqueMemberId).toBe(opaqueMemberId(email));
    expect(JSON.parse(out.body ?? "{}")).toEqual({
      ok: true,
      url: "https://github.com/x/y/issues/9",
      number: 9,
    });
  });

  it("binds follow-ups to the member's OWN filings — a foreign number is refused", async () => {
    const sent: unknown[] = [];
    const config = configWith({
      readFeedback: () => Promise.resolve([entry(7, "Mine")]),
      submitFollowup: (i: unknown) => {
        sent.push(i);
        return Promise.resolve({ ok: true });
      },
    });
    const { res, out } = fakeRes();
    await serveFeedbackApi(
      post({ issueNumber: 999, details: "sneaky" }),
      res,
      "/api/feedback/followup",
      config,
      session,
    );
    expect(sent).toEqual([]);
    expect(JSON.parse(out.body ?? "{}").error).toContain("your own filings");

    const ok = fakeRes();
    await serveFeedbackApi(
      post({ issueNumber: 7, details: "more info" }),
      ok.res,
      "/api/feedback/followup",
      config,
      session,
    );
    expect(sent).toEqual([
      { issueNumber: 7, body: "more info", submitterEmail: email, submitterName: "Eric Clark" },
    ]);
  });

  it("relays a filing failure with a 502, verbatim, and never records a log entry", async () => {
    const recorded: unknown[] = [];
    const config = configWith({
      submitFeedback: () => Promise.resolve({ ok: false, error: "GitHub said no" }),
      recordFeedback: (e: unknown) => {
        recorded.push(e);
        return Promise.resolve();
      },
    });
    const { res, out } = fakeRes();
    await serveFeedbackApi(
      post({ kind: "bug", title: "x", details: "y" }),
      res,
      "/api/feedback",
      config,
      session,
    );
    expect(out.status).toBe(502);
    expect(JSON.parse(out.body ?? "{}")).toEqual({ ok: false, error: "GitHub said no" });
    expect(recorded).toEqual([]);
  });

  it("answers an unwired deployment honestly, without touching anything", async () => {
    const { res, out } = fakeRes();
    await serveFeedbackApi(
      post({ kind: "bug", title: "x", details: "y" }),
      res,
      "/api/feedback",
      configWith(),
      session,
    );
    expect(JSON.parse(out.body ?? "{}").error).toContain("isn't switched on");
  });
});
