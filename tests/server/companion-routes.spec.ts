import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import type { CompanionHandlers, CompanionTurn } from "../../src/companion/companion-chat.js";
import { serveCompanionApi } from "../../src/server/companion-routes.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";

/**
 * THE COMPANION'S AUTH INVARIANT, proven at the route layer (criterion c, #467): a request with
 * no signed-in `Session` never reaches the turn function, never gets a response written at all —
 * the route answers `false`, the same as any path this dispatcher doesn't recognize, so an
 * unauthed visitor can't even tell the surface exists (no 401, no redirect FROM this file — that
 * already happened upstream in `gateRequest`; this is the belt for the legacy password mode).
 */

function fakeRes() {
  const out: {
    status?: number;
    headers?: Record<string, string>;
    body?: string;
    chunks: string[];
  } = {
    chunks: [],
  };
  const res = {
    writeHead: (status: number, headers?: Record<string, string>) => {
      out.status = status;
      out.headers = headers;
      return res;
    },
    write: (chunk: string) => {
      out.chunks.push(chunk);
      return true;
    },
    end: (body?: string) => {
      if (body !== undefined) out.body = body;
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

const email = () => `spec-${Math.random().toString(36).slice(2)}@example.com`;
const sessionFor = (mail: string) => ({ email: mail, name: "A Member" }) as never;

function configWith(over: Partial<DashboardServerConfig> = {}): DashboardServerConfig {
  return { hub: { getState: () => ({ participants: [] }) }, ...over } as never;
}

describe("serveCompanionApi — the auth invariant", () => {
  it("the route doesn't exist for an unauthed visitor — GET", async () => {
    const { res, out } = fakeRes();
    const handled = await serveCompanionApi(get(), res, "/api/companion", configWith(), undefined);
    expect(handled).toBe(false);
    expect(out.status).toBeUndefined(); // nothing was ever written
  });

  it("the route doesn't exist for an unauthed visitor — POST chat", async () => {
    let called = false;
    const config = configWith({
      companion: (() => {
        called = true;
        return Promise.resolve();
      }) as CompanionTurn,
    });
    const { res, out } = fakeRes();
    const handled = await serveCompanionApi(
      post({ messages: [{ role: "user", content: "hi" }] }),
      res,
      "/api/companion/chat",
      config,
      undefined,
    );
    expect(handled).toBe(false);
    expect(out.status).toBeUndefined();
    expect(called).toBe(false); // the turn function is never even invoked
  });

  it("an unmapped path is untouched regardless of session", async () => {
    const { res } = fakeRes();
    expect(
      await serveCompanionApi(get(), res, "/api/other", configWith(), sessionFor(email())),
    ).toBe(false);
  });
});

describe("serveCompanionApi — GET /api/companion (the index)", () => {
  it("answers honestly when the key isn't set", async () => {
    const { res, out } = fakeRes();
    await serveCompanionApi(get(), res, "/api/companion", configWith(), sessionFor(email()));
    expect(JSON.parse(out.body ?? "{}")).toMatchObject({ enabled: false });
  });

  it("reports enabled, plus the disclosure and tour, once a turn function is wired", async () => {
    const { res, out } = fakeRes();
    const config = configWith({ companion: (() => Promise.resolve()) as CompanionTurn });
    await serveCompanionApi(get(), res, "/api/companion", config, sessionFor(email()));
    const body = JSON.parse(out.body ?? "{}");
    expect(body.enabled).toBe(true);
    expect(typeof body.disclosure).toBe("string");
    expect(body.disclosure.toLowerCase()).toContain("not financial advice");
    expect(Array.isArray(body.firstTradeTour)).toBe(true);
  });
});

describe("serveCompanionApi — POST /api/companion/chat", () => {
  it("answers honestly when the companion isn't switched on", async () => {
    const { res, out } = fakeRes();
    await serveCompanionApi(
      post({ messages: [{ role: "user", content: "hi" }] }),
      res,
      "/api/companion/chat",
      configWith(),
      sessionFor(email()),
    );
    expect(JSON.parse(out.body ?? "{}")).toEqual({
      ok: false,
      error: "The companion isn't switched on yet.",
    });
  });

  it("refuses an empty message list before ever calling the turn function", async () => {
    let called = false;
    const config = configWith({
      companion: (() => {
        called = true;
        return Promise.resolve();
      }) as CompanionTurn,
    });
    const { res, out } = fakeRes();
    await serveCompanionApi(
      post({ messages: [] }),
      res,
      "/api/companion/chat",
      config,
      sessionFor(email()),
    );
    expect(out.status).toBe(400);
    expect(called).toBe(false);
  });

  it("opens an SSE stream and relays the turn's text/done events as delta/done frames", async () => {
    const captured: unknown[] = [];
    const config = configWith({
      companion: ((input, handlers: CompanionHandlers) => {
        captured.push(input);
        handlers.onText("Hel");
        handlers.onText("lo");
        handlers.onDone();
        return Promise.resolve();
      }) as CompanionTurn,
    });
    const { res, out } = fakeRes();
    await serveCompanionApi(
      post({ messages: [{ role: "user", content: "hi" }] }),
      res,
      "/api/companion/chat",
      config,
      sessionFor(email()),
    );
    expect(out.headers).toMatchObject({ "content-type": "text/event-stream" });
    expect(out.chunks.some((c) => c.includes("event: delta") && c.includes("Hel"))).toBe(true);
    expect(out.chunks.some((c) => c.includes("event: done"))).toBe(true);
  });

  it("relays a turn-function error as an error frame and ends the stream", async () => {
    const config = configWith({
      companion: ((_input, handlers: CompanionHandlers) => {
        handlers.onError("companion unreachable");
        return Promise.resolve();
      }) as CompanionTurn,
    });
    const { res, out } = fakeRes();
    await serveCompanionApi(
      post({ messages: [{ role: "user", content: "hi" }] }),
      res,
      "/api/companion/chat",
      config,
      sessionFor(email()),
    );
    expect(
      out.chunks.some((c) => c.includes("event: error") && c.includes("companion unreachable")),
    ).toBe(true);
  });

  it("resolves the SESSION's own linked desk — never a client-supplied id", async () => {
    const mail = email();
    let seenParticipantId: string | undefined = "unset";
    const config = configWith({
      resolveOwnerId: (e: string) => (e === mail ? "acct-42" : undefined),
      companion: ((input) => {
        seenParticipantId = input.participantId;
        return Promise.resolve();
      }) as CompanionTurn,
    });
    const { res } = fakeRes();
    await serveCompanionApi(
      post({ messages: [{ role: "user", content: "hi" }], participantId: "someone-elses-account" }),
      res,
      "/api/companion/chat",
      config,
      sessionFor(mail),
    );
    expect(seenParticipantId).toBe("acct-42"); // the body's claimed id is ignored entirely
  });

  it("omits participantId when the session owns no linked desk", async () => {
    let sawKey = true;
    const config = configWith({
      companion: ((input) => {
        sawKey = "participantId" in input;
        return Promise.resolve();
      }) as CompanionTurn,
    });
    const { res } = fakeRes();
    await serveCompanionApi(
      post({ messages: [{ role: "user", content: "hi" }] }),
      res,
      "/api/companion/chat",
      config,
      sessionFor(email()),
    );
    expect(sawKey).toBe(false);
  });

  it("throttles a burst from the same member without touching the turn function", async () => {
    const mail = email();
    let calls = 0;
    const config = configWith({
      companion: (() => {
        calls++;
        return Promise.resolve();
      }) as CompanionTurn,
    });
    for (let i = 0; i < 41; i++) {
      const { res } = fakeRes();
      await serveCompanionApi(
        post({ messages: [{ role: "user", content: "hi" }] }),
        res,
        "/api/companion/chat",
        config,
        sessionFor(mail),
      );
    }
    expect(calls).toBeLessThan(41); // the burst cap (40) kicked in before the last one
  });
});

describe("serveCompanionApi — POST /api/companion/ack", () => {
  it("the route doesn't exist for an unauthed visitor", async () => {
    const { res, out } = fakeRes();
    const handled = await serveCompanionApi(
      post({}),
      res,
      "/api/companion/ack",
      configWith(),
      undefined,
    );
    expect(handled).toBe(false);
    expect(out.status).toBeUndefined();
  });

  it("records the member's first message and answers ok — no companion required", async () => {
    const recorded: string[] = [];
    const config = configWith({
      readMessages: () => Promise.resolve([]),
      recordMessage: (id) => {
        recorded.push(id);
        return Promise.resolve();
      },
    });
    const { res, out } = fakeRes();
    await serveCompanionApi(post({}), res, "/api/companion/ack", config, sessionFor(email()));
    expect(JSON.parse(out.body ?? "{}")).toEqual({ ok: true });
    expect(recorded).toHaveLength(1);
  });

  it("never records twice for a member who already has an entry", async () => {
    let calls = 0;
    const config = configWith({
      readMessages: () => Promise.resolve([{ opaqueMemberId: "x", at: "2026-09-01T00:00:00Z" }]),
      recordMessage: () => {
        calls++;
        return Promise.resolve();
      },
    });
    const { res } = fakeRes();
    await serveCompanionApi(post({}), res, "/api/companion/ack", config, sessionFor(email()));
    expect(calls).toBe(0);
  });
});
