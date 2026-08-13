import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import {
  INSIGHTS_BRIDGE_SECRET_HEADER,
  INSIGHTS_BRIDGE_SHARED_SECRET,
  type InsightRecord,
  parseInsightRecord,
} from "../autonomous/insight-record.js";

/**
 * One insight record, JSON-encoded, is a few hundred bytes at most. 16 KB is generous headroom
 * without letting a hostile/broken caller hold the process's memory hostage streaming a body.
 */
const MAX_BODY_BYTES = 16 * 1024;

export interface InsightsListenerConfig {
  readonly record: (entry: InsightRecord) => Promise<void>;
}

/**
 * Resolves the port the insights listener binds to. **Must never collide with `[http_service]
 * internal_port` (8787, `fly.toml`)** — that's the whole isolation mechanism this listener relies
 * on. Defaults to 8788; overridable via `SKYNET_INSIGHTS_BRIDGE_PORT` for local dev port clashes.
 */
export function resolveInsightsBridgePort(env: NodeJS.ProcessEnv): number {
  const candidate = env.SKYNET_INSIGHTS_BRIDGE_PORT;
  const parsed = candidate ? Number(candidate) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 8788;
}

/**
 * The internal-only insight bridge (`docs/plans/trade-insights-loop.md`, slice 2) — the `app`
 * process's side of the `bots` → `app` insight relay. Bind this to a port deliberately NOT
 * declared in `fly.toml`'s `[http_service]`: Fly's public Anycast proxy only forwards traffic to
 * the port(s) named there, so an undeclared port is unreachable from the public internet — only
 * from other machines in the *same Fly app* over the private 6PN network (verified against
 * fly.io/docs/networking/private-networking/; see the PR description for what was checked). The
 * shared-secret header below is defense-in-depth on top of that, never a substitute for it.
 *
 * Every branch here is wrapped so a malformed/oversized/hostile payload can only ever produce an
 * HTTP error response — never an uncaught exception. This process ALSO serves the public
 * dashboard (a separate `http.Server`, same Node process): a crash here is a real production
 * outage, not a quietly dropped log line, so failing closed with a response is not optional.
 */
export function createInsightsListener(config: InsightsListenerConfig): Server {
  return createServer((req, res) => {
    void handleInsightPost(req, res, config).catch((error: unknown) => {
      // Last-resort net: handleInsightPost() already catches everything it can reason about, but nothing
      // here may ever escape to become an uncaught exception on the shared process. `process
      // .emitWarning`, not `console` — this is library code, and the repo reserves console for
      // scripts (see jsonl-store.ts).
      process.emitWarning(`[insights-listener] unhandled error: ${String(error)}`);
      if (!res.headersSent) {
        respond(res, 500, { error: "internal error" });
      } else {
        res.end();
      }
    });
  });
}

/** JSON in, JSON out — matches `fetchJson` (`src/http/fetch-json.ts`), the client's one fetch
 * call site, which parses every response body as JSON regardless of status. */
function respond(res: ServerResponse, status: number, body: Record<string, unknown>): void {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

async function handleInsightPost(
  req: IncomingMessage,
  res: ServerResponse,
  config: InsightsListenerConfig,
): Promise<void> {
  const path = (req.url ?? "/").split("?")[0];
  if (path !== "/insights") {
    respond(res, 404, { error: "not found" });
    return;
  }
  if (req.method !== "POST") {
    res.setHeader("allow", "POST");
    respond(res, 405, { error: "method not allowed" });
    return;
  }
  if (req.headers[INSIGHTS_BRIDGE_SECRET_HEADER] !== INSIGHTS_BRIDGE_SHARED_SECRET) {
    respond(res, 401, { error: "unauthorized" });
    return;
  }

  const bodyResult = await readBoundedBody(req);
  if (!bodyResult.ok) {
    // A mid-stream socket error means the connection is very likely already unusable — writing
    // here is best-effort (wrapped so a write failure can't become an uncaught exception), never
    // load-bearing for correctness.
    try {
      respond(res, bodyResult.reason === "too-large" ? 413 : 400, { error: bodyResult.reason });
    } catch {
      /* socket already gone — nothing left to respond to */
    }
    return;
  }
  const { body } = bodyResult;

  let parsed: unknown;
  try {
    parsed = body.length > 0 ? JSON.parse(body) : undefined;
  } catch {
    respond(res, 400, { error: "malformed json" });
    return;
  }

  const record = parseInsightRecord(parsed);
  if (!record) {
    respond(res, 400, { error: "invalid insight record" });
    return;
  }

  try {
    await config.record(record);
  } catch (error) {
    process.emitWarning(`[insights-listener] write failed: ${String(error)}`);
    respond(res, 502, { error: "write failed" });
    return;
  }

  respond(res, 200, { ok: true });
}

type BodyResult =
  | { readonly ok: true; readonly body: string }
  | { readonly ok: false; readonly reason: "too-large" | "stream error" };

/**
 * Reads the request body, never buffering past `MAX_BODY_BYTES`. Once the cap is crossed it stops
 * retaining further chunks (so a hostile/oversized body can't grow this process's memory) but
 * deliberately does NOT tear down the socket — this listener only reaches here after the
 * shared-secret check above passes, so the caller is always the `bots` process, never an
 * unauthenticated stranger; destroying the connection mid-body-write (as an earlier version of
 * this function did) raced the client's own request write and surfaced as a hard connection
 * reset instead of a clean 413. Letting the stream finish and *then* responding is both simpler
 * and more correct.
 */
function readBoundedBody(req: IncomingMessage): Promise<BodyResult> {
  return new Promise((resolve) => {
    let bytes = 0;
    let oversized = false;
    const chunks: Buffer[] = [];
    let settled = false;
    const finish = (result: BodyResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    req.on("data", (chunk: Buffer) => {
      bytes += chunk.length;
      if (bytes > MAX_BODY_BYTES) {
        oversized = true;
        chunks.length = 0; // stop holding retained bytes once we know we'll reject the body
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      finish(
        oversized
          ? { ok: false, reason: "too-large" }
          : { ok: true, body: Buffer.concat(chunks).toString("utf8") },
      );
    });
    req.on("error", () => finish({ ok: false, reason: "stream error" }));
  });
}
