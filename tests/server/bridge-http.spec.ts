import type { IncomingMessage, ServerResponse } from "node:http";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { Readable } from "node:stream";
import {
  INSIGHTS_BRIDGE_SECRET_HEADER,
  INSIGHTS_BRIDGE_SHARED_SECRET,
} from "../../src/autonomous/insight-record.js";
import {
  handleBridgePost,
  MAX_BODY_BYTES,
  readBoundedBody,
  respond,
} from "../../src/server/bridge-http.js";

// The plumbing every bots -> app bridge route shares. Specced through a real HTTP server (the
// per-route listeners only reach it indirectly) and, for the body reader, through fake streams so
// a mid-body stream failure can be forced.

type Route = Parameters<typeof handleBridgePost>[2];

interface Reply {
  readonly status: number;
  readonly headers: Headers;
  readonly json: Record<string, unknown>;
}

async function withServer(
  handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>,
  run: (base: string) => Promise<void>,
): Promise<void> {
  const server = createServer((req, res) => {
    void handler(req, res);
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

async function toReply(res: Response): Promise<Reply> {
  return {
    status: res.status,
    headers: res.headers,
    json: (await res.json()) as Record<string, unknown>,
  };
}

/** A route that accepts any object and reports what it was given. */
function echoRoute(overrides: Partial<Route> = {}): { route: Route; accepted: unknown[] } {
  const accepted: unknown[] = [];
  const route: Route = {
    name: "echo",
    maxBytes: 1024,
    parse: (value) => (typeof value === "object" && value !== null ? value : undefined),
    invalid: "invalid echo",
    accept: (value) => {
      accepted.push(value);
      return {};
    },
    ...overrides,
  };
  return { route, accepted };
}

const authed = (extra: RequestInit = {}): RequestInit => ({
  method: "POST",
  ...extra,
  headers: { [INSIGHTS_BRIDGE_SECRET_HEADER]: INSIGHTS_BRIDGE_SHARED_SECRET },
});

async function bridgePost(route: Route, init: RequestInit): Promise<Reply> {
  let reply: Reply | undefined;
  await withServer(
    (req, res) => handleBridgePost(req, res, route),
    async (base) => {
      reply = await toReply(await fetch(base, init));
    },
  );
  if (!reply) throw new Error("no reply");
  return reply;
}

/** A request body stream standing in for `IncomingMessage` (only `.on` is ever used). */
const streamOf = (...chunks: Buffer[]): IncomingMessage =>
  Readable.from(chunks, { objectMode: false }) as unknown as IncomingMessage;

describe("respond", () => {
  it("writes the status and the body as UTF-8 JSON", async () => {
    await withServer(
      (_req, res) => respond(res, 418, { error: "teapot", n: 3 }),
      async (base) => {
        const reply = await toReply(await fetch(base));
        expect(reply.status).toBe(418);
        expect(reply.headers.get("content-type")).toBe("application/json; charset=utf-8");
        expect(reply.json).toEqual({ error: "teapot", n: 3 });
      },
    );
  });
});

describe("readBoundedBody", () => {
  describe("when the body fits under the cap", () => {
    it("joins every chunk into one string", async () => {
      const result = await readBoundedBody(streamOf(Buffer.from('{"a":'), Buffer.from("1}")), 100);
      expect(result).toEqual({ ok: true, body: '{"a":1}' });
    });

    it("decodes a multi-byte character split across chunks", async () => {
      const bytes = Buffer.from("héllo", "utf8");
      const result = await readBoundedBody(streamOf(bytes.subarray(0, 2), bytes.subarray(2)), 100);
      expect(result).toEqual({ ok: true, body: "héllo" });
    });

    it("returns an empty string for a request with no body", async () => {
      expect(await readBoundedBody(streamOf(), 100)).toEqual({ ok: true, body: "" });
    });

    it("accepts a body of exactly the cap", async () => {
      const result = await readBoundedBody(streamOf(Buffer.alloc(10, "x")), 10);
      expect(result).toEqual({ ok: true, body: "x".repeat(10) });
    });
  });

  describe("when the body crosses the cap", () => {
    it("reports too-large once the stream finishes, even when the overflow is one byte", async () => {
      const result = await readBoundedBody(streamOf(Buffer.alloc(11, "x")), 10);
      expect(result).toEqual({ ok: false, reason: "too-large" });
    });

    it("stays too-large when the overflow arrives in a later chunk", async () => {
      const result = await readBoundedBody(
        streamOf(Buffer.alloc(6, "x"), Buffer.alloc(6, "y"), Buffer.alloc(1, "z")),
        10,
      );
      expect(result).toEqual({ ok: false, reason: "too-large" });
    });
  });

  describe("when no cap is given", () => {
    it("uses the 16 KB small-insight cap", async () => {
      expect(MAX_BODY_BYTES).toBe(16 * 1024);
      const atCap = await readBoundedBody(streamOf(Buffer.alloc(MAX_BODY_BYTES, "a")));
      expect(atCap.ok).toBe(true);
      const over = await readBoundedBody(streamOf(Buffer.alloc(MAX_BODY_BYTES + 1, "a")));
      expect(over).toEqual({ ok: false, reason: "too-large" });
    });
  });

  describe("when the stream errors mid-body", () => {
    it("reports a stream error, not a partial body", async () => {
      const source = new Readable({
        read() {
          /* chunks are pushed by the test */
        },
      });
      const pending = readBoundedBody(source as unknown as IncomingMessage, 100);
      source.push(Buffer.from("par"));
      source.destroy(new Error("socket reset"));
      expect(await pending).toEqual({ ok: false, reason: "stream error" });
    });
  });
});

describe("handleBridgePost", () => {
  describe("when the method is not POST", () => {
    it("refuses with 405 and says POST is the allowed method", async () => {
      const { route } = echoRoute();
      const reply = await bridgePost(route, { method: "GET" });
      expect(reply.status).toBe(405);
      expect(reply.headers.get("allow")).toBe("POST");
      expect(reply.json).toEqual({ error: "method not allowed" });
    });

    it("judges the method before the secret, so an anonymous GET learns only 405", async () => {
      const { route } = echoRoute();
      const reply = await bridgePost(route, { method: "PUT" });
      expect(reply.status).toBe(405);
    });
  });

  describe("when the shared secret is missing or wrong", () => {
    it("refuses with 401 and never reads the body", async () => {
      const { route, accepted } = echoRoute();
      const reply = await bridgePost(route, { method: "POST", body: "{}" });
      expect(reply.status).toBe(401);
      expect(reply.json).toEqual({ error: "unauthorized" });
      expect(accepted).toEqual([]);
    });

    it("refuses a header carrying the wrong secret", async () => {
      const { route, accepted } = echoRoute();
      const reply = await bridgePost(route, {
        method: "POST",
        headers: { [INSIGHTS_BRIDGE_SECRET_HEADER]: "not-the-secret" },
        body: "{}",
      });
      expect(reply.status).toBe(401);
      expect(accepted).toEqual([]);
    });

    it("judges the secret before whether the route is configured", async () => {
      const { route } = echoRoute({ accept: undefined });
      const reply = await bridgePost(route, { method: "POST", body: "{}" });
      expect(reply.status).toBe(401);
    });
  });

  describe("when the route has no writer configured", () => {
    it("answers 404 naming the route", async () => {
      const { route } = echoRoute({ name: "cond-scout", accept: undefined });
      const reply = await bridgePost(route, authed({ body: "{}" }));
      expect(reply.status).toBe(404);
      expect(reply.json).toEqual({ error: "cond-scout not configured" });
    });
  });

  describe("when the body is bad", () => {
    it("answers 413 too-large past the route's own cap, and writes nothing", async () => {
      const { route, accepted } = echoRoute({ maxBytes: 20 });
      const reply = await bridgePost(
        route,
        authed({ body: JSON.stringify({ k: "x".repeat(50) }) }),
      );
      expect(reply.status).toBe(413);
      expect(reply.json).toEqual({ error: "too-large" });
      expect(accepted).toEqual([]);
    });

    it("lets a body of exactly the route's cap through", async () => {
      const body = JSON.stringify({ k: "x" });
      const { route, accepted } = echoRoute({ maxBytes: Buffer.byteLength(body) });
      const reply = await bridgePost(route, authed({ body }));
      expect(reply.status).toBe(200);
      expect(accepted).toEqual([{ k: "x" }]);
    });

    it("answers 400 malformed json for text that is not JSON", async () => {
      const { route, accepted } = echoRoute();
      const reply = await bridgePost(route, authed({ body: "{not json" }));
      expect(reply.status).toBe(400);
      expect(reply.json).toEqual({ error: "malformed json" });
      expect(accepted).toEqual([]);
    });

    it("hands the parser undefined for an empty body, which answers the route's invalid message", async () => {
      const seen: unknown[] = [];
      const { route, accepted } = echoRoute({
        invalid: "need a record",
        parse: (value) => {
          seen.push(value);
          return undefined;
        },
      });
      const reply = await bridgePost(route, authed());
      expect(reply.status).toBe(400);
      expect(reply.json).toEqual({ error: "need a record" });
      expect(seen).toEqual([undefined]);
      expect(accepted).toEqual([]);
    });

    it("answers 400 with the route's invalid message when the parser rejects the shape", async () => {
      const { route, accepted } = echoRoute({
        invalid: "bad insight",
        parse: (v) => (typeof v === "object" && v !== null && !Array.isArray(v) ? v : undefined),
      });
      const reply = await bridgePost(route, authed({ body: "[1,2]" }));
      expect(reply.status).toBe(400);
      expect(reply.json).toEqual({ error: "bad insight" });
      expect(accepted).toEqual([]);
    });

    it("treats a JSON null body as parsed input, not as an empty body", async () => {
      const seen: unknown[] = [];
      const { route } = echoRoute({
        parse: (value) => {
          seen.push(value);
          return undefined;
        },
      });
      await bridgePost(route, authed({ body: "null" }));
      expect(seen).toEqual([null]);
    });
  });

  describe("when the request is valid", () => {
    it("hands the parsed value to the writer and answers ok", async () => {
      const { route, accepted } = echoRoute();
      const reply = await bridgePost(route, authed({ body: '{"symbol":"NVDA"}' }));
      expect(reply.status).toBe(200);
      expect(reply.headers.get("content-type")).toBe("application/json; charset=utf-8");
      expect(reply.json).toEqual({ ok: true });
      expect(accepted).toEqual([{ symbol: "NVDA" }]);
    });

    it("hands the writer the parser's output, not the raw JSON", async () => {
      const { route, accepted } = echoRoute({
        parse: (value) => ({ wrapped: value }),
      });
      await bridgePost(route, authed({ body: "5" }));
      expect(accepted).toEqual([{ wrapped: 5 }]);
    });

    it("merges what the writer returns into the ok body", async () => {
      const { route } = echoRoute({ accept: () => ({ id: 42, stored: true }) });
      const reply = await bridgePost(route, authed({ body: "{}" }));
      expect(reply.status).toBe(200);
      expect(reply.json).toEqual({ ok: true, id: 42, stored: true });
    });
  });

  describe("when the writer throws", () => {
    it("answers 502 without leaking the error, and warns with the route name", async () => {
      const warnings: string[] = [];
      const warn = rstest.spyOn(process, "emitWarning").mockImplementation((warning) => {
        warnings.push(String(warning));
      });
      try {
        const { route } = echoRoute({
          name: "decisions",
          accept: () => {
            throw new Error("disk full at /var/secret/path");
          },
        });
        const reply = await bridgePost(route, authed({ body: "{}" }));
        expect(reply.status).toBe(502);
        expect(reply.json).toEqual({ error: "write failed" });
        expect(warnings).toHaveLength(1);
        expect(warnings[0]).toContain("decisions");
        expect(warnings[0]).toContain("write failed");
      } finally {
        warn.mockRestore();
      }
    });
  });
});
