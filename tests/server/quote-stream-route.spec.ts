import { EventEmitter } from "node:events";
import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import type {
  QuoteListener,
  QuoteStreamPort,
  StreamedQuote,
} from "../../src/server/quote-stream-hub.js";
import { QUOTE_STREAM_PATH, serveQuoteStream } from "../../src/server/quote-stream-route.js";

/**
 * The pushed quote (#3407 P4): identity from the session and nowhere else, every refusal a
 * sentence in JSON decided BEFORE the stream head, a hello on open, one `quote` frame per push,
 * and the subscription released when the client goes away.
 */

function fakeRes() {
  const out: {
    status?: number;
    headers?: Record<string, string>;
    chunks: string[];
    body?: string;
  } = { chunks: [] };
  const emitter = new EventEmitter();
  const res = Object.assign(emitter, {
    writeHead(status: number, headers?: Record<string, string>) {
      out.status = status;
      out.headers = headers;
      return res;
    },
    write(chunk: string) {
      out.chunks.push(chunk);
      return true;
    },
    end(body?: string) {
      out.body = body ?? "";
    },
  }) as unknown as ServerResponse;
  return { res, out };
}

function get(url: string): IncomingMessage {
  const req = Readable.from([]) as unknown as IncomingMessage;
  req.method = "GET";
  req.url = url;
  req.headers = {};
  return req;
}

const quote = (last: number): StreamedQuote => ({
  symbol: "NVDA",
  last,
  change: 1,
  changePct: 0.72,
  tone: "pos",
  asOf: "2026-10-01T15:00:00Z",
});

/** A hub that records who asked for what, and lets the spec push. */
function fakeHub(refusal?: string) {
  const asked: Array<{ requesterId: string; symbol: string }> = [];
  const listeners = new Set<QuoteListener>();
  const port: QuoteStreamPort = {
    subscribe(requesterId, symbol, listener) {
      asked.push({ requesterId, symbol });
      if (refusal) return { ok: false, reason: refusal };
      listeners.add(listener);
      return { ok: true, unsubscribe: () => listeners.delete(listener) };
    },
  };
  return {
    port,
    asked,
    listeners,
    push: (q: StreamedQuote) => {
      for (const l of listeners) l(q);
    },
  };
}

function configWith(over: Partial<DashboardServerConfig> = {}): DashboardServerConfig {
  return {
    hub: { getState: () => ({ generatedAt: "t", participants: [], collisions: [] }) },
    auth: { providerIds: ["google"] },
    resolveOwnerId: () => "human-eric",
    ...over,
  } as unknown as DashboardServerConfig;
}
const session = { email: "eric@example.com" } as never;
const url = (symbol: string) => `${QUOTE_STREAM_PATH}?symbol=${symbol}`;
const frames = (chunks: string[]) => chunks.filter((c) => c.startsWith("event:"));
const dataOf = (frame: string) => JSON.parse(frame.split("data: ")[1] ?? "{}");

describe("serveQuoteStream", () => {
  it("claims only its own path", () => {
    const { res } = fakeRes();
    expect(
      serveQuoteStream(get("/api/trade/quote"), res, "/api/trade/quote", configWith(), session),
    ).toBe(false);
  });

  it("rejects a missing or malformed symbol", () => {
    for (const bad of ["", "NVDA%20CALL", "123456789012"]) {
      const { res, out } = fakeRes();
      serveQuoteStream(get(url(bad)), res, QUOTE_STREAM_PATH, configWith(), session);
      expect(out.status).toBe(400);
    }
  });

  it("answers JSON, not an empty stream, when no hub is wired", () => {
    const { res, out } = fakeRes();
    serveQuoteStream(get(url("NVDA")), res, QUOTE_STREAM_PATH, configWith(), session);
    expect(out.status).toBe(200);
    const answer = JSON.parse(out.body ?? "{}");
    expect(answer.available).toBe(false);
    expect(answer.reason).toMatch(/wired up/);
  });

  it("answers in words when the session is linked to no account", () => {
    const { res, out } = fakeRes();
    const hub = fakeHub();
    serveQuoteStream(
      get(url("NVDA")),
      res,
      QUOTE_STREAM_PATH,
      configWith({ quoteStream: hub.port, resolveOwnerId: () => undefined }),
      session,
    );
    expect(out.status).toBe(200);
    expect(JSON.parse(out.body ?? "{}").reason).toMatch(/isn't linked/);
    // Nothing was subscribed on an unidentified caller's behalf.
    expect(hub.asked).toEqual([]);
  });

  it("relays the hub's own refusal as JSON, with no stream head written", () => {
    const { res, out } = fakeRes();
    const hub = fakeHub("no key for you");
    serveQuoteStream(
      get(url("NVDA")),
      res,
      QUOTE_STREAM_PATH,
      configWith({ quoteStream: hub.port }),
      session,
    );
    expect(JSON.parse(out.body ?? "{}")).toEqual({ available: false, reason: "no key for you" });
    expect(out.headers?.["content-type"]).not.toBe("text/event-stream");
  });

  it("subscribes as the SESSION's account, never a symbol-side parameter", () => {
    const { res } = fakeRes();
    const hub = fakeHub();
    // A caller naming someone else's account gets their own: there is no participantId to honour.
    serveQuoteStream(
      get(`${QUOTE_STREAM_PATH}?symbol=nvda&participantId=human-ann`),
      res,
      QUOTE_STREAM_PATH,
      configWith({ quoteStream: hub.port }),
      session,
    );
    expect(hub.asked).toEqual([{ requesterId: "human-eric", symbol: "NVDA" }]);
  });

  it("opens with a hello, relays each push as a quote frame, and releases on close", () => {
    const { res, out } = fakeRes();
    const hub = fakeHub();
    const req = get(url("NVDA"));

    serveQuoteStream(req, res, QUOTE_STREAM_PATH, configWith({ quoteStream: hub.port }), session);

    expect(out.status).toBe(200);
    expect(out.headers?.["content-type"]).toBe("text/event-stream");
    expect(out.chunks[0]).toContain("event: hello");
    expect(hub.listeners.size).toBe(1);

    hub.push(quote(141));
    const sent = frames(out.chunks).filter((c) => c.includes("event: quote"));
    expect(sent).toHaveLength(1);
    expect(dataOf(sent[0] ?? "")).toMatchObject({
      symbol: "NVDA",
      last: 141,
      asOf: expect.any(String),
    });

    req.emit("close");
    expect(hub.listeners.size).toBe(0);
    hub.push(quote(142));
    expect(frames(out.chunks).filter((c) => c.includes("event: quote"))).toHaveLength(1);
  });

  it("holds a frame the hub delivers during subscribe and flushes it after the head", () => {
    // The hub hands a joiner the state it already holds, synchronously inside `subscribe` — before
    // the stream head exists. Dropping it would leave a quiet name blank until its next print.
    const { res, out } = fakeRes();
    const eager: QuoteStreamPort = {
      subscribe(_requesterId, _symbol, listener) {
        listener(quote(140));
        return { ok: true, unsubscribe: () => undefined };
      },
    };

    serveQuoteStream(
      get(url("NVDA")),
      res,
      QUOTE_STREAM_PATH,
      configWith({ quoteStream: eager }),
      session,
    );

    expect(out.chunks[0]).toContain("event: hello");
    expect(out.chunks[1]).toContain("event: quote");
    expect(dataOf(out.chunks[1] ?? "")).toMatchObject({ last: 140 });
  });
});
